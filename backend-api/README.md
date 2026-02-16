# CareerCompass Backend API 🚀

> **Laravel 12 REST API** for user authentication, CV analysis, and job management

## 📋 Overview

The Backend API is a Laravel 12-based RESTful service that handles user authentication, CV upload and skill extraction (via AI Engine), job management, and skill gap analysis. It uses Laravel Sanctum for API token authentication and communicates with the Python AI Engine microservice.

---

## ✨ Features

- **User Authentication** - Registration, login, logout with Sanctum tokens
- **CV Upload & Analysis** - Upload PDFs and extract skills via AI Engine
- **Skill Management** - View and manage user skills
- **Job Management** - Browse, view, and scrape job listings
- **Gap Analysis** - Calculate skill gaps between users and jobs
- **Recommendations** - Get personalized learning recommendations
- **RESTful API** - 14 well-documented endpoints
- **MySQL Database** - Migrations and seeders included
- **CORS Enabled** - Ready for frontend integration

---

## 🏗️ Architecture

```
backend-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php          # Registration, login, logout
│   │   │   ├── CvController.php            # CV upload & skill management
│   │   │   ├── JobController.php           # Job browsing & scraping
│   │   │   └── GapAnalysisController.php   # Gap analysis & recommendations
│   │   ├── Requests/
│   │   │   └── CvUploadRequest.php         # CV validation rules
│   │   └── Resources/
│   │       ├── SkillResource.php           # Skill JSON transformation
│   │       └── JobResource.php             # Job JSON transformation
│   └── Models/
│       ├── User.php                        # User model (with skills relation)
│       ├── Skill.php                       # Skill model
│       └── Job.php                         # Job model
├── database/
│   ├── migrations/                         # Database schema
│   └── seeders/
│       └── SkillSeeder.php                 # 84 predefined skills
├── routes/
│   └── api.php                             # 14 API endpoints
├── config/
│   └── cors.php                            # CORS configuration
├── .env.example                            # Environment template
└── TESTING.md                              # API testing guide
```

---

## 🚀 Getting Started

### Prerequisites

- **PHP** 8.1+ with extensions: `pdo`, `pdo_mysql`, `mbstring`, `xml`, `curl`, `zip`
- **Composer** 2.x - [Download](https://getcomposer.org/)
- **MySQL** 8.x - [Download](https://dev.mysql.com/downloads/installer/)
- **AI Engine** - Must be running on port 8001

### Installation

#### 1️⃣ Navigate to Backend Directory

```bash
cd backend-api
```

#### 2️⃣ Install Dependencies

```bash
# Install PHP packages via Composer
composer install
```

This installs:

- Laravel 12 framework
- Laravel Sanctum (API authentication)
- Guzzle HTTP client (for AI Engine communication)
- All other dependencies

#### 3️⃣ Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

**Edit `.env` file** with your configuration:

```env
# Application
APP_NAME=CareerCompass
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=career_compass
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# AI Engine Configuration
AI_ENGINE_URL=http://127.0.0.1:8001
AI_ENGINE_TIMEOUT=30

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### 4️⃣ Create Database

Create a MySQL database for the application:

```sql
CREATE DATABASE career_compass CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or use a MySQL client like phpMyAdmin, MySQL Workbench, etc.

#### 5️⃣ Run Migrations & Seeders

```bash
# Run all migrations (creates tables)
php artisan migrate

# Seed the database with 84 predefined skills
php artisan db:seed --class=SkillSeeder

# Or do both at once with fresh database
php artisan migrate:fresh --seed
```

**Database Tables Created:**

- `users` - User accounts
- `skills` - 84 predefined technical & soft skills
- `jobs` - Job listings (from scraping)
- `user_skills` - User-skill relationships (many-to-many)
- `job_skills` - Job-skill relationships (many-to-many)
- `personal_access_tokens` - Sanctum authentication tokens
- `cache` - Laravel cache storage
- `sessions` - Session storage

---

## ▶️ Running the Server

### Start the Laravel Development Server

```bash
# From the backend-api directory
php artisan serve --port=8000
```

**Output:**

```
INFO  Server running on [http://127.0.0.1:8000].

Press Ctrl+C to stop the server
```

### Verify Server is Running

```bash
curl http://127.0.0.1:8000/api/health
```

**Expected Response:**

```json
{
    "status": "ok",
    "service": "CareerCompass API",
    "version": "1.0.0"
}
```

---

## 🔌 API Endpoints

### Authentication (Public)

#### 1. Register New User

**POST** `/api/register`

Create a new user account.

**Request Body:**

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

**Response (201 Created):**

```json
{
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2026-02-16T00:00:00.000000Z",
        "updated_at": "2026-02-16T00:00:00.000000Z"
    },
    "token": "1|abcdefghijklmnopqrstuvwxyz..."
}
```

---

#### 2. Login

**POST** `/api/login`

Authenticate and receive API token.

**Request Body:**

```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Response (200 OK):**

```json
{
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    },
    "token": "2|zyxwvutsrqponmlkjihgfedcba..."
}
```

**Error Response (401 Unauthorized):**

```json
{
    "message": "Invalid credentials"
}
```

---

### User Management (Protected)

> **Note:** All protected endpoints require the `Authorization: Bearer {token}` header

#### 3. Get Current User

**GET** `/api/user`

Get authenticated user information.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": null,
    "created_at": "2026-02-16T00:00:00.000000Z",
    "updated_at": "2026-02-16T00:00:00.000000Z"
}
```

---

#### 4. Logout

**POST** `/api/logout`

Revoke all user tokens.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "message": "Logged out successfully"
}
```

---

### CV & Skill Management (Protected)

#### 5. Upload CV

**POST** `/api/upload-cv`

Upload a PDF CV and extract skills via AI Engine.

**Headers:**

```
Authorization: Bearer {your_token}
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

- `cv` (file, required) - PDF file (max 5MB)
- `use_nlp` (boolean, optional) - Use NLP extraction (default: false)

**Response (200 OK):**

```json
{
    "message": "CV analyzed successfully",
    "skills_extracted": 12,
    "new_skills": 8,
    "existing_skills": 4,
    "skills": [
        {
            "id": 1,
            "name": "Laravel",
            "type": "technical"
        },
        {
            "id": 15,
            "name": "Communication",
            "type": "soft"
        }
    ]
}
```

---

#### 6. Get User Skills

**GET** `/api/user/skills`

Get all skills associated with the authenticated user.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": 1,
            "name": "Laravel",
            "type": "technical"
        },
        {
            "id": 2,
            "name": "PHP",
            "type": "technical"
        }
    ],
    "total": 2
}
```

---

#### 7. Remove Skill

**DELETE** `/api/user/skills/{skillId}`

Remove a skill from the user's profile.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "message": "Skill removed successfully"
}
```

---

### Job Management

#### 8. Browse Jobs (Public)

**GET** `/api/jobs`

Get paginated list of all jobs.

**Query Parameters:**

- `page` (integer, optional) - Page number (default: 1)
- `per_page` (integer, optional) - Items per page (default: 15, max: 100)

**Example:**

```bash
curl "http://127.0.0.1:8000/api/jobs?page=1&per_page=10"
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": 1,
            "title": "Senior Laravel Developer",
            "company": "Tech Corp",
            "description": "We are looking for...",
            "url": "https://wuzzuf.net/jobs/...",
            "source": "wuzzuf",
            "skills": [
                { "id": 1, "name": "Laravel", "type": "technical" },
                { "id": 2, "name": "PHP", "type": "technical" }
            ],
            "created_at": "2026-02-15T12:00:00.000000Z"
        }
    ],
    "current_page": 1,
    "total": 50,
    "per_page": 10,
    "last_page": 5
}
```

---

#### 9. Get Single Job (Public)

**GET** `/api/jobs/{id}`

Get detailed information about a specific job.

**Response (200 OK):**

```json
{
    "data": {
        "id": 1,
        "title": "Senior Laravel Developer",
        "company": "Tech Corp",
        "description": "Full job description...",
        "url": "https://wuzzuf.net/jobs/...",
        "source": "wuzzuf",
        "skills": [
            { "id": 1, "name": "Laravel", "type": "technical" },
            { "id": 2, "name": "PHP", "type": "technical" }
        ],
        "created_at": "2026-02-15T12:00:00.000000Z"
    }
}
```

---

#### 10. Scrape Jobs (Protected)

**POST** `/api/jobs/scrape`

Trigger job scraping from Wuzzuf.

**Headers:**

```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Request Body:**

```json
{
    "query": "Laravel Developer",
    "max_results": 20,
    "use_samples": false
}
```

**Response (201 Created):**

```json
{
    "message": "Jobs scraped successfully",
    "total_scraped": 18,
    "new_jobs": 15,
    "duplicate_jobs": 3,
    "source": "wuzzuf"
}
```

---

#### 11. On-Demand Scraping (Protected)

**POST** `/api/jobs/scrape-if-missing`

Check if a job title exists in the database. If not, trigger scraping for it.

**Headers:**

```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Request Body:**

```json
{
    "title": "React Native Developer",
    "location": "Cairo"  # Optional
}
```

**Response (200 OK - Job Exists):**

```json
{
    "message": "Jobs found in database",
    "count": 5,
    "status": "completed"
}
```

**Response (202 Accepted - Scraping Started):**

```json
{
    "message": "Scraping started for React Native Developer",
    "job_id": "sc_123456789",
    "status": "processing"
}
```

---

#### 12. Check Scraping Status (Protected)

**GET** `/api/scraping-status/{jobId}`

Check the status of a background scraping job.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "id": "sc_123456789",
    "status": "completed",
    "jobs_found": 12,
    "progress": 100
}
```

---

### Gap Analysis (Protected)

#### 13. Analyze Single Job

**GET** `/api/gap-analysis/job/{jobId}`

Analyze skill match between user and a specific job.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "job_id": 1,
    "job_title": "Senior Laravel Developer",
    "company": "Tech Corp",
    "total_skills_required": 10,
    "user_has_skills": 7,
    "missing_skills": 3,
    "match_percentage": 70,
    "matching_skills": [
        { "id": 1, "name": "Laravel", "type": "technical" },
        { "id": 2, "name": "PHP", "type": "technical" }
    ],
    "missing_skills_details": [
        { "id": 15, "name": "Docker", "type": "technical" },
        { "id": 20, "name": "Kubernetes", "type": "technical" }
    ]
}
```

---

#### 14. Batch Analyze Jobs

**POST** `/api/gap-analysis/batch`

Analyze skill gaps for multiple jobs at once.

**Headers:**

```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Request Body:**

```json
{
    "job_ids": [1, 2, 3, 4, 5]
}
```

**Response (200 OK):**

```json
{
    "results": [
        {
            "job_id": 1,
            "job_title": "Senior Laravel Developer",
            "match_percentage": 70,
            "missing_skills_count": 3
        },
        {
            "job_id": 2,
            "job_title": "Full Stack Developer",
            "match_percentage": 85,
            "missing_skills_count": 2
        }
    ],
    "total_analyzed": 5
}
```

---

#### 15. Get Recommendations

**GET** `/api/gap-analysis/recommendations`

Get personalized skill learning recommendations based on job market.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Query Parameters:**

- `limit` (integer, optional) - Number of recommendations (default: 5, max: 20)

**Response (200 OK):**

```json
{
    "user_skills_count": 12,
    "recommendations": [
        {
            "skill_id": 15,
            "skill_name": "Docker",
            "skill_type": "technical",
            "demand_score": 85,
            "jobs_requiring": 42,
            "reason": "Highly demanded in 42 job listings"
        },
        {
            "skill_id": 20,
            "skill_name": "React",
            "skill_type": "technical",
            "demand_score": 78,
            "jobs_requiring": 38,
            "reason": "Highly demanded in 38 job listings"
        }
    ],
    "total_recommendations": 5
}
```

---

### Market Intelligence (Protected)

#### 16. Market Overview

**GET** `/api/market/overview`

Get high-level market statistics including total jobs, top skills, and active roles.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "total_jobs": 150,
    "total_skills": 84,
    "top_skills": [
        { "name": "Laravel", "count": 45 },
        { "name": "React", "count": 40 }
    ],
    "active_roles": 12
}
```

---

#### 17. Role Statistics

**GET** `/api/market/role-statistics/{roleTitle}`

Get statistics for a specific job role (e.g., "Full Stack Developer").

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "role": "Full Stack Developer",
    "job_count": 25,
    "avg_salary": "Confidential",
    "top_skills": ["PHP", "Laravel", "React", "MySQL"]
}
```

---

#### 18. Trending Skills

**GET** `/api/market/trending-skills`

Get a list of skills currently in high demand across all jobs.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": 1,
            "name": "Laravel",
            "type": "technical",
            "job_count": 45,
            "trend": "up"
        }
    ]
}
```

---

#### 19. Skill Demand by Role

**GET** `/api/market/skill-demand/{roleTitle}`

Get detailed skill demand breakdown for a specific role.

**Headers:**

```
Authorization: Bearer {your_token}
```

**Response (200 OK):**

```json
{
    "role": "Backend Developer",
    "skills": {
        "essential": ["PHP", "Laravel", "MySQL"],
        "important": ["Docker", "Git", "Redis"],
        "nice_to_have": ["AWS", "CI/CD"]
    }
}
```

---

#### 20. Health Check (Public)

**GET** `/api/health`

Check if the API is running.

**Response (200 OK):**

```json
{
    "status": "ok",
    "service": "CareerCompass API",
    "version": "1.0.0"
}
```

---

## 🗄️ Database Schema

### Users Table

- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `timestamps` - created_at, updated_at

### Skills Table (84 Predefined)

- `id` - Primary key
- `name` - Skill name (e.g., "Laravel", "Python")
- `type` - Enum: 'technical' or 'soft'
- `timestamps`

**Predefined Skills:**

- **66 Technical Skills**: Laravel, PHP, Python, React, JavaScript, MySQL, Docker, AWS, etc.
- **18 Soft Skills**: Communication, Leadership, Teamwork, Problem Solving, etc.

### Jobs Table

- `id` - Primary key
- `title` - Job title
- `company` - Company name
- `description` - Full job description
- `url` - Job posting URL
- `source` - Source platform (e.g., "wuzzuf")
- `timestamps`

### User Skills (Pivot Table)

- `user_id` - Foreign key to users
- `skill_id` - Foreign key to skills
- `timestamps` - When skill was added

### Job Skills (Pivot Table)

- `job_id` - Foreign key to jobs
- `skill_id` - Foreign key to skills

---

## 🧪 Testing

### Using the Testing Guide

Refer to [TESTING.md](TESTING.md) for comprehensive API testing instructions.

### Quick Test with curl

```bash
# Health check
curl http://127.0.0.1:8000/api/health

# Register user
curl -X POST http://127.0.0.1:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'

# Login (save the token)
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get current user (use token from login response)
curl http://127.0.0.1:8000/api/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

Import the **CareerCompass.postman_collection.json** file (in project root) into Postman for ready-to-use API requests.

---

## 🔒 Security Features

- **SQL Injection Prevention**: Uses Laravel's Eloquent ORM and parameterized queries to prevent SQL injection attacks.
- **Race Condition Handling**: Implemented `withoutOverlapping()` for scheduled tasks and database transactions for critical operations.
- **Input Sanitization**: All user inputs are validated and sanitized using Laravel's Form Requests.
- **XSS Protection**: React automatically escapes content, and Laravel's Blade engine provides additional XSS protection.
- **Secure Authentication**: Uses Laravel Sanctum for secure, token-based API authentication.
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse and DoS attacks.

---

## 🛠️ Technical Details

### Authentication

Uses **Laravel Sanctum** for API token authentication:

- Tokens are stored in `personal_access_tokens` table
- Tokens are returned on registration and login
- Include token in `Authorization: Bearer {token}` header for protected routes
- Tokens can be revoked by logging out

### AI Engine Integration

The backend communicates with the AI Engine via HTTP:

- **URL**: Configured in `.env` as `AI_ENGINE_URL`
- **Timeout**: 30 seconds (configurable)
- **Endpoints Used**:
    - `POST /analyze` - CV skill extraction
    - `POST /scrape-jobs` - Job scraping

### CORS Configuration

CORS is enabled for all origins in development (`config/cors.php`):

- Allowed origins: `*` (configure for production)
- Allowed methods: All
- Supports credentials: Yes

### File Upload

CV upload validation (`CvUploadRequest.php`):

- Max file size: 5MB
- Allowed type: PDF only
- Stored temporarily during processing
- Auto-deleted after analysis

---

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Regenerate autoloader
composer dump-autoload

# Try again
php artisan serve --port=8000
```

### Database Connection Error

**Check MySQL is running:**

```bash
mysql -u root -p
```

**Verify credentials in `.env`:**

```env
DB_DATABASE=career_compass
DB_USERNAME=root
DB_PASSWORD=your_password
```

**Reset database:**

```bash
php artisan migrate:fresh --seed
```

### AI Engine Connection Timeout

**Ensure AI Engine is running:**

```bash
# Check if AI Engine is accessible
curl http://127.0.0.1:8001/

# Start AI Engine if not running
cd ../ai-engine
venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

**Update timeout in `.env`:**

```env
AI_ENGINE_TIMEOUT=60  # Increase to 60 seconds
```

### Token Authentication Failed

**Error:** `Unauthenticated`

**Solutions:**

1. Ensure token is in the header: `Authorization: Bearer {token}`
2. Token may have expired - login again to get a new token
3. Check if token is valid:
    ```bash
    # Should return user info
    curl http://127.0.0.1:8000/api/user \
      -H "Authorization: Bearer YOUR_TOKEN"
    ```

### Composer Install Errors

```bash
# Update Composer itself
composer self-update

# Clear Composer cache
composer clear-cache

# Install with verbose output
composer install -vvv
```

### Permission Errors (Linux/macOS)

```bash
# Set correct permissions
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R $USER:www-data storage bootstrap/cache
```

### Port 8000 Already in Use

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Or use a different port
php artisan serve --port=8080
```

---

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Application
APP_NAME=CareerCompass
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=career_compass
DB_USERNAME=root
DB_PASSWORD=

# AI Engine Integration
AI_ENGINE_URL=http://127.0.0.1:8001
AI_ENGINE_TIMEOUT=30

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
```

---

## 🚀 Production Deployment

### Security Checklist

1. **Update `.env` for production:**

    ```env
    APP_ENV=production
    APP_DEBUG=false
    ```

2. **Set strong APP_KEY:**

    ```bash
    php artisan key:generate
    ```

3. **Configure CORS** in `config/cors.php`:

    ```php
    'allowed_origins' => [
        'https://your-frontend-domain.com'
    ],
    ```

4. **Use HTTPS** for all endpoints

5. **Set up database backups**

6. **Enable rate limiting** in routes

### Performance Optimization

```bash
# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Install production dependencies only
composer install --optimize-autoloader --no-dev
```

### Database Indexing

The migrations already include necessary indexes on:

- Foreign keys (user_id, skill_id, job_id)
- Email (users table - unique)

---

## 📚 Additional Documentation

- **API Testing Guide**: [TESTING.md](TESTING.md)
- **Laravel Documentation**: https://laravel.com/docs/12.x
- **Sanctum Documentation**: https://laravel.com/docs/12.x/sanctum

---

## 📦 Dependencies

Main packages (from `composer.json`):

| Package           | Version | Purpose                 |
| ----------------- | ------- | ----------------------- |
| laravel/framework | ^12.0   | Core framework          |
| laravel/sanctum   | ^4.0    | API authentication      |
| guzzlehttp/guzzle | ^7.9    | HTTP client (AI Engine) |
| php               | ^8.2    | Runtime                 |

---

## 📄 License

This Backend API is part of the CareerCompass graduation project - MIT License

---

## 👥 Authors

CareerCompass Team - Graduation Project 2026

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**API Endpoints**: 14 total
