const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authMiddleware);

// Get or create conversation with a user
router.get("/conversation/:userId", chatController.getOrCreateConversation);

// Get all conversations for current user
router.get("/conversations", chatController.getConversations);

// Get messages for a conversation
router.get("/messages/:conversationId", chatController.getMessages);

// Get users for chat
router.get("/users", chatController.getChatUsers);

module.exports = router;
