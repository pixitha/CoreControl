# Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY ./prisma ./prisma

# Install all dependencies (including devDependencies)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Build the application
COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV production

# Copy package files
COPY package.json package-lock.json* ./

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Remove dev dependencies
RUN npm prune --production

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js* ./

EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
