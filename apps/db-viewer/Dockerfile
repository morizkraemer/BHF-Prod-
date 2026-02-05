# Stage 1: build Vite app (context = repo root so shared/ is available)
FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/db-viewer/package.json ./
RUN npm install

COPY apps/db-viewer/index.html apps/db-viewer/vite.config.js ./
COPY apps/db-viewer/src ./src
COPY shared ./shared

# Empty VITE_API_URL so the app uses relative /api (nginx will proxy)
ENV VITE_API_URL=
ENV VITE_SHARED_PATH=shared
RUN npm run build

# Stage 2: nginx serve SPA + proxy /api to backend
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY apps/db-viewer/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
