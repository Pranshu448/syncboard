const User = require("../models/User");

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

