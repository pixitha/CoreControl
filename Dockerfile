# Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY ./prisma ./prisma

RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV production

# Install production dependencies INCLUDING prisma
COPY package.json package-lock.json* ./
RUN npm install --production --ignore-scripts

# Copy needed Prisma files
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js* ./

EXPOSE 3000

# Run migrations first, then start app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]