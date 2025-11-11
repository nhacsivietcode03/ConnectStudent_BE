const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../services/auth.service");
const { sendMail } = require("../utils/mailer");
const { getRegistrationOTPTemplate, getRegistrationSuccessTemplate, getResetPasswordOTPTemplate } = require("../utils/emailTemplates");

let refreshTokens = [];

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if email already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Email already in use"
      });
    }

    // Generate OTP code (6 digits)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create JWT token containing OTP with 15 minutes expiration
    const otpToken = jwt.sign(
      {
        type: "registration",
        email: email,
        code: otpCode
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "15m" }
    );

    // Send OTP email
    try {
      await sendMail({
        to: email,
        subject: "ConnectStudent Registration Verification Code",
        html: getRegistrationOTPTemplate(otpCode)
      });

      res.json({
        success: true,
        message: "OTP code has been sent to your email",
        otpToken: otpToken
      });
    } catch (mailError) {
      console.error("Mail error:", mailError);
      return res.status(500).json({
        success: false,
        message: "Unable to send email. Please try again later."
      });
    }
  } catch (e) {
    console.error("Send OTP error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ success: false, message: "Invalid email or password" });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  refreshTokens.push(refreshToken);

  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      major: user.major,
      avatar: user.avatar,
      bio: user.bio
    }
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password, major, avatar, bio, otpCode, otpToken } = req.body;

    if (!otpCode || !otpToken) {
      return res.status(400).json({
        success: false,
        message: "OTP code and token are required"
      });
    }

    // Verify OTP from JWT Token
    try {
      console.log("otpToken:", otpToken);
      console.log("secret:", process.env.JWT_SECRET);

      const decoded = jwt.verify(otpToken, process.env.JWT_SECRET || "your-secret-key");

      // Check token type
      if (decoded.type !== "registration") {
        return res.status(400).json({
          success: false,
          message: "Invalid token"
        });
      }

      // Check email matches
      if (decoded.email !== email) {
        return res.status(400).json({
          success: false,
          message: "Email does not match OTP"
        });
      }

      // Check OTP code matches
      if (decoded.code !== otpCode) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code"
        });
      }

      // JWT automatically checks expiration, will throw error if expired

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: "Verification code has expired. Please request a new code."
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid token"
      });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await User.create({
        username,
        email,
        password: hashed,
        role: 'student',
        major,
        avatar,
        bio
      });
    } catch (userError) {

      // Handle specific validation errors
      if (userError.name === 'ValidationError') {
        const errors = Object.values(userError.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: "Invalid data",
          errors: errors
        });
      }

      // Handle duplicate key errors
      if (userError.code === 11000) {
        const field = Object.keys(userError.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists in the system`
        });
      }

      throw userError;
    }

    // JWT token automatically expires, no need to mark as used

    try {
      await sendMail({
        to: user.email,
        subject: "Account Registration Successful",
        html: getRegistrationSuccessTemplate(user, 'http://localhost:3000')
      });
    } catch (e) {
    }

    res.status(201).json({
      success: true,
      message: "Account registration successful"
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const refreshToken = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "No token provided" });
  if (!refreshTokens.includes(token)) return res.status(403).json({ message: "Invalid token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key");
    const newAccessToken = generateAccessToken(payload.id);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

const logout = (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter(t => t !== token);
  res.json({ message: "Logged out successfully" });
};

const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Password information is required" });
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ success: false, message: "Current password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const sendOTPResetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email does not exist in the system"
      });
    }

    // Generate OTP code (6 digits)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create JWT token containing OTP with 15 minutes expiration
    const otpToken = jwt.sign(
      {
        type: "reset-password",
        email: email,
        code: otpCode
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "15m" }
    );

    // Send OTP email
    try {
      await sendMail({
        to: email,
        subject: "ConnectStudent Password Reset Verification Code",
        html: getResetPasswordOTPTemplate(user, otpCode)
      });

      res.json({
        success: true,
        message: "OTP code has been sent to your email",
        otpToken: otpToken
      });
    } catch (mailError) {
      console.error("Mail error:", mailError);
      return res.status(500).json({
        success: false,
        message: "Unable to send email. Please try again later."
      });
    }
  } catch (e) {
    console.error("Send OTP Reset Password error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otpCode, otpToken, newPassword } = req.body;

    if (!email || !otpCode || !otpToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Missing required information"
      });
    }

    // Validate password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Verify OTP from JWT Token
    try {
      const decoded = jwt.verify(otpToken, process.env.JWT_SECRET || "your-secret-key");

      // Check token type
      if (decoded.type !== "reset-password") {
        return res.status(400).json({
          success: false,
          message: "Invalid token"
        });
      }

      // Check email matches
      if (decoded.email !== email) {
        return res.status(400).json({
          success: false,
          message: "Email does not match OTP"
        });
      }

      // Check OTP code matches
      if (decoded.code !== otpCode) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code"
        });
      }
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: "Verification code has expired. Please request a new code."
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid token"
      });
    }

    // Find user and reset password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (e) {
    console.error("Reset Password error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { sendOTP, login, register, me, refreshToken, logout, changePassword, sendOTPResetPassword, resetPassword };