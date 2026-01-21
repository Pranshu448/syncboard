const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

// Public & Protected Routes
router.get("/", authMiddleware, userController.getUsers);
router.get("/dashboard", authMiddleware, userController.getDashboardStats);

module.exports = router;
