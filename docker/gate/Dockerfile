# The xKoin pass-wall gate: one file, Node built-ins only, no npm install.
#
# Built from docker/compose.site.yml with context docker/gate, so the build
# context is the three files in this directory and nothing else.

FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY server.mjs ./server.mjs

USER node
EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8081/healthz || exit 1

CMD ["node", "server.mjs"]
