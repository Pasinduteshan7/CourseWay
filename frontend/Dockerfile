FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Use npm install (safer if package-lock.json isn't present)
RUN npm install

FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
# Start Vite dev server, bind to all interfaces so container is reachable
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
