FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/bot/package.json apps/bot/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/core/package.json packages/core/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
ARG NEXTAUTH_SECRET=build-placeholder-secret-32chars-minimum
ARG NEXTAUTH_URL=http://localhost:3000
ARG DISCORD_CLIENT_ID=1507473175498457129
ARG DISCORD_CLIENT_SECRET=build-not-used
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET NEXTAUTH_URL=$NEXTAUTH_URL
ENV DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET
ENV DATABASE_URL=$DATABASE_URL
RUN pnpm db:generate && pnpm run build:ci

FROM node:20-alpine AS runtime
RUN addgroup -S sentinel && adduser -S sentinel -G sentinel
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/dashboard/.next ./apps/dashboard/.next
COPY --from=build /app/apps/dashboard/package.json ./apps/dashboard/package.json
COPY --from=build /app/packages ./packages
USER sentinel
WORKDIR /app/apps/dashboard
EXPOSE 3000
CMD ["node", "../../node_modules/next/dist/bin/next", "start", "-p", "3000"]
