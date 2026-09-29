const User = require("../models/User");
const Organization = require("../models/Organization");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, role, organizationId } = req.body;

    // Validate required fields
    if (!name || !email || !password || !organizationId) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and organizationId are required"
      });
    }

    // Verify organization exists
    const organizationExists = await Organization.findById(organizationId);
    if (!organizationExists) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    // Check existing user in the same organization
    const existingUser = await User.findOne({ email, organizationId });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists in this organization"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      organizationId,
      name,
      email,
      password: hashedPassword,
      role: role || "student"
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        organizationId: user.organizationId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// Login
const login = async (req, res) => {
  try {
    const { email, password, organizationId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Build user search criteria
    const searchCriteria = { email };
    if (organizationId) {
      searchCriteria.organizationId = organizationId;
    }

    // Find user (or multiple users if email exists in multiple orgs and organizationId wasn't provided)
    const users = await User.find(searchCriteria).populate("organizationId", "name logo branding");

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // If multiple org accounts exist for same email and organizationId wasn't passed
    let user = users[0];
    if (users.length > 1 && !organizationId) {
      // Find matching password first
      const validUsers = [];
      for (const u of users) {
        if (await bcrypt.compare(password, u.password)) {
          validUsers.push(u);
        }
      }

      if (validUsers.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      if (validUsers.length > 1) {
        return res.status(300).json({
          success: false,
          message: "Multiple organizations found for this account. Please specify organizationId.",
          organizations: validUsers.map(u => ({
            organizationId: u.organizationId._id,
            organizationName: u.organizationId.name
          }))
        });
      }

      user = validUsers[0];
    } else {
      // Compare password
      const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
      );

      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
    }

    // Generate JWT including organizationId
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        organizationId: user.organizationId._id || user.organizationId
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        organizationId: user.organizationId._id || user.organizationId,
        organizationName: user.organizationId.name,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Profile picture upload
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image"
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.profilePicture = req.file.filename;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      profilePicture: req.file.filename
    });

  } catch (error) {
    console.error("Profile picture upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload profile picture"
    });
  }
};

module.exports = {
  register,
  login,
  uploadProfilePicture
};
