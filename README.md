# Nightclub Production Tool

Electron desktop application for gathering end-of-shift information at a nightclub.

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Run the app:
```bash
npm start
```

3. Run in development mode (with DevTools):
```bash
npm run dev
```

## Building

Build the application for distribution:

```bash
# Build for current platform (macOS by default)
npm run build

# Build for specific platforms
npm run build:mac
npm run build:win
npm run build:linux

# Build for all platforms
npm run build:all
```

Built applications will be output to the `dist/` directory.

## Project Structure

- `main.js` - Electron main process
- `preload.js` - Preload script for secure IPC
- `index.html` - Main window HTML
- `src/` - React components and styles
- `assets/` - Icons and other assets

## Features

- Multi-section form system
- PDF generation
- Scanner integration
- File management
- Data persistence

See `PLAN.md` for detailed project plan.





