# The build output is plain JS, so it runs once on the native build platform; only the copy-only runtime stage is per-arch.
FROM --platform=$BUILDPLATFORM oven/bun:1.4.1-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# sharp is native (wrong arch here) and unused: the app has no next/image.
RUN bun run build \
 && rm -rf .next/standalone/node_modules/sharp .next/standalone/node_modules/@img \
 && cp -r public .next/standalone/ \
 && cp -r .next/static .next/standalone/.next/

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=nonroot:nonroot /app/.next/standalone ./
EXPOSE 3000
CMD ["server.js"]
