# Stage 1: build Vite app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY index.html vite.config.js ./
COPY src ./src

# Empty VITE_API_URL so the app uses relative /api (nginx will proxy)
ENV VITE_API_URL=
RUN npm run build

# Stage 2: nginx serve SPA + proxy /api to backend
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
