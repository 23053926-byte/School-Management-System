/**
 * SEED SCRIPT
 * -----------
 * 1. Connects to MongoDB.
 * 2. Builds / syncs all model indexes (big performance win).
 * 3. Creates default admin + faculty users if they don't already exist.
 *
 * Run once with:  npm run seed
 * The server auto-creates indexes when it starts, but this script
 * also gives you ready-to-use login credentials.
 */
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Organization = require("./models/Organization");
const User = require("./models/User");
const Student = require("./models/Student");
const Faculty = require("./models/Faculty");
const Subject = require("./models/Subject");
const Attendance = require("./models/Attendance");
const Marks = require("./models/Marks");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not found in .env — cannot connect.");
  process.exit(1);
}

const DEFAULT_ORG = {
  name: "Global Heights Academy",
  address: "123 Education Street",
  city: "Tech City",
  state: "State",
  pincode: "100001",
  contactEmail: "contact@globalheights.edu",
  contactPhone: "1234567890",
  academicYear: "2025-2026",
  principal: {
    name: "Dr. Alexander Smith",
    email: "principal@globalheights.edu",
    phone: "1234567891"
  }
};

const DEFAULT_USERS = [
  {
    name: "System Administrator",
    email: "admin@school.edu",
    password: "admin123",
    role: "admin"
  },
  {
    name: "Professor Faculty",
    email: "faculty@school.edu",
    password: "faculty123",
    role: "faculty"
  }
];

async function syncIndexes() {
  console.log("Syncing indexes...");
  const models = [Student, Faculty, Subject, Attendance, Marks];
  for (const model of models) {
    await model.init(); // ensures indexes are built
    console.log(`  ✓ ${model.modelName} indexes ready`);
  }
}

async function getOrCreateDefaultOrganization() {
  console.log("Checking default organization...");
  let org = await Organization.findOne({ name: DEFAULT_ORG.name, academicYear: DEFAULT_ORG.academicYear });
  if (!org) {
    org = await Organization.findOne();
  }
  if (!org) {
    org = await Organization.create(DEFAULT_ORG);
    console.log(`  ✓ Created default organization: ${org.name}`);
  } else {
    console.log(`  • Default organization found: ${org.name} (${org._id})`);
  }
  return org;
}

async function seedUsers(orgId) {
  console.log("Seeding default users...");
  for (const u of DEFAULT_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      if (!existing.organizationId) {
        existing.organizationId = orgId;
        await existing.save();
        console.log(`  ✓ Updated existing user ${u.email} with organizationId`);
      } else {
        console.log(`  • ${u.email} already exists (skipped)`);
      }
      continue;
    }
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await User.create({
      organizationId: orgId,
      name: u.name,
      email: u.email,
      password: hashedPassword,
      role: u.role
    });
    console.log(`  ✓ Created ${u.role}: ${u.email}`);
  }
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected.");

    await syncIndexes();
    const defaultOrg = await getOrCreateDefaultOrganization();
    await seedUsers(defaultOrg._id);

    console.log("\nDone! Login credentials:");
    console.log("  Admin  → admin@school.edu / admin123");
    console.log("  Faculty→ faculty@school.edu / faculty123");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();