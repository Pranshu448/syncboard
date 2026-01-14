const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createTeam, joinTeam, getMyTeam } = require("../controllers/teamController");

router.post("/create", auth, createTeam);
router.post("/join", auth, joinTeam);
router.get("/me", auth, getMyTeam);

module.exports = router;

