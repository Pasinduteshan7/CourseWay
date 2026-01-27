FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Use npm install with network timeout settings and explicit error handling
RUN npm install --network-timeout=60000 --fetch-timeout=60000 --legacy-peer-deps || \
    (echo "First npm install failed, retrying..." && npm install --network-timeout=60000 --fetch-timeout=60000 --legacy-peer-deps) || \
    (echo "npm install failed after retry" && exit 1)

FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
# Start Vite dev server, bind to all interfaces so container is reachable
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]