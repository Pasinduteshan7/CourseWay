FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app sources
COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
