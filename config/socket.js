const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
const Notification = require("../models/notification.model");

let io = null;

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth.token ||
                socket.handshake.headers.authorization?.split(" ")[1];

            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            const secret = process.env.JWT_SECRET || "your-secret-key";
            const decoded = jwt.verify(token, secret);

            const user = await User.findById(decoded.id);
            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return next(new Error("Authentication error: Token expired"));
            } else if (error.name === "JsonWebTokenError") {
                return next(new Error("Authentication error: Invalid token"));
            }
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // Join user's personal room
        socket.join(`user_${socket.userId}`);

        // Join conversation rooms
        socket.on("join_conversation", async (conversationId) => {
            try {
                const conversation = await Conversation.findById(conversationId);
                if (
                    conversation &&
                    conversation.participants.some((p) => p.toString() === socket.userId)
                ) {
                    socket.join(`conversation_${conversationId}`);
                    socket.emit("joined_conversation", conversationId);
                } else {
                    socket.emit("error", { message: "Conversation not found or access denied" });
                }
            } catch (error) {
                socket.emit("error", { message: error.message });
            }
        });

        // Leave conversation room
        socket.on("leave_conversation", (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
        });

        // Send message
        socket.on("send_message", async (data) => {
            try {
                const { conversationId, content } = data;

                if (!conversationId || !content || !content.trim()) {
                    return socket.emit("error", { message: "Invalid message data" });
                }

                // Verify user is participant
                const conversation = await Conversation.findById(conversationId);
                if (
                    !conversation ||
                    !conversation.participants.some((p) => p.toString() === socket.userId)
                ) {
                    return socket.emit("error", {
                        message: "Conversation not found or access denied",
                    });
                }

                // Create message
                const message = new Message({
                    conversation: conversationId,
                    sender: socket.userId,
                    content: content.trim(),
                });

                await message.save();
                await message.populate("sender", "username email avatar");

                // Update conversation last message
                conversation.lastMessage = message._id;
                conversation.lastMessageAt = new Date();
                await conversation.save();

                // Emit to all participants in the conversation
                const messageData = {
                    _id: message._id,
                    conversation: message.conversation,
                    sender: {
                        _id: message.sender._id,
                        username: message.sender.username,
                        email: message.sender.email,
                        avatar: message.sender.avatar,
                    },
                    content: message.content,
                    readBy: message.readBy,
                    isRead: message.isRead,
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt,
                };

                io.to(`conversation_${conversationId}`).emit("new_message", messageData);

                // Notify other participant if they're not in the conversation room
                const otherParticipant = conversation.participants.find(
                    (p) => p.toString() !== socket.userId
                );
                if (otherParticipant) {
                    io.to(`user_${otherParticipant}`).emit("message_received", {
                        conversationId,
                        message: messageData,
                    });

                    // Check if recipient is currently viewing this conversation
                    const conversationRoom = io.sockets.adapter.rooms.get(
                        `conversation_${conversationId}`
                    );
                    let isViewingConversation = false;

                    if (conversationRoom) {
                        // Check if any socket in the room belongs to the recipient
                        for (const socketId of conversationRoom) {
                            const recipientSocket = io.sockets.sockets.get(socketId);
                            if (
                                recipientSocket &&
                                recipientSocket.userId === otherParticipant.toString()
                            ) {
                                isViewingConversation = true;
                                break;
                            }
                        }
                    }

                    // Only create notification if recipient is NOT viewing the conversation
                    if (!isViewingConversation) {
                        try {
                            const notification = new Notification({
                                recipient: otherParticipant,
                                sender: socket.userId,
                                type: "message",
                                conversation: conversationId,
                                message: message._id,
                                read: false,
                            });
                            await notification.save();
                            await notification.populate("sender", "username email avatar");

                            // Emit notification to recipient
                            io.to(`user_${otherParticipant}`).emit("new-notification", {
                                _id: notification._id,
                                recipient: notification.recipient,
                                sender: {
                                    _id: notification.sender._id,
                                    username: notification.sender.username,
                                    email: notification.sender.email,
                                    avatar: notification.sender.avatar,
                                },
                                type: notification.type,
                                conversation: notification.conversation,
                                message: notification.message,
                                read: notification.read,
                                createdAt: notification.createdAt,
                                updatedAt: notification.updatedAt,
                            });

                            // Emit unread count update
                            const unreadCount = await Notification.countDocuments({
                                recipient: otherParticipant,
                                read: false,
                            });
                            io.to(`user_${otherParticipant}`).emit("unread-count-update", {
                                count: unreadCount,
                            });
                        } catch (notifError) {
                            console.error("Error creating notification:", notifError);
                        }
                    }
                }
            } catch (error) {
                console.error("Send message error:", error);
                socket.emit("error", { message: error.message });
            }
        });

        // Mark messages as read
        socket.on("mark_as_read", async (data) => {
            try {
                const { conversationId } = data;

                const conversation = await Conversation.findById(conversationId);
                if (
                    !conversation ||
                    !conversation.participants.some((p) => p.toString() === socket.userId)
                ) {
                    return socket.emit("error", {
                        message: "Conversation not found or access denied",
                    });
                }

                await Message.updateMany(
                    {
                        conversation: conversationId,
                        sender: { $ne: socket.userId },
                        readBy: { $not: { $elemMatch: { user: socket.userId } } },
                    },
                    {
                        $push: { readBy: { user: socket.userId, readAt: new Date() } },
                        $set: { isRead: true },
                    }
                );

                // Notify sender that messages were read
                const otherParticipant = conversation.participants.find(
                    (p) => p.toString() !== socket.userId
                );
                if (otherParticipant) {
                    io.to(`user_${otherParticipant}`).emit("messages_read", {
                        conversationId,
                        readBy: socket.userId,
                    });
                }
            } catch (error) {
                console.error("Mark as read error:", error);
                socket.emit("error", { message: error.message });
            }
        });

        // Typing indicator
        socket.on("typing", (data) => {
            const { conversationId, isTyping } = data;
            socket.to(`conversation_${conversationId}`).emit("user_typing", {
                userId: socket.userId,
                username: socket.user.username,
                isTyping,
            });
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }
    return io;
};

module.exports = {
    initializeSocket,
    getIO,
};
