require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const studentRoutes = require("./routes/studentRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const marksRoutes = require("./routes/marksRoutes");
const resultRoutes = require("./routes/resultRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const templateRoutes = require("./routes/templateRoutes");

const protect = require("./middleware/authMiddleware");
const tenantMiddleware = require("./middleware/tenantMiddleware");

dotenv.config();

connectDB();

const app = express();
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student Management System API is running!"
  });
});

// ==========================================
// AUTH & TEST (No tenant scoping)
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);

// ==========================================
// ORGANIZATION ROUTES (Platform level)
// ==========================================
app.use("/api/organizations", organizationRoutes);

// ==========================================
// TENANT-SCOPED ROUTES (Require auth + tenant)
// ==========================================
app.use("/api/students", protect, tenantMiddleware, studentRoutes);
app.use("/api/faculty", protect, tenantMiddleware, facultyRoutes);
app.use("/api/subjects", protect, tenantMiddleware, subjectRoutes);
app.use("/api/attendance", protect, tenantMiddleware, attendanceRoutes);
app.use("/api/marks", protect, tenantMiddleware, marksRoutes);
app.use("/api/results", protect, tenantMiddleware, resultRoutes);
app.use("/api/templates", protect, tenantMiddleware, templateRoutes);


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

