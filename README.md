# Task Management System - Backend

## Project Overview
The backend is a Node.js REST API providing secure authentication and task management capabilities. It handles user registration, JWT-based login, and CRUD (Create, Read, Update, Delete) operations for tasks associated securely with the authenticated user.

## Technology Stack
- **Framework**: Express.js (Node.js)
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (hosted via Neon DB)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing, CORS

## Installation Instructions
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

## Environment Variables
Create a `.env` file in the root of the `backend` directory. The application requires the following variables to function correctly:

```env
# Connection string for your PostgreSQL database
DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"

# Secret key used for signing JWTs (must be kept secure)
JWT_SECRET="your_secure_jwt_secret_key"

# Token expiration time (e.g., "1h", "7d")
JWT_EXPIRES_IN="1h"
```

## Database Setup
1. Ensure your PostgreSQL database is running and accessible.
2. Ensure the `DATABASE_URL` in your `.env` is correctly pointing to your database.
3. Push the Prisma schema to sync your database structure:
   ```bash
   npx prisma db push
   ```
4. *(Optional)* A full SQL schema dump is included as `database.sql` in this directory if you need to manually inspect or import the database structure outside of Prisma.
5. *(Optional)* If you wish to seed the database with initial data, you can run:
   ```bash
   npm run prisma db seed
   ```

## Running the Backend
Start the development server (which uses `tsx` to watch for file changes):
```bash
npm run dev
```
The API will run locally at `http://localhost:3000`.

## Running the Frontend
*Please refer to the frontend README for instructions on running the frontend React application.*

## API Documentation

### Authentication
- `POST /api/auth/register`
  - **Body**: `{ "email": "user@example.com", "password": "password123", "name": "John Doe" }`
  - **Description**: Registers a new user and hashes the password.
  
- `POST /api/auth/login`
  - **Body**: `{ "email": "user@example.com", "password": "password123" }`
  - **Description**: Authenticates the user and returns a signed JWT.

### Tasks
*(All task routes require the `Authorization: Bearer <token>` header)*

- `GET /api/tasks`
  - **Description**: Retrieves all tasks belonging to the authenticated user.

- `POST /api/tasks`
  - **Body**: `{ "title": "Task Title", "description": "Details...", "priority": "Low|Medium|High", "status": "Pending|In Progress|Completed", "dueDate": "YYYY-MM-DD" }`
  - **Description**: Creates a new task linked to the user.

- `PUT /api/tasks/:id`
  - **Body**: fields to update (e.g. status, title).
  - **Description**: Updates an existing task by ID (ensuring it belongs to the user).

- `DELETE /api/tasks/:id`
  - **Description**: Deletes a task by ID.

## Assumptions Made
- The frontend will handle JWT storage and attach it to the `Authorization` header for protected routes.
- The PostgreSQL database is accessible and allows secure connections.

## Known Limitations
- The `GET /api/tasks` endpoint fetches all tasks for a user at once, lacking pagination, which could impact performance for users with thousands of tasks.
- No integrated refresh token mechanism; users must log in again when the JWT expires.
