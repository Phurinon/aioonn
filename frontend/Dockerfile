# Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Declare build-time argument and expose as ENV so Vite can read it during build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage: serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config to support React Router (SPA fallback)
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
