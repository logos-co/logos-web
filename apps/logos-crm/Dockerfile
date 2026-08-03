FROM node:24-alpine

RUN corepack enable && corepack prepare pnpm@11.1.0 --activate

WORKDIR /workspace

COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm --filter @acid-info/logos-ui build \
  && DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm --filter logos-crm build

EXPOSE 3004

CMD ["pnpm", "--filter", "logos-crm", "start"]
