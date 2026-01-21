const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createSession, getTeamSessions, getMySessions } = require("../controllers/sessionController");

router.post("/create", auth, createSession);
router.get("/team/:teamId", auth, getTeamSessions);
router.get("/my", auth, getMySessions);

module.exports = router;
