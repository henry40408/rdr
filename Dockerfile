FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
EXPOSE 3000

VOLUME /app/data

ARG VERSION
ARG BUILD_DATE

ENV NUXT_PUBLIC_VERSION=$VERSION NUXT_PUBLIC_BUILD_DATE=$BUILD_DATE
CMD ["node", ".output/server/index.mjs"]