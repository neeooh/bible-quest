# Backlog

## PWA: Add visual separator between macOS title bar and app navbar

On macOS Safari PWA installs, the OS title bar and the app navbar share the same background color (`#101827`). This creates the appearance of too much empty dark space at the top of the window.

**Fix:** Add a thin top border or gold accent line to the navbar (e.g. `border-t border-gold-500/30`) to visually separate the OS title bar from the app header.

**Why not Window Controls Overlay:** `display_override: ["window-controls-overlay"]` would eliminate the title bar entirely, but Safari (macOS and iOS) does not support it. Android does not have window chrome. WCO only works on Windows via Chrome/Edge. The accent line approach works on every platform.
