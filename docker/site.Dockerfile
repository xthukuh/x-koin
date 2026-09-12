# xKoin presentation site: build the Vite SPA, serve the static output on nginx.
#
#   docker compose -f docker/compose.site.yml up --build
#
# Stage 1 needs more than web/: web/scripts/inline-data.mjs reads the legacy
# page sources from demo/ and protocol/viz/, the board schematics from
# hardware/, and the proof JSON from protocol/out/ when it is present. The whole
# protocol/ tree is copied because protocol/out/ is a run artefact that git does
# not track, so it may or may not exist in the build context; when the JSON is
# absent the inliner leaves the markers as null and warns.
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
COPY demo/ ./demo/
COPY protocol/ ./protocol/
COPY hardware/ ./hardware/
COPY web/ ./web/

RUN cd web && npm run build

FROM nginx:alpine AS runtime
COPY docker/site.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist/ /usr/share/nginx/html/
EXPOSE 80
