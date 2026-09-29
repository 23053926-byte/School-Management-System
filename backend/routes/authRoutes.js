const express = require("express");

const {
  register,
  login,
  uploadProfilePicture
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// ==========================================
// UPLOAD PROFILE PICTURE
// ==========================================
router.post(
  "/profile-picture",
  protect,
  upload.single("profilePicture"),
  uploadProfilePicture
);

module.exports = router;
