@echo off
cd frontend
rmdir /s /q .
cd ..
call npm create vite@latest frontend -- --template react
cd frontend
call npm install react-router-dom axios lucide-react recharts socket.io-client
call npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom
call npx tailwindcss init -p
cd ..
cd backend
call npm init -y
call npm install express cors dotenv jsonwebtoken bcryptjs prisma @prisma/client socket.io zod helmet express-rate-limit
call npm install -D typescript @types/node @types/express jest supertest ts-jest nodemon
call npx prisma init
cd ..
