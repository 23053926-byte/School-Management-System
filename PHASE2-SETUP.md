# Phase 2 Setup & Testing Guide

## Prerequisites
- Node.js 22.x
- npm 10.x
- MongoDB (Atlas or local)
- VS Code or any terminal

## 1. Backend Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `backend/.env` and set:
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/school_db
JWT_SECRET=your-secret-key-here
NODE_ENV=development

# Email (optional for now)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 3: Run Migration (One-time only)
This creates the "Default School" organization and assigns all existing data to it:

```bash
node scripts/migrate-existing-data.js
```

**Output should show:**
```
✓ Connected to MongoDB
📋 Creating 'Default School' organization...
✓ Default School created
✓ Migrated X users
✓ Migrated X students
✓ Migrated X faculties
... etc
✅ Migration completed successfully!
```

### Step 4: Start Backend Server
```bash
npm run dev
```

**Success message:**
```
Server running on http://localhost:5000
```

---

## 2. Frontend Setup

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Frontend
```bash
npm start
```

Frontend will open at **http://localhost:4200**

---

## 3. Test Data & Login Credentials

### Option A: Use Existing Data (After Migration)

If you had users before Phase 2 migration, they're all assigned to "Default School" org.

**Find your organization ID:**
```bash
# In MongoDB, run:
db.organizations.findOne({ name: "Default School" })
# Copy the _id value
```

**Login with existing users:**
- Email: (any existing user email)
- Password: (their original password)
- OrganizationId: (from above query)

### Option B: Create Test Data from Scratch

#### Step 1: Create Organization via API

Use Postman or `curl`:

```bash
curl -X POST http://localhost:5000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Techno India University",
    "address": "Plot No. 1, Sector V, Salt Lake",
    "city": "Kolkata",
    "state": "West Bengal",
    "pincode": "700091",
    "contactEmail": "admin@tiu.edu",
    "contactPhone": "+91-9876543210",
    "website": "https://www.technoindia.edu",
    "academicYear": "2024-2025",
    "principal": {
      "name": "Dr. Santosh Kumar",
      "email": "principal@tiu.edu",
      "phone": "+91-9123456789"
    },
    "branding": {
      "primaryColor": "#003366",
      "secondaryColor": "#666666",
      "accentColor": "#ff6600"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "organization": {
    "_id": "copy-this-id",
    "name": "Techno India University",
    ...
  }
}
```

**Copy the `_id` value** — you'll need it for registration.

#### Step 2: Register Test User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@tiu.edu",
    "password": "Admin@123",
    "role": "admin",
    "organizationId": "PASTE-THE-ID-FROM-ABOVE"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "organizationId": "...",
    "name": "Admin User",
    "email": "admin@tiu.edu",
    "role": "admin"
  }
}
```

#### Step 3: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tiu.edu",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "organizationId": "...",
    "organizationName": "Techno India University",
    "name": "Admin User",
    "email": "admin@tiu.edu",
    "role": "admin"
  }
}
```

**Save the token** — use it for all subsequent API calls.

---

## 4. Login in Frontend

### At http://localhost:4200

1. Click **Login**
2. Enter credentials:
   - **Email:** admin@tiu.edu
   - **Password:** Admin@123
3. Click **Submit**

You should see the **Admin Dashboard** with your organization context.

---

## 5. Create Test Data (Students, Faculty, Subjects)

### Create a Faculty Member

```bash
curl -X POST http://localhost:5000/api/faculty \
  -H "Authorization: Bearer YOUR-TOKEN-HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "facultyId": "FAC001",
    "name": "Dr. Rajesh Singh",
    "email": "rajesh.singh@tiu.edu",
    "phone": "+91-9123456780",
    "gender": "Male",
    "department": "Computer Science",
    "designation": "Professor",
    "qualification": "PhD in CS",
    "experience": 10,
    "joiningDate": "2015-01-15",
    "address": "123 Main Street, Kolkata"
  }'
```

### Create a Subject

```bash
curl -X POST http://localhost:5000/api/subjects \
  -H "Authorization: Bearer YOUR-TOKEN-HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "CS101",
    "subjectCode": "CS101",
    "subjectName": "Data Structures",
    "department": "Computer Science",
    "course": "B.Tech",
    "semester": "2nd",
    "credits": 4,
    "faculty": "FACULTY-ID-FROM-CREATION",
    "description": "Learn fundamental data structures"
  }'
```

### Create a Student

```bash
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR-TOKEN-HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "name": "John Doe",
    "email": "john.doe@tiu.edu",
    "phone": "+91-9876543210",
    "dateOfBirth": "2003-05-15",
    "gender": "Male",
    "address": "456 Oak Avenue, Kolkata",
    "department": "Computer Science",
    "course": "B.Tech",
    "semester": "2nd",
    "admissionYear": 2022
  }'
```

---

## 6. Multi-Organization Example

### Create Another Organization

```bash
curl -X POST http://localhost:5000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Delhi Public School",
    "address": "Plot No. 5, New Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "pincode": "110016",
    "contactEmail": "admin@dps.edu",
    "contactPhone": "+91-9876543211",
    "website": "https://www.dpsdelhi.edu",
    "academicYear": "2024-2025",
    "principal": {
      "name": "Dr. Priya Sharma",
      "email": "principal@dps.edu",
      "phone": "+91-9123456790"
    },
    "branding": {
      "primaryColor": "#1e40af",
      "secondaryColor": "#404040",
      "accentColor": "#f59e0b"
    }
  }'
```

### Register User in New Organization

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DPS Admin",
    "email": "admin@dps.edu",
    "password": "DPS@Admin123",
    "role": "admin",
    "organizationId": "NEW-ORG-ID"
  }'
```

### Login to DPS Organization

Students and faculty in TIU cannot see DPS data, and vice versa. Complete isolation! ✅

---

## 7. Troubleshooting

### "organizationId is required" Error
**Cause:** Migration script not run yet  
**Solution:** 
```bash
node scripts/migrate-existing-data.js
```

### "Organization not found" During Registration
**Cause:** Invalid organizationId  
**Solution:** Verify organization exists:
```bash
curl http://localhost:5000/api/organizations
```

### "Invalid or expired token" Error
**Cause:** Token is missing or expired  
**Solution:** Login again and use fresh token

### "Access denied. You do not have permission" Error
**Cause:** User role doesn't have access to that endpoint (e.g., student trying to create faculty)  
**Solution:** Use admin or faculty account

### "Student not found" After Creating
**Cause:** Querying wrong organization  
**Solution:** Ensure token and organizationId match

---

## 8. API Endpoints Summary

| Endpoint | Method | Auth | Org Scoped | Purpose |
|----------|--------|------|-----------|---------|
| `/api/auth/register` | POST | ❌ | ❌ | Register user in org |
| `/api/auth/login` | POST | ❌ | ❌ | Login user |
| `/api/organizations` | POST | ✅ | ❌ | Create organization (admin) |
| `/api/organizations` | GET | ✅ | ❌ | List all organizations |
| `/api/organizations/:id` | GET | ✅ | ❌ | Get org details |
| `/api/organizations/:id/settings` | GET | ❌ | ❌ | Public branding/settings |
| `/api/students` | GET | ✅ | ✅ | List org's students |
| `/api/students` | POST | ✅ | ✅ | Create student in org |
| `/api/students/:id` | PUT | ✅ | ✅ | Update student |
| `/api/students/:id` | DELETE | ✅ | ✅ | Delete student |
| `/api/faculty` | GET | ✅ | ✅ | List org's faculty |
| `/api/faculty` | POST | ✅ | ✅ | Create faculty in org |
| `/api/subjects` | GET | ✅ | ✅ | List org's subjects |
| `/api/subjects` | POST | ✅ | ✅ | Create subject in org |
| `/api/attendance` | GET | ✅ | ✅ | List org's attendance |
| `/api/marks` | GET | ✅ | ✅ | List org's marks |

---

## 9. Quick Start (Copy-Paste)

```bash
# Terminal 1: Backend
cd backend
npm install
node scripts/migrate-existing-data.js
npm run dev

# Terminal 2: Frontend (wait for backend to start)
cd frontend
npm install
npm start

# Terminal 3: Create org (use any REST client)
curl -X POST http://localhost:5000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test School","address":"Address","city":"City","state":"State","pincode":"12345","contactEmail":"test@school.edu","contactPhone":"+91-9999999999","academicYear":"2024-2025","principal":{"name":"Principal","email":"p@school.edu","phone":"+91-9999999999"}}'

# Copy org ID, then register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@school.edu","password":"Admin@123","role":"admin","organizationId":"ORG-ID-HERE"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"Admin@123"}'

# Use token in browser at http://localhost:4200
```

---

**You're all set! 🚀 Your multi-tenant system is ready to use.**

Questions? Check the error message, look for missing organizationId in payloads, or verify the token isn't expired.
