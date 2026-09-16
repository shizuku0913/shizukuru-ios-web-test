#!/usr/bin/env sh
set -eu
GRADLE_VERSION=8.11.1
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BOOT_DIR="$ROOT_DIR/.gradle-bootstrap"
ZIP="$BOOT_DIR/gradle-$GRADLE_VERSION-bin.zip"
DIST="$BOOT_DIR/gradle-$GRADLE_VERSION"
if [ ! -x "$DIST/bin/gradle" ]; then
  mkdir -p "$BOOT_DIR"
  if [ ! -f "$ZIP" ]; then
    if command -v curl >/dev/null 2>&1; then
      curl -L "https://services.gradle.org/distributions/gradle-$GRADLE_VERSION-bin.zip" -o "$ZIP"
    elif command -v wget >/dev/null 2>&1; then
      wget -O "$ZIP" "https://services.gradle.org/distributions/gradle-$GRADLE_VERSION-bin.zip"
    else
      echo "curl or wget is required to bootstrap Gradle." >&2
      exit 1
    fi
  fi
  unzip -q -o "$ZIP" -d "$BOOT_DIR"
fi
exec "$DIST/bin/gradle" "$@"
