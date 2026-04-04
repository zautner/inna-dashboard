# Stage 1: Build the Vite/React app
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# GEMINI_API_KEY is baked into the JS bundle at build time by Vite
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# TELEGRAM_BOT_USERNAME is baked into the JS bundle at build time by Vite
ARG TELEGRAM_BOT_USERNAME
ENV TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}

RUN npm run build

# Stage 2: Run the production API server that also serves the built app
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server.js plansStorage.js ./
COPY bot ./bot

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
