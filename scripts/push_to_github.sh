#!/usr/bin/env bash
# One-shot push once the fine-grained PAT exists (Contents: read/write on the
# single private repo). Usage:
#   GITHUB_PAT=github_pat_xxx GITHUB_REPO=xthukuh/x-koin scripts/push_to_github.sh
set -euo pipefail
: "${GITHUB_PAT:?set GITHUB_PAT}"
: "${GITHUB_REPO:?set GITHUB_REPO e.g. xthukuh/x-koin}"
cd "$(dirname "$0")/.."
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GITHUB_PAT}@github.com/${GITHUB_REPO}.git"
git push -u origin main
git remote set-url origin "https://github.com/${GITHUB_REPO}.git"  # scrub token from config
echo "pushed main to ${GITHUB_REPO}; token removed from git config"
