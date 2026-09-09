# xKoin proof matrix, containerised so it behaves the same on any host.
#
# Two named stages:
#   proofs   - everything scripts/bootstrap.sh needs: Python 3.12 + venv,
#              gcc/make for the firmware host tests, git, and Foundry
#              (forge/anvil/cast) via foundryup.
#   firmware - proofs plus PlatformIO Core, with the espressif32 platform
#              pre-fetched into the image layer so `pio run` does not
#              re-download the ESP-IDF toolchain on every container run.
#
# The repository itself is never copied in: docker/compose.yml bind-mounts
# the working tree at /work, so proofs always run against what is actually
# on disk, not a stale COPY.

FROM ubuntu:24.04 AS proofs

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        python3-venv \
        python3-pip \
        build-essential \
        gcc \
        make \
        git \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Foundry (forge, anvil, cast) via foundryup, pinned to whatever "stable"
# resolves to at image build time. The installed version is recorded to a
# file (and mirrored into a LABEL) so a build report can show exactly what
# shipped, without needing a container running to ask it.
ENV FOUNDRY_DIR=/opt/foundry
ENV PATH="${FOUNDRY_DIR}/bin:${PATH}"
# foundry.paradigm.xyz 301s to raw.githubusercontent.com, which occasionally
# answers a transient 503 from its edge cache; retry the installer fetch
# itself (curl --retry only covers curl's own connection, not a bash-script
# failure of the wrong thing being piped in) before giving up.
RUN set -e; \
    ok=0; \
    for i in 1 2 3 4 5; do \
        if curl -fsSL --retry 3 --retry-connrefused https://foundry.paradigm.xyz -o /tmp/foundryup-init.sh \
            && head -c 64 /tmp/foundryup-init.sh | grep -qv '<?xml'; then \
            ok=1; break; \
        fi; \
        echo "foundryup installer fetch attempt $i failed (upstream error page or connection issue), retrying in 10s"; \
        sleep 10; \
    done; \
    if [ "$ok" != 1 ]; then echo "foundryup installer unreachable after 5 attempts"; exit 1; fi; \
    bash /tmp/foundryup-init.sh \
    && "${FOUNDRY_DIR}/bin/foundryup" \
    && mkdir -p /opt/build-info \
    && "${FOUNDRY_DIR}/bin/forge" --version | tee /opt/build-info/forge-version.txt \
    && "${FOUNDRY_DIR}/bin/anvil" --version | tee /opt/build-info/anvil-version.txt

LABEL org.xkoin.forge_version="pinned at build time, see /opt/build-info/forge-version.txt"

# Python deps for gateway-api and protocol/ (pynacl, web3, pytest, etc.) in
# an isolated venv that goes first on PATH, so bare `python3`/`pip` resolve
# here without any activation step.
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv "${VIRTUAL_ENV}"
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

# Only the requirements files are copied at build time (so pip installs are
# layer-cached); the rest of the repo arrives via the bind mount at /work.
COPY gateway-api/requirements.txt gateway-api/requirements-dev.txt /tmp/gateway-api-requirements/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir \
        -r /tmp/gateway-api-requirements/requirements.txt \
        -r /tmp/gateway-api-requirements/requirements-dev.txt \
    && rm -rf /tmp/gateway-api-requirements

WORKDIR /work


FROM proofs AS firmware

RUN pip install --no-cache-dir platformio

# Pre-fetch the espressif32 platform (ESP-IDF toolchain) into this layer so
# `docker compose run firmware` does not pull several GB on every run. This
# uses a throwaway copy of platformio.ini, not the bind mount (unavailable
# at build time), so the project directory referenced here is scratch space
# only, never confused with /work/firmware/xkoin-gateway at runtime.
#
# If this step could not finish inside its time budget when the image was
# built, it was deliberately left out (see the build report); the stage
# still has PlatformIO Core installed and will fetch the platform on first
# `pio run` instead.
COPY firmware/xkoin-gateway/platformio.ini /tmp/pio-warm/platformio.ini
RUN cd /tmp/pio-warm && pio pkg install -e esp32-s3 && rm -rf /tmp/pio-warm

WORKDIR /work/firmware/xkoin-gateway
