// Email templates for ConnectStudent

const getBaseTemplate = (title, subtitle, content) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${content}
    </div>
  `;
};

const getHeader = (icon, title, subtitle, headerColor = "linear-gradient(135deg, #1890ff, #40a9ff)") => {
    return `
    <div style="background: ${headerColor}; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">${icon} ${title}</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">${subtitle}</p>
    </div>
  `;
};

const getBody = (content) => {
    return `
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
      ${content}
    </div>
  `;
};

const getOTPBox = (otpCode, color = "#1890ff") => {
    return `
    <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid ${color};">
      <h2 style="color: ${color}; margin: 0; font-size: 36px; letter-spacing: 5px;">${otpCode}</h2>
    </div>
  `;
};

const getFooter = () => {
    return `
    <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
      Thank you for trusting and using our service!<br>
      <em>ConnectStudent System</em>
    </p>
  `;
};

const getInfoTable = (items) => {
    const rows = items.map(item => `
    <tr>
      <td style="padding: 8px 0; color: #666;"><strong>${item.label}:</strong></td>
      <td style="padding: 8px 0; color: #333;">${item.value}</td>
    </tr>
  `).join('');

    return `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1890ff;">
      <h3 style="color: #1890ff; margin: 0 0 15px 0;">📋 Account Information</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${rows}
      </table>
    </div>
  `;
};

const getButton = (text, url, color = "#1890ff") => {
    return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        ${text}
      </a>
    </div>
  `;
};

// Registration OTP Email
const getRegistrationOTPTemplate = (otpCode) => {
    const header = getHeader("🔐", "Verification Code", "ConnectStudent Account Registration");

    const body = `
    <p style="font-size: 16px; color: #333;">Hello,</p>
    
    <p style="font-size: 15px; color: #666; line-height: 1.6;">
      Thank you for registering an account with ConnectStudent. 
      Your verification code is:
    </p>
    
    ${getOTPBox(otpCode)}
    
    <p style="font-size: 14px; color: #888; line-height: 1.6;">
      <strong>Note:</strong> This verification code is only valid for 15 minutes. 
      Please do not share this code with anyone.
    </p>
    
    <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
      If you did not request this code, please ignore this email.<br>
    </p>
    
    ${getFooter()}
  `;

    return getBaseTemplate("Registration OTP", "OTP", header + getBody(body));
};

// Registration Success Email
const getRegistrationSuccessTemplate = (user, frontendUrl) => {
    const header = getHeader("🎉", "Welcome!", "Account Registration Successful");

    const infoTable = getInfoTable([
        { label: "Username", value: user.username || 'N/A' },
        { label: "Email", value: user.email },
        { label: "Role", value: user.role || 'User' }
    ]);

    const body = `
    <p style="font-size: 16px; color: #333;">Hello <strong style="color: #1890ff;">${user.username || user.email}</strong>,</p>
    
    <p style="font-size: 15px; color: #666; line-height: 1.6;">
      Congratulations! You have successfully registered an account with ConnectStudent. 
      You can now start using our services.
    </p>
    
    ${infoTable}
    
    ${getButton("🚀 Login Now", `${frontendUrl}/login`)}
    
    ${getFooter()}
  `;

    return getBaseTemplate("Registration Success", "Welcome", header + getBody(body));
};

// Reset Password OTP Email
const getResetPasswordOTPTemplate = (user, otpCode) => {
    const header = getHeader("🔑", "Password Reset", "ConnectStudent", "linear-gradient(135deg, #ff6b6b, #ee5a6f)");

    const body = `
    <p style="font-size: 16px; color: #333;">Hello <strong>${user.username || user.email}</strong>,</p>
    
    <p style="font-size: 15px; color: #666; line-height: 1.6;">
      You have requested to reset your password for your ConnectStudent account. 
      Your verification code is:
    </p>
    
    ${getOTPBox(otpCode, "#ff6b6b")}
    
    <p style="font-size: 14px; color: #888; line-height: 1.6;">
      <strong>Note:</strong> This verification code is only valid for 15 minutes. 
      Please do not share this code with anyone.
    </p>
    
    <p style="font-size: 14px; color: #888; line-height: 1.6;">
      If you did not request a password reset, please ignore this email. 
      Your password will not be changed.
    </p>
    
    ${getFooter()}
  `;

    return getBaseTemplate("Reset Password OTP", "OTP", header + getBody(body));
};

module.exports = {
    getRegistrationOTPTemplate,
    getRegistrationSuccessTemplate,
    getResetPasswordOTPTemplate
};

