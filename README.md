# CRM BACKEND

## Tech stack

Node.js 20+, TypeScript, Express.js, PostgreSQL, Prisma, Swagger

## Cách chạy local

1. yarn install
2. Tạo file .env (theo mẫu bên dưới)
3. npx prisma generate
4. yarn dev

## Mẫu .env

DATABASE_URL="postgresql://<your_user>:<your_password>@localhost:5432/<your_database>?schema=public"
PORT=3000

## API Docs

http://localhost:3000/api-docs

## Health check

GET http://localhost:3000/api/health
