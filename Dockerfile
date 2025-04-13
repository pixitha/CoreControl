# Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

COPY ./prisma ./prisma

RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV production

COPY package.json package-lock.json* ./
RUN npm install --production

COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js* ./

EXPOSE 3000
CMD ["npm", "start"]