const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "like",
                "comment",
                "follow_request",
                "follow_accept",
                "follow_reject",
                "message",
            ],
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: false,
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
        followRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Follow",
        },
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
        },
        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
