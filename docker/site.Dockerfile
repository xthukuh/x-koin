# xKoin presentation site: build the Vite SPA, serve the static output on nginx.
#
#   docker compose -f docker/compose.site.yml up --build
#
# Stage 1 needs more than web/: the markdown viewer imports the docs corpus at
# build time and the landing page reads the board photos under hardware/, both
# of which sit outside the Vite root. The legacy demo/ and protocol/viz/ pages
# are gone, so neither tree is copied any more.
#
# The runtime image serves nothing without the pass-wall cookie; see
# docker/site.nginx.conf and docker/gate/.
#
# Exclusions for this stage live in docker/site.Dockerfile.dockerignore, so the
# other images built from this repository keep their own context untouched.

FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first, so an edit to the sources does not re-run npm ci.
COPY web/package.json web/package-lock.json ./web/
RUN cd web && npm ci

# The docs corpus is imported at build time by the markdown viewer.
COPY docs/ ./docs/
COPY hardware/ ./hardware/
COPY web/ ./web/

RUN cd web && npm run build

FROM nginx:alpine AS runtime
COPY docker/site.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist/ /usr/share/nginx/html/
EXPOSE 80
