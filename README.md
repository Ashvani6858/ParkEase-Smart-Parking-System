# ParkEase - Smart Parking Management & Booking System

## Overview
ParkEase is a comprehensive full-stack application designed to manage parking locations, interactive parking slot bookings, and vehicle check-ins. Built with modern web technologies, it features double-booking prevention, real-time availability updates, and a responsive, premium user interface.

## Problem Statement
Finding parking in busy areas is time-consuming and frustrating. Traditional parking systems lack real-time visibility, leading to wasted time and increased emissions. ParkEase solves this by providing a unified platform for users to find, reserve, and manage parking spots, while giving administrators the tools to manage locations, monitor occupancy, and generate analytics.

## Features
- **User Authentication:** Secure registration and login with JWT and role-based access control (User/Admin).
- **Parking Location Management:** Admins can manage multiple parking locations, floors, and slots.
- **Interactive Slot Booking:** Visual grid for users to select available slots.
- **Double Booking Prevention:** Robust database transaction logic ensures a slot cannot be double-booked for overlapping times.
- **QR Code Check-in:** Seamless check-in and check-out process using generated QR codes.
- **Real-Time Updates:** Socket.IO integration to broadcast slot availability changes instantly.
- **Admin Dashboard:** Analytics, occupancy charts, and revenue statistics.
- **Vehicle Management:** Users can manage multiple vehicles.

## Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, React Router, Axios, Lucide React, Recharts, Socket.IO Client.
- **Backend:** Node.js, Express.js, Prisma ORM, MySQL, JWT, bcryptjs, Socket.IO, Zod.
- **Testing:** Jest, Supertest (Backend), Vitest (Frontend).

## Architecture
The application follows a client-server architecture. The React frontend communicates with the Express backend via REST APIs. Real-time slot status updates are pushed from the backend to the frontend using WebSocket (Socket.IO). The backend uses Prisma ORM to interact with the MySQL database.

## Database Relationships
- `User` 1:N `Vehicle`
- `User` 1:N `Booking`
- `ParkingLocation` 1:N `ParkingFloor`
- `ParkingFloor` 1:N `ParkingSlot`
- `ParkingSlot` 1:N `Booking`
- `Vehicle` 1:N `Booking`

## Installation and Setup

### Prerequisites
- Node.js (v18+)
- MySQL Server (running locally on port 3306)

### 1. Database Setup
1. Create a MySQL database named `parkease`.
2. Update the `.env` file in the `backend` directory with your MySQL connection string.

### 2. Local Installation
```bash
# Install dependencies for both backend and frontend
npm run install:all

# Navigate to backend and run migrations
cd backend
npx prisma migrate dev --name init

# Seed the database with sample data
npm run db:seed
cd ..

# Start both servers concurrently
npm run dev
```

### 3. Access the Application
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### Demo Accounts
- **Admin:** admin@parkease.com / password123
- **User:** user@parkease.com / password123

## REST API Documentation (Key Endpoints)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/locations` - List parking locations
- `GET /api/locations/:id/slots` - Get slots and availability
- `POST /api/bookings` - Create a booking
- `PUT /api/bookings/:id/checkin` - Check in a vehicle
- `PUT /api/bookings/:id/checkout` - Check out a vehicle

## Testing
```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

## Deployment
- **Frontend (Vercel):** Connect your GitHub repository to Vercel. Set the build command to `npm run build` and output directory to `dist`. Add `VITE_API_URL` to environment variables.
- **Backend (Render):** Deploy as a Web Service. Set the start command to `npm start`. Configure `DATABASE_URL` and `JWT_SECRET`.
- **Database:** Use a managed MySQL provider like PlanetScale, AWS RDS, or DigitalOcean Managed Databases.

## Future Improvements
- Payment gateway integration (Stripe)
- License plate recognition (ALPR)
- Dynamic pricing based on demand
- Mobile app using React Native
