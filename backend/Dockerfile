FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production --network-timeout=60000 --fetch-timeout=60000 || npm install --production --network-timeout=60000 --fetch-timeout=60000

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
