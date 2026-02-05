FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
EXPOSE 3000

# Run migrations then start the API (postgres is ready via depends_on + healthcheck)
CMD ["sh", "-c", "npm run migrate && exec node index.js"]
