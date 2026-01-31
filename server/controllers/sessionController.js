const Session = require("../models/Session");
const User = require("../models/User");
const { getRoomState } = require("../utils/whiteboardState");

// POST /api/sessions/create
exports.createSession = async (req, res) => {
    try {
        const userId = req.user;
        const { name, teamId } = req.body;

        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required" });
        }

        // Generate unique roomId
        const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const session = await Session.create({
            name: name || "Untitled Session",
            roomId,
            team: teamId,
            createdBy: userId,
        });

        res.json(session);
    } catch (err) {
        console.error("createSession error:", err);
        res.status(500).json({ message: err.message });
    }
};

// GET /api/sessions/team/:teamId
exports.getTeamSessions = async (req, res) => {
    try {
        const { teamId } = req.params;

        // Fetch sessions sorted by newest first
        const sessions = await Session.find({ team: teamId })
            .sort({ createdAt: -1 })
            .populate("createdBy", "username profilePicture");

        // Enhance with live participant count
        const sessionsWithStats = sessions.map((session) => {
            const roomState = getRoomState(session.roomId);
            return {
                ...session.toObject(),
                activeParticipants: roomState.participants.size,
            };
        });

        res.json(sessionsWithStats);
    } catch (err) {
        console.error("getTeamSessions error:", err);
        res.status(500).json({ message: err.message });
    }
};

// GET /api/sessions/my (get sessions from all my teams)
exports.getMySessions = async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if (!user) return res.status(404).json({ message: "User not found" });

        const sessions = await Session.find({ team: { $in: user.teams } })
            .sort({ createdAt: -1 })
            .populate("createdBy", "username profilePicture")
            .populate("team", "name");

        const sessionsWithStats = sessions.map((session) => {
            const roomState = getRoomState(session.roomId);
            return {
                ...session.toObject(),
                activeParticipants: roomState.participants.size,
            };
        });

        res.json(sessionsWithStats);
    } catch (err) {
        console.error("getMySessions error:", err);
        res.status(500).json({ message: err.message });
    }
};
