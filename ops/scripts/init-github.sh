#!/bin/bash
# One-shot: initialise the rewards-app repo on GitHub.
# Run this from the repo root after creating the empty GitHub repo.
#
# Usage:  ./ops/scripts/init-github.sh <github-username> <repo-name>
# Example: ./ops/scripts/init-github.sh youngstunners88 rewards-app

set -euo pipefail

USERNAME="${1:-}"
REPO="${2:-rewards-app}"

if [ -z "$USERNAME" ]; then
  echo "Usage: $0 <github-username> <repo-name>"
  exit 1
fi

cd "$(dirname "$0")/../.."

git init -b main
git add .
git commit -m "chore: initial scaffold (CLAUDE.md + 4 workspaces + static app)"
git remote add origin "https://github.com/${USERNAME}/${REPO}.git"
git push -u origin main

echo "Pushed to https://github.com/${USERNAME}/${REPO}"
