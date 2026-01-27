FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies with retry and network settings
COPY package*.json ./
RUN npm install --production --network-timeout=60000 --fetch-timeout=60000 || npm install --production --network-timeout=60000 --fetch-timeout=60000

# Copy app sources
COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
