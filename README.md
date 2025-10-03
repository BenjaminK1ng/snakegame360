# 360° Snake Game PWA

A Progressive Web App snake game with 360° movement control designed specifically for mobile devices.

## Features

- 🎮 360° movement control - drag anywhere to control snake direction
- 🐍 No automatic movement - snake only moves when you control it
- 📱 Progressive Web App - installable on mobile and desktop
- 🔄 Works offline with Service Worker caching
- 💾 Data persistence using localStorage
- 📱 Responsive design that works on all screen sizes
- ⌨️ Touch-optimized controls with visual feedback

## PWA Features

- ✅ Installable on mobile and desktop
- ✅ Offline functionality
- ✅ Fullscreen standalone mode
- ✅ Add to home screen capability
- ✅ Fast loading with service worker caching

## How to Play

1. Tap the "Start Game" button to begin
2. Drag your finger anywhere on the screen to control the snake's direction
3. The snake will move in the direction you drag
4. Collect the red food to grow and increase your score
5. Avoid hitting the walls or the snake's own body

## Installation

### Mobile Installation:
1. Visit the game in your mobile browser
2. Look for the "Add to Home Screen" prompt or use browser menu
3. The app will install and open in fullscreen mode

### Desktop Installation:
1. Visit the game in Chrome/Edge
2. Look for the install icon in the address bar
3. Click to install as a desktop app

## Technical Details

- Built with HTML5 Canvas
- Pure JavaScript (no dependencies)
- Service Worker for offline functionality
- Web App Manifest for PWA capabilities
- Responsive design with CSS Grid/Flexbox
- Touch event handling for mobile controls

## File Structure

- `index.html` - Main HTML file with PWA meta tags
- `style.css` - Styling and responsive design
- `game.js` - Game logic and PWA functionality
- `sw.js` - Service Worker for offline support
- `manifest.json` - PWA manifest for installation
- `icons/` - App icons for PWA
- `README.md` - This file

## Browser Compatibility

Works on all modern browsers that support:
- HTML5 Canvas
- Service Workers
- Web App Manifest
- Touch Events (for mobile)

## Development

To run locally:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server