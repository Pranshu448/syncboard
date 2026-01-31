const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

const upload = require("../middleware/uploadMiddleware");

// Public & Protected Routes
router.get("/", authMiddleware, userController.getUsers);
router.get("/dashboard", authMiddleware, userController.getDashboardStats);
router.post("/profile-picture", authMiddleware, upload.single("profilePicture"), userController.uploadProfilePicture);

module.exports = router;
