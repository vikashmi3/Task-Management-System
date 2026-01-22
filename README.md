# Task Management System

A minimal full-stack task management application with Node.js backend and Next.js frontend.

## Features

- User authentication (register/login) with JWT tokens
- CRUD operations for tasks
- Task filtering and search
- Responsive design
- Token refresh mechanism

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Generate Prisma client and setup database:
```bash
npm run db:generate
npm run db:push
```

4. Start the backend server:
```bash
npm run dev
```

Backend will run on http://localhost:3001

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

Frontend will run on http://localhost:3000

## API Endpoints

### Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login user
- POST `/auth/refresh` - Refresh access token
- POST `/auth/logout` - Logout user

### Tasks
- GET `/tasks` - Get tasks with pagination, filtering, and search
- POST `/tasks` - Create new task
- GET `/tasks/:id` - Get specific task
- PATCH `/tasks/:id` - Update task
- DELETE `/tasks/:id` - Delete task
- PATCH `/tasks/:id/toggle` - Toggle task completion status

## Usage

1. Start both backend and frontend servers
2. Open http://localhost:3000 in your browser
3. Register a new account or login
4. Create, edit, delete, and manage your tasks
5. Use search and filters to organize tasks

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- Prisma ORM
- SQLite database
- JWT authentication
- bcrypt for password hashing

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React Context for state management
- CSS for styling
- React Hot Toast for notifications