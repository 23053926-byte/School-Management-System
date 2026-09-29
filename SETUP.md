# School Management System - Clean Starter

This package is a cleaned copy of the current working project. Dependency folders, Angular cache, Git metadata and private environment credentials were removed so the project can be safely moved to another Windows machine.

## Requirements
- Node.js 22.x recommended
- npm 10.x recommended
- MongoDB Atlas (or another MongoDB instance)
- VS Code

## 1. Backend setup
Open a terminal in `backend`:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` and set your MongoDB URI, JWT secret and email credentials.

Start backend:

```powershell
npm run dev
```

API: http://localhost:5000

## 2. Frontend setup
Open another terminal in `frontend`:

```powershell
npm install
npm start
```

Frontend: http://localhost:4200

## Important
Do NOT copy the old `node_modules` folders into a different operating system. Run `npm install` on the machine where the project will run.

## Current working scope
- JWT authentication and role protection
- Admin and faculty dashboards
- Student CRUD
- Student search/filter/pagination
- Student edit/add forms
- Faculty backend module
- Subject backend module
- Attendance backend module
- Marks backend module
- Result/SGPA/CGPA and PDF/email backend functionality

## Planned product expansion
The next development phase will convert this into a reusable modern School ERP platform with:
- organization/school settings
- configurable branding
- document template designer
- editable admit-card templates
- editable report-card templates
- PDF generation from saved templates
- permissions by role/module
- modern dashboard and navigation
- notifications and calendar
- exams, fees, library, transport and other ERP modules

The source code remains the core product; school-specific data and templates are stored as configuration/data rather than hard-coded into the application.
