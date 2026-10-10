# ParkEase - Interview Guide

## 45-Second Project Explanation
"ParkEase is a full-stack Smart Parking Management and Booking System I built using React, Node.js, Express, and MySQL. It solves the problem of finding and reserving parking spaces by providing an interactive booking interface and real-time availability updates. I implemented secure JWT authentication, a responsive UI with Tailwind CSS, and most importantly, robust double-booking prevention using database transactions. It also includes an admin dashboard with analytics and a QR-code-based check-in system. It's a complete, production-ready system that demonstrates my ability to handle complex state, concurrency, and real-time data."

## Architecture Explanation
The app uses a standard Client-Server architecture. The frontend is a Single Page Application (SPA) built with React and Vite, utilizing React Router for navigation and Tailwind CSS for styling. It communicates with a Node.js/Express backend via REST APIs. I used Prisma ORM to interact with a MySQL database, which ensures type safety and simplifies complex queries. For real-time updates (like a parking slot becoming occupied), I integrated Socket.IO to push events from the server to connected clients.

## Database Design Explanation
The database is relational (MySQL) with clear foreign key constraints. 
- The `User` table stores accounts, with a 1-to-many relationship to `Vehicle` and `Booking`.
- `ParkingLocation` contains multiple `ParkingFloor`s, which in turn contain `ParkingSlot`s.
- The `Booking` table is the central transactional record, linking a `User`, `Vehicle`, and `ParkingSlot` with specific `startTime` and `endTime`.
This normalized structure ensures data integrity and allows efficient querying of availability.

## Authentication Explanation
I implemented custom JWT (JSON Web Token) authentication. On login, the backend verifies the bcrypt-hashed password and issues a signed JWT. The frontend stores this token (e.g., in localStorage) and attaches it to the `Authorization: Bearer <token>` header for subsequent requests. The backend uses middleware to verify the token and extract the user's ID and Role (User or Admin), ensuring routes are properly protected and authorized.

## Double-Booking Prevention Explanation (CRITICAL)
To prevent two users from booking the same slot for overlapping times, I implemented strict backend validation. When a booking request is received, the backend queries the database for any existing bookings for that specific slot where the time ranges overlap (i.e., `newStart < existingEnd` AND `newEnd > existingStart`). Because this check and the subsequent insert must be atomic to prevent race conditions, I run them inside a Prisma `$transaction` with the appropriate isolation level or by acquiring a lock on the slot row. This guarantees data consistency even under high concurrency.

## Top 15 Likely Interview Questions & Answers

**1. Why did you choose React over other frontend frameworks?**
*Answer:* React's component-based architecture makes it easy to build reusable UI elements. Its large ecosystem and community support, combined with Vite for fast builds, provided the best developer experience for this project.

**2. How do you handle state management in the frontend?**
*Answer:* I used React Context API for global state like Authentication and Socket connections, and local component state (`useState`, `useReducer`) for UI-specific data. I avoided Redux to keep the architecture simple and because Context was sufficient for the application's complexity.

**3. What is Prisma, and why use an ORM?**
*Answer:* Prisma is a next-generation ORM for Node.js. I used it because it provides a type-safe database client and auto-generated migrations. It abstracts away raw SQL, making the codebase more maintainable and less prone to SQL injection, while still allowing complex queries.

**4. How does your real-time slot update work?**
*Answer:* I used Socket.IO. When a booking is confirmed or a vehicle checks in/out, the backend emits a 'slot-update' event to the specific room corresponding to that parking location. The frontend listens for this event and updates the slot grid instantly without requiring a page refresh.

**5. How are passwords stored?**
*Answer:* Passwords are never stored in plain text. They are hashed and salted using the `bcryptjs` library before being saved to the database.

**6. What happens if the database goes down during a booking?**
*Answer:* The backend API is wrapped in try-catch blocks. If a database error occurs, the server responds with a 500 Internal Server Error, and the frontend displays a graceful error message to the user, ensuring the app doesn't crash completely.

**7. How did you ensure your API is secure?**
*Answer:* I used `helmet` to set secure HTTP headers, configured `CORS` to restrict origins, used `express-rate-limit` to prevent brute-force attacks, and validated all incoming data using `Zod` to prevent malformed payloads.

**8. Explain CORS and why it's necessary.**
*Answer:* Cross-Origin Resource Sharing (CORS) is a browser security feature that restricts web pages from making requests to a different domain than the one that served the web page. I configured it on the Express backend to explicitly allow requests from the React frontend's URL.

**9. How do you test your application?**
*Answer:* I wrote automated tests using Jest and Supertest for the backend API to verify route logic and database interactions. For the frontend, I used Vitest and React Testing Library to test component rendering and user interactions.

**10. Describe the QR code check-in flow.**
*Answer:* Upon booking, the backend generates a unique, opaque token (booking reference). The frontend generates a QR code from this token. At the location, the admin scans the QR code, which sends the token to the backend. The backend verifies the token and updates the booking status to CHECKED_IN.

**11. Why use JWT instead of session cookies?**
*Answer:* JWTs are stateless, meaning the server doesn't need to store session data in memory or a database. This makes the backend easier to scale horizontally.

**12. How do you handle overlapping bookings in SQL?**
*Answer:* The logic is: `RequestedStartTime < ExistingEndTime AND RequestedEndTime > ExistingStartTime`. If this query returns any records for a slot, the slot is unavailable.

**13. What is the role of Vite in this project?**
*Answer:* Vite is the build tool and development server. It is significantly faster than Create React App (Webpack) because it uses native ES modules during development, resulting in near-instant hot module replacement (HMR).

**14. How would you scale this application?**
*Answer:* I would implement a Redis cache for frequently accessed data like parking locations, containerize the application using Docker, use a load balancer for the Node.js backend, and implement database read replicas.

**15. What was the most challenging part of this project?**
*Answer:* Handling the concurrency for the booking system. Ensuring that two users clicking "Book" at the exact same millisecond wouldn't successfully book the same slot required careful implementation of database transactions and understanding race conditions.
