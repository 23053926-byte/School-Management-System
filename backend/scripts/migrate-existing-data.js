require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Organization = require("../models/Organization");
const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Marks = require("../models/Marks");

const migrate = async () => {
  try {
    console.log("🔄 Starting migration to Phase 2 (Organization Layer)...\n");

    await connectDB();
    console.log("✓ Connected to MongoDB\n");

    // ==========================================
    // STEP 1: Check if migration already done
    // ==========================================
    const existingOrg = await Organization.findOne({ name: "Default School" });

    if (existingOrg) {
      console.log("⚠️  Migration already completed. Default School exists.");
      console.log(`   Organization ID: ${existingOrg._id}`);
      console.log(`   Academic Year: ${existingOrg.academicYear}\n`);
      process.exit(0);
    }

    // ==========================================
    // STEP 2: Create Default School Organization
    // ==========================================
    console.log("📋 Creating 'Default School' organization...");

    const defaultOrg = await Organization.create({
      name: "Default School",
      address: "Not specified",
      city: "Not specified",
      state: "Not specified",
      pincode: "000000",
      contactEmail: "contact@defaultschool.edu",
      contactPhone: "+91-0000000000",
      website: "https://defaultschool.edu",
      academicYear: new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString(),
      principal: {
        name: "Principal",
        email: "principal@defaultschool.edu",
        phone: "+91-0000000000"
      },
      branding: {
        primaryColor: "#1976d2",
        secondaryColor: "#424242",
        accentColor: "#ff4081"
      }
    });

    console.log(`✓ Default School created`);
    console.log(`  - ID: ${defaultOrg._id}`);
    console.log(`  - Academic Year: ${defaultOrg.academicYear}\n`);

    // ==========================================
    // STEP 3: Migrate existing data
    // ==========================================

    const stats = {
      users: 0,
      students: 0,
      faculties: 0,
      subjects: 0,
      attendances: 0,
      marks: 0,
      failed: 0
    };

    // Migrate Users
    console.log("🔄 Migrating Users...");
    const usersWithoutOrg = await User.find({ organizationId: { $exists: false } });
    if (usersWithoutOrg.length > 0) {
      await User.updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: defaultOrg._id } }
      );
      stats.users = usersWithoutOrg.length;
      console.log(`✓ Migrated ${usersWithoutOrg.length} users\n`);
    } else {
      console.log("✓ No users to migrate\n");
    }

    // Migrate Students
    console.log("🔄 Migrating Students...");
    const studentsWithoutOrg = await Student.find({ organizationId: { $exists: false } });
    if (studentsWithoutOrg.length > 0) {
      await Student.updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: defaultOrg._id } }
      );
      stats.students = studentsWithoutOrg.length;
      console.log(`✓ Migrated ${studentsWithoutOrg.length} students\n`);
    } else {
      console.log("✓ No students to migrate\n");
    }

    // Migrate Faculties
    console.log("🔄 Migrating Faculties...");
    const facultiesWithoutOrg = await Faculty.find({ organizationId: { $exists: false } });
    if (facultiesWithoutOrg.length > 0) {
      await Faculty.updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: defaultOrg._id } }
      );
      stats.faculties = facultiesWithoutOrg.length;
      console.log(`✓ Migrated ${facultiesWithoutOrg.length} faculties\n`);
    } else {
      console.log("✓ No faculties to migrate\n");
    }

    // Migrate Subjects
    console.log("🔄 Migrating Subjects...");
    const subjectsWithoutOrg = await Subject.find({ organizationId: { $exists: false } });
    if (subjectsWithoutOrg.length > 0) {
      await Subject.updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: defaultOrg._id } }
      );
      stats.subjects = subjectsWithoutOrg.length;
      console.log(`✓ Migrated ${subjectsWithoutOrg.length} subjects\n`);
    } else {
      console.log("✓ No subjects to migrate\n");
    }

    // Migrate Attendance
    console.log("🔄 Migrating Attendance records...");
    const attendancesWithoutOrg = await Attendance.find({ organizationId: { $exists: false } });
    if (attendancesWithoutOrg.length > 0) {
      await Attendance.updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: defaultOrg._id } }
      );
      stats.attendances = attendancesWithoutOrg.length;
      console.log(`✓ Migrated ${attendancesWithoutOrg.length} attendance records\n`);
    } else {
      console.log("✓ No attendance records to migrate\n");
    }

    // Migrate Marks
    console.log("🔄 Migrating Marks...");
    const marksWithoutOrg = await Marks.find({ organizationId: { $exists: false } });
    if (marksWithoutOrg.length > 0) {
      await Marks.updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: defaultOrg._id } }
      );
      stats.marks = marksWithoutOrg.length;
      console.log(`✓ Migrated ${marksWithoutOrg.length} marks records\n`);
    } else {
      console.log("✓ No marks to migrate\n");
    }

    // ==========================================
    // STEP 4: Summary
    // ==========================================
    console.log("✅ Migration completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`  - Organization created: 1 (Default School)`);
    console.log(`  - Users migrated: ${stats.users}`);
    console.log(`  - Students migrated: ${stats.students}`);
    console.log(`  - Faculties migrated: ${stats.faculties}`);
    console.log(`  - Subjects migrated: ${stats.subjects}`);
    console.log(`  - Attendance records migrated: ${stats.attendances}`);
    console.log(`  - Marks records migrated: ${stats.marks}`);
    console.log(`\n💡 Tip: All data is now scoped to the 'Default School' organization.`);
    console.log(`   You can now create additional organizations and register users in them.\n`);

    process.exit(0);

  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error);
    process.exit(1);
  }
};

// Run migration
migrate();
