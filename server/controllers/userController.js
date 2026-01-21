const User = require("../models/User");
const Session = require("../models/Session");
const Team = require("../models/Team");
const Message = require("../models/Message");

// Get all users the current user can see in "Team" view
exports.getUsers = async (req, res) => {
  try {
    const currentUserId = req.user;

    const me = await User.findById(currentUserId);

    // If user has a team, only show members of that team (excluding themselves).
    // If not in a team yet, show all other users so the list isn't empty.
    const query = me?.team
      ? { _id: { $ne: currentUserId }, team: me.team }
      : { _id: { $ne: currentUserId } };

    const users = await User.find(query, "username email isOnline").sort({
      username: 1,
    });

    res.json(users);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get User's Teams
    const teams = await Team.find({ members: userId });
    const teamIds = teams.map((t) => t._id);

    // 2. Active Sessions Stats
    const totalSessions = await Session.countDocuments({ team: { $in: teamIds } });
    const sessionsToday = await Session.countDocuments({
      team: { $in: teamIds },
      createdAt: { $gte: today },
    });

    // 3. Team Members Stats
    const allMembers = teams.flatMap((t) => t.members);
    const uniqueMemberIds = [...new Set(allMembers.map((id) => id.toString()))];
    const teamMembersCount = uniqueMemberIds.length;

    // 4. Messages Stats
    const totalMessages = await Message.countDocuments({ sender: userId });
    const messagesToday = await Message.countDocuments({
      sender: userId,
      createdAt: { $gte: today },
    });

    // 5. Recent Sessions
    const recentSessions = await Session.find({ team: { $in: teamIds } })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate("team", "name")
      .populate("createdBy", "username");

    res.json({
      stats: {
        activeSessions: totalSessions,
        sessionsToday,
        teamMembers: teamMembersCount,
        messages: totalMessages,
        messagesToday,
      },
      recentSessions,
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

