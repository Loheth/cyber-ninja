
# Fruit Ninja Game

## Overview
This is a simple implementation of the classic Fruit Ninja game. Slice through various fruits while avoiding the bombs to score points and advance through different difficulty levels. The game features a dynamic background, fruit facts display, and a fun theme selection screen.

**Now available as both a Python/Pygame desktop version and a web browser version!**

## Key Features
- **Fruit Slicing**: Slice through melons, oranges, pomegranates, guavas, and avoid bombs to score points.
- **Dynamic Difficulty Levels**: The game adjusts difficulty based on player performance, affecting spawn rates and bomb frequency.
- **Theme Selection**: Choose between different themes (e.g., Summer, Winter) for a personalized gaming experience.
- **Fruit Facts Display**: Learn interesting facts about fruits while playing, displayed dynamically on the screen.
- **Lives System**: The player starts with three lives and loses one for each bomb hit. The game ends when all lives are lost.
- **Timer**: Each round lasts 60 seconds.

## How to Play - Web Version (Recommended)

1. **Open the game**: Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari).
2. **Select a theme**: Click "Summer" or "Winter" to choose your preferred background.
3. **Start playing**: Click anywhere or press Enter to begin.
4. **Slice fruits**: Move your mouse (or finger on touch devices) to slice fruits. Avoid bombs!
5. **Score points**: Each fruit sliced gives you points. The game ends when you lose all lives or time runs out.

**No installation required!** Just open `index.html` in your browser.

## How to Play - Python/Pygame Version

1. **Install Python 3.x** (if not already installed)
2. **Install Pygame**:
   ```bash
   pip install pygame
   ```
3. **Run the game**:
   ```bash
   python "fruit_ninja (2).py"
   ```

## Controls

- **Mouse/Touch**: Move to slice fruits and avoid bombs
- **Enter Key**: Start a new game from the menu screen
- **Click Professor**: On the theme selection screen, click the professor to see fruit facts

## Game Rules

- Start with 3 lives
- Slice fruits to score points
- Avoid bombs - they cost you a life!
- Game ends when you lose all lives or time runs out
- Difficulty adjusts automatically based on your performance

## Files

- `index.html` - Web version (open in browser)
- `game.js` - Web version game logic
- `fruit_ninja (2).py` - Python/Pygame version
- `images/` - Game assets (fruits, bombs, lives, etc.)
- `summer.jpg`, `winter.jpg` - Background images

## Browser Compatibility

The web version works on:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (touch support included)

## Notes

- Make sure all image files are in the correct directories
- The web version requires a local web server for best results (some browsers may have CORS restrictions)
- For local development, you can use Python's built-in server:
  ```bash
  python -m http.server 8000
  ```
  Then open `http://localhost:8000` in your browser.

Feel free to contribute, report issues, or suggest improvements!

