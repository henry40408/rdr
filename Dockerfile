FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-distroless
WORKDIR /app
COPY --from=builder /app/.output .output
EXPOSE 3000

VOLUME /app/data

CMD ["bun", "run", "./.output/server/index.mjs"]