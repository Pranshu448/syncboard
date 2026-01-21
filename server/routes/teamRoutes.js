const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createTeam, joinTeam, getMyTeams, getTeamMembers, deleteTeam } = require("../controllers/teamController");

router.post("/create", auth, createTeam);
router.post("/join", auth, joinTeam);
router.get("/me", auth, getMyTeams);
router.get("/:teamId/members", auth, getTeamMembers);
router.delete("/:id", auth, deleteTeam);

module.exports = router;

