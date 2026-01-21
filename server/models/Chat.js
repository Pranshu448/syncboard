const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
        isGroup: {
            type: Boolean,
            default: false,
        },
        chatName: {
            type: String,
            trim: true,
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Chat", chatSchema);