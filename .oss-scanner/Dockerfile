FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git python3 \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

WORKDIR /src
COPY . .

RUN pnpm install --frozen-lockfile

# These values satisfy build-time checks without granting access to services.
ENV NEXT_TELEMETRY_DISABLED=1
RUN NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
    NEXT_PUBLIC_SERVER_URL=http://localhost:3001 \
    NEXT_PUBLIC_WEB_URL=http://localhost:3000 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    PAYLOAD_SECRET=scanner-build-only-secret-at-least-32-characters \
    pnpm turbo run build \
    --filter=api... \
    --filter=cms... \
    --filter=logos-crm... \
    --filter=logos-demos... \
    && pnpm --filter web check-types
