# Multi-stage build for React Vite PWA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs and manifests
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/
COPY apps/web/package*.json ./apps/web/

RUN npm install

# Copy source code
COPY packages/core ./packages/core
COPY apps/web ./apps/web

RUN npm run build -w packages/core
RUN npm run build -w apps/web

# Stage 2: Serve using lightweight Nginx
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
