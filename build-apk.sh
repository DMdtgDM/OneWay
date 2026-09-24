#!/usr/bin/env bash
# Builds an installable Android .apk for OneWay using EAS Build (Expo's
# cloud build service). No Android Studio or SDK needed on your machine.
#
# One-time setup:
#   1. Create a free account at https://expo.dev (if you don't have one)
#   2. npm install -g eas-cli
#   3. eas login
#
# Then just run this script from the project root:
#   ./build-apk.sh

set -e

if ! command -v eas &> /dev/null; then
  echo "eas-cli not found. Install it first:"
  echo "  npm install -g eas-cli"
  exit 1
fi

echo "Building Android APK with EAS (profile: preview)..."
eas build --platform android --profile preview

echo ""
echo "Done. EAS will print a download link above once the build finishes —"
echo "open it on your phone (or download the .apk) to install directly."
