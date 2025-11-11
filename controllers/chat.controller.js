const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");

// Get or create conversation between two users
const getOrCreateConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (currentUserId.toString() === userId) {
            return res.status(400).json({ message: "Cannot create conversation with yourself" });
        }

        // Check if user exists
        const otherUser = await User.findById(userId);
        if (!otherUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find existing conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, userId] },
        })
            .populate("participants", "username email avatar")
            .populate("lastMessage");

        // Create new conversation if doesn't exist
        if (!conversation) {
            conversation = new Conversation({
                participants: [currentUserId, userId],
            });
            await conversation.save();
            await conversation.populate("participants", "username email avatar");
        }

        res.status(200).json({ conversation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all conversations for current user
const getConversations = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const conversations = await Conversation.find({
            participants: currentUserId,
        })
            .populate("participants", "username email avatar")
            .populate("lastMessage")
            .sort({ lastMessageAt: -1 });

        // Get unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversation: conv._id,
                    sender: { $ne: currentUserId },
                    readBy: { $not: { $elemMatch: { user: currentUserId } } },
                });

                // Get the other participant (not current user)
                const otherParticipant = conv.participants.find(
                    (p) => p._id.toString() !== currentUserId.toString()
                );

                return {
                    ...conv.toObject(),
                    unreadCount,
                    otherParticipant,
                };
            })
        );

        res.status(200).json({ conversations: conversationsWithUnread });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get messages for a conversation
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Check if user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (!conversation.participants.some((p) => p.toString() === currentUserId.toString())) {
            return res.status(403).json({ message: "Access denied" });
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username email avatar")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        // Mark messages as read
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: currentUserId },
                readBy: { $not: { $elemMatch: { user: currentUserId } } },
            },
            {
                $push: { readBy: { user: currentUserId, readAt: new Date() } },
                $set: { isRead: true },
            }
        );

        res.status(200).json({
            messages: messages.reverse(),
            page,
            limit,
            hasMore: messages.length === limit,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all users for chat (excluding current user)
const getChatUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const search = req.query.search || "";

        const users = await User.find({
            _id: { $ne: currentUserId },
            $or: [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ],
        })
            .select("username email avatar bio major")
            .limit(20);

        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getOrCreateConversation,
    getConversations,
    getMessages,
    getChatUsers,
};
