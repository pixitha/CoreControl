# Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Zuerst package.json und package-lock.json kopieren
COPY package.json package-lock.json* ./

# Prisma-Verzeichnis kopieren (mit explizitem Pfad-Check)
COPY ./prisma ./prisma

# Abhängigkeiten installieren
RUN npm install
RUN npx prisma generate

# Restlichen Code kopieren
COPY . .

# Build durchführen
RUN npm run build

# Production Stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV production

# Nur Produktionsabhängigkeiten installieren
COPY package.json package-lock.json* ./
RUN npm install --production

# Prisma-Client kopieren
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma

# Next.js Build-Artefakte
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js* ./

EXPOSE 3000
CMD ["npm", "start"]