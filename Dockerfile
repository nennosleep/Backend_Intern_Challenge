# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and lock file
COPY package*.json yarn.lock ./

# Install dependencies (including devDependencies)
RUN yarn install

# Copy source code and prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code
RUN yarn build

# Stage 2: Run the application
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production

# Copy built files and prisma schema from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Command to run (wait for DB, migrate, start server)
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/server.js"]
