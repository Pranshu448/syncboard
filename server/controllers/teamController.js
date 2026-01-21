const Team = require("../models/Team");
const User = require("../models/User");
const crypto = require("crypto");

// Generate short human-readable team code
function generateTeamCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. A3F9BC
}

// POST /api/teams/create
exports.createTeam = async (req, res) => {
  try {
    const userId = req.user;
    const { name } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const teamName =
      (name && name.trim()) || `${user.username || "My"}'s Team`;

    let code;
    // guard against very rare collisions
    // eslint-disable-next-line no-constant-condition
    while (true) {
      code = generateTeamCode();
      const exists = await Team.findOne({ code });
      if (!exists) break;
    }

    const team = await Team.create({
      name: teamName,
      code,
      createdBy: userId,
      members: [userId],
    });

    user.teams.push(team._id);
    await user.save();

    res.json({ teamId: team._id, name: team.name, code: team.code });
  } catch (err) {
    console.error("createTeam error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/teams/join
exports.joinTeam = async (req, res) => {
  try {
    const userId = req.user;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Team code is required" });
    }

    const team = await Team.findOne({ code: String(code).trim().toUpperCase() });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already in team (in user.teams)
    if (!user.teams.includes(team._id)) {
      user.teams.push(team._id);
      await user.save();
    }

    if (!team.members.some((m) => m.toString() === userId)) {
      team.members.push(userId);
      await team.save();
    }

    res.json({ teamId: team._id, name: team.name, code: team.code });
  } catch (err) {
    console.error("joinTeam error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teams/me
exports.getMyTeams = async (req, res) => {
  try {
    const user = await User.findById(req.user).populate({
      path: "teams",
      populate: {
        path: "members",
        select: "username email",
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.teams || []);
  } catch (err) {
    console.error("getMyTeams error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teams/:teamId/members
exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId).populate(
      "members",
      "username email"
    );

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is a member of this team
    if (!team.members.some(member => member._id.toString() === req.user)) {
      return res.status(403).json({ message: "Not authorized to view members of this team" });
    }

    res.json(team.members);
  } catch (err) {
    console.error("getTeamMembers error:", err);
    res.status(500).json({ message: err.message });
  }
};

