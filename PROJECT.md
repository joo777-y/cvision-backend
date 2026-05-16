# AI CV Filtering System - Backend

A REST API backend for an AI-powered CV screening system that automates resume evaluation using NLP and scoring algorithms. Built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **User Management**: Register, login, JWT authentication with roles (admin, hr, candidate)
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

- Create admin: `npm run setup` (if admin seed script exists)

---

## API Documentation

Base URL: `http://localhost:5000/api`

Protected routes require header: `Authorization: Bearer <accessToken>`

---

### Authentication (`/api/auth`)

| Method | Endpoint       | Auth | Description             |
|--------|----------------|------|-------------------------|
| POST   | /auth/register | No   | Register new user       |
| POST   | /auth/login    | No   | Login, get access token |
| GET    | /auth/profile  | Yes  | Get current user        |

**Register** `POST /api/auth/register`

Body. **role** is required: `"hr"` or `"candidate"` only (admin accounts are created by an admin via POST /users). **companyName** is required only when `role` is `"hr"`.
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
For candidate: use `"role": "candidate"` and omit `companyName`.

**Login** `POST /api/auth/login`

Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### Users (`/api/users`) – Admin only

| Method | Endpoint         | Auth | Description      |
|--------|------------------|------|------------------|
| POST   | /users           | Yes  | Create user (admin, hr, candidate) |
| GET    | /users           | Yes  | List users       |
| GET    | /users/:id       | Yes  | Get user by ID   |
| PUT    | /users/:id       | Yes  | Update user      |
| DELETE | /users/:id       | Yes  | Delete user      |
| PATCH  | /users/:id/role  | Yes  | Update user role |

**Create user** `POST /api/users` (Admin only). Body: `fullName`, `emailAddress` or `email`, `password`, `role` (admin, hr, candidate), optional `companyName` (required if role is hr).

**List users** `GET /api/users?page=1&limit=10&role=hr`

---

### Jobs (`/api/jobs`)

| Method | Endpoint              | Auth | Roles        | Description           |
|--------|------------------------|------|--------------|-----------------------|
| POST   | /jobs                  | Yes  | hr, admin    | Create job            |
| GET    | /jobs                  | Yes  | All          | List jobs             |
| GET    | /jobs/:id              | Yes  | All          | Get job by ID         |
| PUT    | /jobs/:id              | Yes  | hr, admin    | Update job            |
| DELETE | /jobs/:id              | Yes  | hr, admin    | Delete job            |
| GET    | /jobs/:id/candidates   | Yes  | hr, admin    | Get job candidates    |

**Create job** `POST /api/jobs`

Body:
```json
{
  "title": "Senior Frontend Developer",
  "description": "Job description...",
  "location": "Remote, Cairo",
  "jobType": "full-time",
  "department": "Engineering",
  "salaryRange": { "min": 15000, "max": 20000 },
  "requiredSkills": {
    "technical": [{ "name": "React", "weight": 8 }, { "name": "TypeScript", "weight": 7 }],
    "soft": [{ "name": "Communication", "weight": 6 }]
  },
  "requiredExperience": 5,
  "requiredEducation": "Bachelor"
}
```
`jobType`: full-time | part-time | contract | freelance | internship

**List jobs** `GET /api/jobs?page=1&limit=10&search=frontend&location=Cairo&jobType=full-time&status=active`

---

### CVs (`/api/cvs`)

| Method | Endpoint           | Auth | Roles              | Description     |
|--------|--------------------|------|--------------------|-----------------|
| POST   | /cvs/upload        | Yes  | candidate          | Upload CV       |
| GET    | /cvs               | Yes  | hr, admin          | List CVs        |
| GET    | /cvs/:id           | Yes  | hr, admin, owner   | Get CV by ID    |
| GET    | /cvs/:id/download  | Yes  | hr, admin          | Download CV     |
| POST   | /cvs/:id/reprocess | Yes  | hr, admin          | Reprocess CV    |
| DELETE | /cvs/:id           | Yes  | hr, admin          | Delete CV       |

**Upload CV** `POST /api/cvs/upload` (multipart/form-data)

- `cv`: file (PDF or DOCX, max 5MB)
- `jobId`: string (required)
- `phoneNumber`: string (optional)
- `whatsappNumber`: string (optional)
- `coverLetter`: string (optional)

**List CVs** `GET /api/cvs?page=1&limit=10&status=processed&jobId=JOB_ID`

---

### Skills Dictionary (`/api/skills`)

| Method | Endpoint        | Auth | Roles | Description   |
|--------|-----------------|------|-------|---------------|
| GET    | /skills         | Yes  | All   | List skills   |
| GET    | /skills/:id     | Yes  | All   | Get skill     |
| POST   | /skills         | Yes  | admin | Create skill  |
| PUT    | /skills/:id     | Yes  | admin | Update skill  |
| DELETE | /skills/:id     | Yes  | admin | Delete skill  |
| POST   | /skills/import  | Yes  | admin | Import skills |

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

### Dashboard (`/api/dashboard`) – HR, Admin

| Method | Endpoint              | Auth | Description           |
|--------|------------------------|------|-----------------------|
| GET    | /dashboard/stats       | Yes  | Dashboard statistics  |
| GET    | /dashboard/recent-activities | Yes  | Recent activities     |

**Stats** `GET /api/dashboard/stats`

Returns: totalUsers, totalJobs, totalCVs, activeJobs, processedCVs, pendingCVs, averageMatchingScore, roleDistribution, cvsPerJob, topCandidates

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
- `userId`, `jobId`, `cvId`: as needed

Workflow: Register/Login → copy accessToken → use in Authorization header for protected requests.
