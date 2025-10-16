#!/bin/bash

SRC="favicon.svg"
OUTDIR="public"

mkdir -p "$OUTDIR"

# Favicon ICO (multi-size)
magick "$SRC" -define icon:auto-resize=16,32,48 "$OUTDIR/favicon.ico"

# PNG icons
magick -density 16 "$SRC" -resize 16x16   -background none -quality 100 "$OUTDIR/favicon-16x16.png"
magick -density 32 "$SRC" -resize 32x32   -background none -quality 100 "$OUTDIR/favicon-32x32.png"
magick -density 180 "$SRC" -resize 180x180 -background none -quality 100 "$OUTDIR/apple-touch-icon.png"
magick -density 192 "$SRC" -resize 192x192 -background none -quality 100 "$OUTDIR/android-chrome-192x192.png"
magick -density 512 "$SRC" -resize 512x512 -background none -quality 100 "$OUTDIR/android-chrome-512x512.png"

echo "Icons generated in $OUTDIR/"