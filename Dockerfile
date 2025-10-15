FROM oven/bun:1.3.0-alpine

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

EXPOSE 3000

# Run migrations and start the application
CMD ["sh", "-c", "bun run prisma:migrate:deploy && bun run prisma:generate && bun start"]
