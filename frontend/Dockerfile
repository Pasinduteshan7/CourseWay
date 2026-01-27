FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Use npm install with network timeout settings
RUN npm install --network-timeout=60000 --fetch-timeout=60000 || npm install --network-timeout=60000 --fetch-timeout=60000

FROM node:20-alpine AS dev
WORKDIR /app
