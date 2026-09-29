const Organization = require("../models/Organization");
const mongoose = require("mongoose");

// ==========================================
// CREATE ORGANIZATION
// ==========================================
const createOrganization = async (req, res) => {
  try {
    const organization = await Organization.create(req.body);

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization
    });
  } catch (error) {
    console.error("Create organization error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An organization with this name already exists for this academic year"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create organization"
    });
  }
};

// ==========================================
// GET ALL ORGANIZATIONS (Platform Level)
// ==========================================
const getOrganizations = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { contactEmail: { $regex: search, $options: "i" } }
      ];
    }

    let currentPage = Math.max(1, Number(page) || 1);
    let itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const totalOrganizations = await Organization.countDocuments(filter);
    const organizations = await Organization.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    res.status(200).json({
      success: true,
      count: organizations.length,
      totalOrganizations,
      currentPage,
      itemsPerPage,
      totalPages: Math.ceil(totalOrganizations / itemsPerPage),
      organizations
    });
  } catch (error) {
    console.error("Get organizations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organizations"
    });
  }
};

// ==========================================
// GET SINGLE ORGANIZATION
// ==========================================
const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    res.status(200).json({
      success: true,
      organization
    });
  } catch (error) {
    console.error("Get organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organization"
    });
  }
};

// ==========================================
// UPDATE ORGANIZATION
// ==========================================
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const organization = await Organization.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      organization
    });
  } catch (error) {
    console.error("Update organization error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Organization name already exists for this academic year"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update organization"
    });
  }
};

// ==========================================
// GET PUBLIC SETTINGS & BRANDING
// ==========================================
const getOrganizationSettings = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const organization = await Organization.findById(id).select(
      "name logo academicYear branding contactEmail contactPhone address city state pincode website"
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    res.status(200).json({
      success: true,
      settings: organization
    });
  } catch (error) {
    console.error("Get organization settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organization settings"
    });
  }
};

module.exports = {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  getOrganizationSettings
};
