# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Install dependencies first (leverages layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
