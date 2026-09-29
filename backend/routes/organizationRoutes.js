const express = require("express");
const {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  getOrganizationSettings
} = require("../controllers/organizationController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Public route for org branding/settings
router.get("/:id/settings", getOrganizationSettings);

// Public route for creating first organization (needed for initial setup)
router.post("/", createOrganization);

// Protected routes (Admin access)
router.get("/", protect, authorize("admin"), getOrganizations);
router.get("/:id", protect, authorize("admin"), getOrganizationById);
router.put("/:id", protect, authorize("admin"), updateOrganization);

module.exports = router;
