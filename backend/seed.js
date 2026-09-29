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

async function seedUsers() {
  console.log("Seeding default users...");
  for (const u of DEFAULT_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`  • ${u.email} already exists (skipped)`);
      continue;
    }
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await User.create({
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
    await seedUsers();

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