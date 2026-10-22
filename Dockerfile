FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=1536
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.generated ./.generated
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/scripts/bootstrap.ts ./scripts/bootstrap.ts
COPY --from=builder /app/scripts/test-account.ts ./scripts/test-account.ts
USER node
EXPOSE 4321
HEALTHCHECK --interval=20s --timeout=5s --start-period=90s --retries=5 CMD node -e "fetch('http://127.0.0.1:4321/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh","-c","node scripts/bootstrap.ts && exec node dist/server/entry.mjs"]
