# AI CV Filtering System - Backend

A REST API backend for an AI-powered CV screening system that automates resume evaluation using NLP and scoring algorithms. Built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **User Management**: Register, login, JWT authentication with roles (hr, candidate)
- **Job Management**: Create, update, delete jobs with skills requirements, location, job type
- **CV Processing**: Upload PDF/DOCX files, automatic text extraction, skill parsing via NLP
- **Matching Score**: Automatic candidate scoring based on skills, experience, and education
- **Dashboard**: Statistics and recent activities for HR
- **Skills Dictionary**: Configurable technical and soft skills with synonyms
- **File Storage**: MongoDB GridFS for CV file storage

## Tech Stack

- Node.js, Express, TypeScript
- MongoDB, Mongoose
- JWT (access token), bcryptjs
- pdf-parse, mammoth (document parsing)
- natural (NLP), express-validator
- helmet, cors, express-rate-limit

---

## How to Run

### Prerequisites

- Node.js (v18+)
- MongoDB (local or cloud)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file (copy from `.env.example`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your-secret-key
JWT_EXPIRE=15m
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document
CORS_ORIGIN=http://localhost:3000
```

If `MONGODB_URI` does not include a database name, the app uses `cv-filtering`.

### 3. Start MongoDB

Ensure MongoDB is running locally on port 27017, or update `MONGODB_URI`.

### 4. Run the Application

```bash
# Development (with nodemon)
npm run dev

# Build and production
npm run build
npm start
```

Server runs at `http://localhost:5000` by default.

### 5. Verify

- **Health check:** `GET http://localhost:5000/health` returns `{ "status": "UP", "message": "Server is healthy" }`.
- **Sample users and seed data:** run `npm run setup`. Default logins: HR `hr@cvfiltering.com` / `Hr@123`, Candidate `candidate@cvfiltering.com` / `Candidate@123`.

---

## API Documentation

Base URL: `http://localhost:5000/api`

Protected routes require header: `Authorization: Bearer <accessToken>`

**Server**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | /health  | No   | Health check. Base URL: `http://localhost:5000`. Returns `{ status: 'UP', message: 'Server is healthy' }`. |

**الأدوار والميزات (Roles & Features)**

- **HR (وظائف المدير):** لوحة التحكم (إحصائيات، أنشطة)، إنشاء/تعديل/حذف الوظائف، قائمة المتقدمين، رفض/قبول الطلبات. الـ APIs: `GET /api/dashboard/*`, `POST|PUT|DELETE /api/jobs`, `GET /api/jobs/:id/candidates`, `GET /api/cvs`, `POST /api/cvs/:id/accept`, `POST /api/cvs/:id/reject`.
- **Candidate (وظائف المرشح):**
  1. **البحث عن الوظيفة:** عرض وقائمة الوظائف (بدون تسجيل دخول). الـ APIs: `GET /api/jobs`, `GET /api/jobs/:id` (بدون Auth).
  2. **التقديم ورفع الـ CV:** بعد تسجيل الدخول كـ candidate، التقديم على وظيفة معينة ورفع الملف. الـ API: `POST /api/cvs/upload` (multipart: `cv`, `jobId`، واختياري: `phoneNumber`, `whatsappNumber`, `coverLetter`).

---

### Authentication (`/api/auth`)

| Method | Endpoint            | Auth | Description          |
|--------|---------------------|------|----------------------|
| POST   | /auth/register      | No   | Register new user    |
| POST   | /auth/login         | No   | Login, get access token |
| GET    | /auth/profile       | Yes  | Get current user     |
| PUT    | /auth/change-password | Yes | Change password      |

**Register** `POST /api/auth/register`

التسجيل **للمديرين (HR) فقط**. Role must be `"hr"`. Candidate accounts are created via setup script or other means; they do not register here.

Body (Figma format). **role** must be `"hr"`. **companyName** is required.
```json
{
  "fullName": "John Doe",
  "emailAddress": "user@example.com",
  "role": "hr",
  "companyName": "Acme Inc.",
  "password": "password123",
  "confirmPassword": "password123"
}
```

Or legacy format with `firstName`/`lastName` and `email`. Response: `{ user: { id, fullName, email, companyName, role }, accessToken }`.

**Login** `POST /api/auth/login`

Body (accepts `email` or `emailAddress`). Example for setup users:
```json
{
  "email": "hr@cvfiltering.com",
  "password": "Hr@123"
}
```
Response: `{ user: { id, fullName, email, companyName, role }, accessToken }`.

**Change Password** `PUT /api/auth/change-password` (protected)

Body:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

---

### Jobs (`/api/jobs`)

| Method | Endpoint              | Auth | Roles | Description           |
|--------|------------------------|------|-------|-----------------------|
| POST   | /jobs                  | Yes  | hr    | Create job            |
| GET    | /jobs                  | No   | Public| List jobs (search)    |
| GET    | /jobs/:id              | No   | Public| Get job by ID         |
| PUT    | /jobs/:id              | Yes  | hr    | Update job            |
| DELETE | /jobs/:id              | Yes  | hr    | Delete job            |
| GET    | /jobs/:id/candidates   | Yes  | hr    | Get job candidates    |

**Create job** `POST /api/jobs`

Body (Figma format). Optional: `benefits`, `experience` (or `requiredExperience`).
```json
{
  "jobTitle": "Senior Frontend Developer",
  "jobDescription": "Job description...",
  "department": "Engineering",
  "location": "Berlin, Germany",
  "jobType": "full-time",
  "salaryRange": { "min": 50000, "max": 120000 },
  "experience": 3,
  "requirements": "List requirements...",
  "responsibilities": "List responsibilities...",
  "benefits": "Health insurance, remote work...",
  "status": "draft"
}
```

Or legacy format with `title`, `description`. `status`: active | closed | draft. Response: `{ job: { id, title, companyName, location, jobType, applicationsCount, benefits, experience, ... } }`.

**List jobs** `GET /api/jobs?page=1&limit=10&search=frontend&location=Cairo&jobType=full-time&department=Engineering&minSalary=10000&maxSalary=50000&status=active` — **Public** (no auth), for candidate job search.

**Get job by ID** `GET /api/jobs/:id` — **Public** (no auth).

---

### CVs (`/api/cvs`)

| Method | Endpoint           | Auth | Roles            | Description     |
|--------|--------------------|------|------------------|-----------------|
| POST   | /cvs/upload        | Yes  | candidate        | Upload CV       |
| GET    | /cvs               | Yes  | hr                | List CVs        |
| GET    | /cvs/:id           | Yes  | hr, candidate    | Get CV by ID    |
| GET    | /cvs/:id/download  | Yes  | hr                | Download CV     |
| POST   | /cvs/:id/reprocess | Yes  | hr                | Reprocess CV    |
| POST   | /cvs/:id/reject    | Yes  | hr                | Reject candidate|
| POST   | /cvs/:id/accept    | Yes  | hr                | Accept candidate|
| DELETE | /cvs/:id           | Yes  | hr                | Delete CV       |

**Upload CV** `POST /api/cvs/upload` (multipart/form-data)

- `cv`: file (PDF or DOCX, max 5MB)
- `jobId`: string (required)
- `phoneNumber`, `whatsappNumber`, `coverLetter`: optional

Response: `{ applicationId, status: 'pending' }`.

**List CVs** `GET /api/cvs?page=1&limit=10&status=processed&jobId=JOB_ID`

Response: `{ cvs: [{ id, name, status, jobTitle, applicationDate, appliedAt }], pagination }`. `status` is display: Pending | Accepted | Rejected.

**Get candidate profile** `GET /api/cvs/:id` – returns `{ candidate: { id, name, cvScores, skills, contactInformation, ... } }`.

**Reject candidate** `POST /api/cvs/:id/reject` | **Accept candidate** `POST /api/cvs/:id/accept`

**Get job candidates** `GET /api/jobs/:id/candidates?search=&status=&minScore=&maxScore=` – returns Figma format: `candidates: [{ id, name, jobTitleAppliedFor, skills, status, applicationDate, matchingScore }]` with status: NEW | Accepted | Rejected.

---

### Skills Dictionary (`/api/skills`)

| Method | Endpoint        | Auth | Roles | Description   |
|--------|-----------------|------|-------|---------------|
| GET    | /skills         | Yes  | All   | List skills   |
| GET    | /skills/:id     | Yes  | All   | Get skill     |
| POST   | /skills         | Yes  | hr    | Create skill  |
| PUT    | /skills/:id     | Yes  | hr    | Update skill  |
| DELETE | /skills/:id     | Yes  | hr    | Delete skill  |
| POST   | /skills/import  | Yes  | hr    | Import skills |

**List** `GET /api/skills?category=technical`

**Create** `POST /api/skills`

Body:
```json
{
  "category": "technical",
  "skills": ["React", "Node.js"],
  "synonyms": { "React": ["ReactJS", "React.js"] }
}
```

---

### Dashboard (`/api/dashboard`) – HR only

| Method | Endpoint              | Auth | Description           |
|--------|------------------------|------|-----------------------|
| GET    | /dashboard/stats       | Yes  | Dashboard statistics  |
| GET    | /dashboard/recent-activities | Yes  | Recent activities     |

**Stats** `GET /api/dashboard/stats` (Figma HR Dashboard format)

Returns: `{ totalActiveJobs, totalApplicants, totalApplications, newApplications, rejected, jobs: [{ id, title, jobType, location, applicationsCount, status }], recentApplications: [{ id, applicantName, jobTitle, status, appliedAt }] }`. `recentApplications[].status` is display: Pending | Accepted | Rejected.

**Recent activities** `GET /api/dashboard/recent-activities?limit=10`

Returns: user_registered, job_created, cv_uploaded events sorted by timestamp

---

## Response Format

Success:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

---

## Postman

Import `postman_collection.json` into Postman. Set variables:

- `baseUrl`: http://localhost:5000/api
- `baseServer`: http://localhost:5000
- `accessToken`: from login response
- `jobId`, `cvId`, `skillId`: auto-saved from Create Job, Upload CV, Create Skill

Workflow: Register/Login → copy accessToken → use in Authorization header for protected requests.
