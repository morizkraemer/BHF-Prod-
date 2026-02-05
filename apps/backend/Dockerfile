FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
EXPOSE 3000

# Run migrations then start the API (postgres is ready via depends_on + healthcheck)
CMD ["sh", "-c", "npm run migrate && exec node index.js"]

# Dev target: install devDependencies and run nodemon for hot reload
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm run migrate && exec npm run dev"]
