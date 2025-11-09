FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
EXPOSE 3000

VOLUME /app/data

ARG GIT_DESCRIBE
ARG BUILD_DATE

ENV NUXT_PUBLIC_GIT_DESCRIBE=$GIT_DESCRIBE NUXT_PUBLIC_BUILD_DATE=$BUILD_DATE
CMD ["bun", "run", "./.output/server/index.mjs"]