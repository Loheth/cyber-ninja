// Game Constants
let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
const FPS = 60;
const GAME_DURATION = 60; // seconds

// Function to resize canvas
function resizeCanvas() {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    factScrollX = WIDTH / 1.6;
    // Reset theme buttons so they're recalculated with new dimensions
    if (gameState === 'theme') {
        themeButtons.summerButton = null;
        themeButtons.winterButton = null;
    }
}

// Game State
let playerLives = 3;
let score = 0;
let gameDuration = GAME_DURATION;
let currentTime = 0;
let fruitSpawnRate = 0.2;
let bombFrequency = 0.1;
let currentDifficulty = "Easy";
let gameOver = true;
let gameRunning = true;
let firstRound = true;
let theme = "Summer";
let startTime = 0;
let factsDisplayed = [];

// Fruits array
const fruits = ['melon', 'orange', 'pomegranate', 'guava', 'bomb'];

// Fruit facts
const fruitFacts = [
    "Did you know that bananas are berries?",
    "Grapes can be used to make wine.",
    "Melons are an excellent choice for staying hydrated.",
    "Guavas are sometimes called 'the poor man's apple'.",
    "Each pomegranate can contain hundreds of juicy seeds, known as arils.",
    "Oranges are a good source of vitamin C.",
    "Cranberries can bounce!",
    "Orange trees can live for up to 100 years and continue to produce fruit throughout their long lives.",
    "Guavas are often referred to as superfruits because of their high nutritional value.",
    "Pomegranates are known as 'nature's candy' due to their sweet and tart flavor.",
    "Some oranges can be fully ripe while still green in color.",
    "The world's heaviest melon on record weighed over 350 pounds!"
];

// Colors
const WHITE = '#FFFFFF';
const BLACK = '#000000';
const RED = '#FF0000';
const GREEN = '#00FF00';
const BLUE = '#0000FF';

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loadingScreen');

// Set initial canvas size
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Game assets
const assets = {
    background: null,
    themeSelectionBg: null, // Background for theme selection screen
    summerBg: null, // Background for summer gameplay
    winterBg: null,
    fruits: {},
    halfFruits: {},
    lives: {
        white: null,
        red: null
    },
    explosion: null,
    gameOver: null
};

// Fruit data
const fruitData = {};

// Current fact display
let currentFact = null;
let factScrollX = WIDTH / 1.6;
let factScrollSpeed = 2;
let factDisplayTime = 0;
let factDisplayDuration = 3000; // 3 seconds

// Mouse position
let mouseX = 0;
let mouseY = 0;
let mouseDown = false;

// Cybersecurity effects
let glitchOffset = 0;
let glitchTimer = 0;
let scanlineOffset = 0;

// Game state
let gameState = 'loading'; // 'loading', 'theme', 'menu', 'playing', 'gameover'

// Theme button positions (stored globally for consistent click detection)
let themeButtons = {
    summerButton: null,
    winterButton: null
};

// Load all images
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            reject(new Error(`Failed to load image: ${src}`));
        };
        img.src = src;
    });
}

async function loadAssets() {
    try {
        // Load backgrounds
        // Theme selection screen background (initial screen)
        console.log('Loading theme selection background...');
        assets.themeSelectionBg = await loadImage('images/backgound.png');
        console.log('Theme selection background loaded successfully');
        
        // Summer gameplay background (cyber-tropical image)
        // Replace 'summer.png' with your cyber-tropical image filename when you add it
        console.log('Loading summer background...');
        assets.summerBg = await loadImage('summer.png'); // TODO: Replace with your cyber-tropical image
        console.log('Summer background loaded successfully');
        
        console.log('Loading winter background...');
        assets.winterBg = await loadImage('winter.png');
        console.log('Winter background loaded successfully');
        
        assets.background = assets.themeSelectionBg; // Use theme selection bg initially
        
        // Load fruit images
        for (const fruit of fruits) {
            assets.fruits[fruit] = await loadImage(`images/${fruit}.png`);
            if (fruit !== 'bomb') {
                assets.halfFruits[fruit] = await loadImage(`images/half_${fruit}.png`);
            }
        }
        
        // Load explosion
        assets.explosion = await loadImage('images/explosion.png');
        
        // Load lives
        assets.lives.white = await loadImage('images/white_lives.png');
        assets.lives.red = await loadImage('images/red_lives.png');
        
        // Load game over
        assets.gameOver = await loadImage('images/game_over.png');
        
        loadingScreen.style.display = 'none';
        gameState = 'theme';
        return true;
    } catch (error) {
        console.error('Error loading assets:', error);
        loadingScreen.textContent = 'Error loading assets. Please check file paths.';
        return false;
    }
}

// Generate random fruit
function generateRandomFruit(fruit) {
    fruitData[fruit] = {
        x: Math.random() * (WIDTH - 100) + 50,
        y: HEIGHT, // Start at bottom of screen
        speedX: (Math.random() * 2 - 1), // Horizontal movement: -1 to 1 (scaled for 60 FPS)
        speedY: -(Math.random() * 6 + 8), // Upward speed: -8 to -14 (higher bounce)
        throw: Math.random() >= 0.25,
        t: 0,
        hit: false,
        img: assets.fruits[fruit]
    };
}

// Initialize fruit data
function initializeFruits() {
    for (const fruit of fruits) {
        generateRandomFruit(fruit);
    }
}

// Draw text helper
function drawText(text, size, x, y, color = WHITE, align = 'center') {
    ctx.fillStyle = color;
    ctx.font = `${size}px Arial`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

// Draw styled text with shadow and gradient effect
function drawStyledText(text, size, x, y, color = WHITE, align = 'center', shadowColor = 'rgba(0, 0, 0, 0.8)') {
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${size}px Arial`;
    
    // Measure text width for proper gradient positioning
    const textWidth = ctx.measureText(text).width;
    const gradientStartX = align === 'center' ? x - textWidth / 2 : (align === 'right' ? x - textWidth : x);
    const gradientEndX = gradientStartX + textWidth;
    
    // Draw shadow (multiple layers for depth)
    ctx.fillStyle = shadowColor;
    ctx.fillText(text, x + 3, y + 3);
    ctx.fillText(text, x + 2, y + 2);
    ctx.fillText(text, x + 1, y + 1);
    
    // Draw main text with gradient effect
    const gradient = ctx.createLinearGradient(gradientStartX, y - size/2, gradientEndX, y + size/2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, lightenColor(color, 0.3));
    gradient.addColorStop(1, color);
    
    ctx.fillStyle = gradient;
    ctx.fillText(text, x, y);
}

// Helper function to lighten a color
function lightenColor(color, amount) {
    if (color.startsWith('#')) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + (255 * amount));
        const g = Math.min(255, ((num >> 8) & 0x00FF) + (255 * amount));
        const b = Math.min(255, (num & 0x0000FF) + (255 * amount));
        return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
}

// Draw rounded rectangle helper
function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Draw rounded rectangle with angular indentations (futuristic style)
function drawFuturisticButton(x, y, width, height, radius, indentSize = 15) {
    ctx.beginPath();
    // Top-left corner
    ctx.moveTo(x + radius, y);
    // Top edge with indentations
    ctx.lineTo(x + width * 0.25 - indentSize / 2, y);
    ctx.lineTo(x + width * 0.25, y + indentSize);
    ctx.lineTo(x + width * 0.25 + indentSize / 2, y);
    ctx.lineTo(x + width * 0.75 - indentSize / 2, y);
    ctx.lineTo(x + width * 0.75, y + indentSize);
    ctx.lineTo(x + width * 0.75 + indentSize / 2, y);
    ctx.lineTo(x + width - radius, y);
    // Top-right corner
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    // Right edge
    ctx.lineTo(x + width, y + height - radius);
    // Bottom-right corner
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    // Bottom edge with indentations
    ctx.lineTo(x + width * 0.75 + indentSize / 2, y + height);
    ctx.lineTo(x + width * 0.75, y + height - indentSize);
    ctx.lineTo(x + width * 0.75 - indentSize / 2, y + height);
    ctx.lineTo(x + width * 0.25 + indentSize / 2, y + height);
    ctx.lineTo(x + width * 0.25, y + height - indentSize);
    ctx.lineTo(x + width * 0.25 - indentSize / 2, y + height);
    ctx.lineTo(x + radius, y + height);
    // Bottom-left corner
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    // Left edge
    ctx.lineTo(x, y + radius);
    // Top-left corner
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Draw palm tree icon
function drawPalmTreeIcon(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 40, size / 40);
    
    // Trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(15, 20, 10, 20);
    
    // Leaves
    ctx.strokeStyle = '#228B22';
    ctx.fillStyle = '#228B22';
    ctx.lineWidth = 2;
    
    // Left leaf
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(5, 5);
    ctx.lineTo(8, 8);
    ctx.lineTo(20, 15);
    ctx.closePath();
    ctx.fill();
    
    // Right leaf
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(35, 5);
    ctx.lineTo(32, 8);
    ctx.lineTo(20, 15);
    ctx.closePath();
    ctx.fill();
    
    // Top leaf
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(20, 0);
    ctx.lineTo(18, 5);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    
    // Ground patch
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(20, 40, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw sun icon
function drawSunIcon(x, y, size, color = '#FFD700') {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Sun circle
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Rays
    const rayLength = size * 0.2;
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 2 * i) / rayCount;
        ctx.beginPath();
        ctx.moveTo(
            Math.cos(angle) * size * 0.3,
            Math.sin(angle) * size * 0.3
        );
        ctx.lineTo(
            Math.cos(angle) * (size * 0.3 + rayLength),
            Math.sin(angle) * (size * 0.3 + rayLength)
        );
        ctx.stroke();
    }
    
    ctx.restore();
}

// Draw snowflake icon
function drawSnowflakeIcon(x, y, size, color = '#FFFFFF') {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    
    const armLength = size * 0.25;
    const armCount = 6;
    
    for (let i = 0; i < armCount; i++) {
        const angle = (Math.PI * 2 * i) / armCount;
        ctx.save();
        ctx.rotate(angle);
        
        // Main arm
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, armLength);
        ctx.stroke();
        
        // Side branches
        ctx.beginPath();
        ctx.moveTo(0, armLength * 0.4);
        ctx.lineTo(-armLength * 0.3, armLength * 0.5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, armLength * 0.4);
        ctx.lineTo(armLength * 0.3, armLength * 0.5);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw mountains icon
function drawMountainsIcon(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = '#E0E0E0';
    ctx.strokeStyle = '#B0B0B0';
    ctx.lineWidth = 1.5;
    
    // Left mountain
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, size * 0.2);
    ctx.lineTo(-size * 0.15, -size * 0.1);
    ctx.lineTo(0, size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Right mountain
    ctx.beginPath();
    ctx.moveTo(0, size * 0.1);
    ctx.lineTo(size * 0.15, -size * 0.15);
    ctx.lineTo(size * 0.3, size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Snow caps
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, -size * 0.1);
    ctx.lineTo(-size * 0.1, -size * 0.05);
    ctx.lineTo(-size * 0.05, -size * 0.08);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(size * 0.15, -size * 0.15);
    ctx.lineTo(size * 0.1, -size * 0.1);
    ctx.lineTo(size * 0.05, -size * 0.12);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Check if mouse is hovering over a button
function isHovering(button, centerX) {
    // Account for potential scaling (hover area slightly larger for better UX)
    const hoverPadding = 5;
    return mouseX >= button.x - hoverPadding && mouseX <= button.x + button.width + hoverPadding &&
           mouseY >= button.y - hoverPadding && mouseY <= button.y + button.height + hoverPadding;
}

// Draw cyber grid pattern
function drawCyberGrid(x, y, width, height, gridSize = 20) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i, y + height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, y + i);
        ctx.lineTo(x + width, y + i);
        ctx.stroke();
    }
    
    ctx.restore();
}

// Draw scanline effect
function drawScanlines(x, y, width, height) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < height; i += 3) {
        ctx.beginPath();
        ctx.moveTo(x, y + i);
        ctx.lineTo(x + width, y + i);
        ctx.stroke();
    }
    
    ctx.restore();
}

// Draw glitch effect
function drawGlitchText(text, x, y, color, fontSize, isHover) {
    if (!isHover) {
        // Normal text
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        return;
    }
    
    // Glitch effect on hover
    const glitchIntensity = Math.sin(glitchTimer * 0.3) * 3;
    const colorShift = Math.random() > 0.7;
    
    // Red/cyan glitch effect
    if (colorShift) {
        ctx.fillStyle = '#FF0040';
        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x - glitchIntensity, y);
        
        ctx.fillStyle = '#00FFFF';
        ctx.fillText(text, x + glitchIntensity, y);
    }
    
    // Main text with slight offset
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

// Draw binary code pattern
function drawBinaryPattern(x, y, width, height) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    
    const binaryChars = ['0', '1'];
    const charsPerLine = Math.floor(width / 8);
    const lines = Math.floor(height / 12);
    
    for (let i = 0; i < lines; i++) {
        let binaryLine = '';
        for (let j = 0; j < charsPerLine; j++) {
            binaryLine += binaryChars[Math.floor(Math.random() * 2)];
        }
        ctx.fillText(binaryLine, x, y + i * 12);
    }
    
    ctx.restore();
}

// Draw button matching the design from background.png
function drawThemeButton(button, text, centerX, isSummer, radius) {
    const isHover = isHovering(button, centerX);
    const scale = isHover ? 1.05 : 1.0;
    
    // Calculate scaled dimensions
    const scaledWidth = button.width * scale;
    const scaledHeight = button.height * scale;
    const scaledX = centerX - scaledWidth / 2;
    const scaledY = button.y - (scaledHeight - button.height) / 2;
    
    // Colors matching the background image design
    let baseColor, lightColor, darkColor, borderColor, textColor, iconColor;
    if (isSummer) {
        // Bright yellow-gold for Summer (matching the image)
        baseColor = '#FFD700';      // Gold
        lightColor = '#FFED4E';     // Light gold
        darkColor = '#D4AF37';      // Darker gold
        borderColor = '#FFD700';    // Glowing neon outline
        textColor = '#FFD700';      // Glowing yellow text
        iconColor = '#FFD700';      // Yellow sun icon
    } else {
        // Vibrant light blue for Winter (matching the image)
        baseColor = '#00BFFF';      // Light blue
        lightColor = '#87CEEB';     // Sky blue
        darkColor = '#0096FF';     // Deeper blue
        borderColor = '#00BFFF';   // Glowing neon outline
        textColor = '#00BFFF';     // Glowing blue text
        iconColor = '#00BFFF';     // Blue snowflake icons
    }
    
    // Draw drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    drawRoundedRect(scaledX + 3, scaledY + 3, scaledWidth, scaledHeight, radius);
    ctx.fill();
    
    // Main button body with metallic beveled gradient
    const gradient = ctx.createLinearGradient(scaledX, scaledY, scaledX, scaledY + scaledHeight);
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(0.3, baseColor);
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(1, darkColor);
    
    ctx.fillStyle = gradient;
    drawRoundedRect(scaledX, scaledY, scaledWidth, scaledHeight, radius);
    ctx.fill();
    
    // Inner highlight for beveled effect (top highlight)
    const highlightGradient = ctx.createLinearGradient(scaledX, scaledY, scaledX, scaledY + scaledHeight * 0.3);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    drawRoundedRect(scaledX, scaledY, scaledWidth, scaledHeight, radius);
    ctx.fill();
    
    // Outer glowing neon border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isHover ? 4 : 3;
    ctx.shadowBlur = isHover ? 20 : 15;
    ctx.shadowColor = borderColor;
    drawRoundedRect(scaledX, scaledY, scaledWidth, scaledHeight, radius);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Hover glow effect
    if (isHover) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.shadowBlur = 30;
        ctx.shadowColor = borderColor;
        drawRoundedRect(scaledX - 2, scaledY - 2, scaledWidth + 4, scaledHeight + 4, radius + 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }
    
    // Draw icons and text
    const iconSize = 28;
    const textY = button.y + button.height / 2;
    const textSize = 40; // Larger text for better visibility
    
    if (isSummer) {
        // Sun icon to the left of "SUMMER" text
        ctx.shadowBlur = 10;
        ctx.shadowColor = iconColor;
        drawSunIcon(centerX - scaledWidth / 2 + 35, textY, iconSize, iconColor);
        ctx.shadowBlur = 0;
        
        // "SUMMER" text - clean white text with smooth colored glow
        ctx.font = `bold ${textSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Smooth colored stroke outline
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 0;
        ctx.strokeText(text, centerX, textY);
        
        // Main white text with smooth colored glow
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 30;
        ctx.shadowColor = textColor;
        ctx.fillText(text, centerX, textY);
        ctx.shadowBlur = 0;
    } else {
        // Snowflake icons to the left and right of "WINTER" text
        ctx.shadowBlur = 10;
        ctx.shadowColor = iconColor;
        drawSnowflakeIcon(centerX - scaledWidth / 2 + 30, textY, iconSize, iconColor);
        drawSnowflakeIcon(centerX + scaledWidth / 2 - 30, textY, iconSize, iconColor);
        ctx.shadowBlur = 0;
        
        // "WINTER" text - clean white text with smooth colored glow
        ctx.font = `bold ${textSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Smooth colored stroke outline
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 0;
        ctx.strokeText(text, centerX, textY);
        
        // Main white text with smooth colored glow
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 30;
        ctx.shadowColor = textColor;
        ctx.fillText(text, centerX, textY);
        ctx.shadowBlur = 0;
    }
}

// Draw lives
function drawLives(x, y, lives) {
    const img = assets.lives.white;
    if (!img) return;
    
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(img, x + 35 * i, y, 30, 30);
    }
}

// Hide lives (show red crosses)
function hideCrossLives(x, y, livesLost) {
    const img = assets.lives.red;
    if (!img) return;
    
    const startX = WIDTH - 110;
    const positions = [startX, startX + 35, startX + 70];
    for (let i = 0; i < livesLost; i++) {
        if (positions[i]) {
            ctx.drawImage(img, positions[i], y, 30, 30);
        }
    }
}

// Load theme background
function loadThemeBackground(selectedTheme) {
    if (selectedTheme === "Summer") {
        assets.background = assets.summerBg;
    } else if (selectedTheme === "Winter") {
        assets.background = assets.winterBg;
    } else {
        assets.background = assets.summerBg;
    }
}

// Show theme selection screen
function showThemeSelectionScreen() {
    // Use themeSelectionBg if available, otherwise fallback to summerBg
    const bgImage = assets.themeSelectionBg || assets.summerBg || assets.background;
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
    } else {
        // Fallback: draw a black background if no image is loaded
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    
    // Theme buttons with futuristic metallic styling
    const buttonWidth = 220;
    const buttonHeight = 80;
    const buttonRadius = 20;
    const buttonY = HEIGHT / 2; // Position buttons in center
    const summerButtonCenterX = WIDTH / 4;
    const winterButtonCenterX = 3 * WIDTH / 4;
    
    // Store button positions globally for consistent click detection
    themeButtons.summerButton = { 
        x: summerButtonCenterX - buttonWidth / 2, 
        y: buttonY, 
        width: buttonWidth, 
        height: buttonHeight,
        centerX: summerButtonCenterX
    };
    themeButtons.winterButton = { 
        x: winterButtonCenterX - buttonWidth / 2, 
        y: buttonY, 
        width: buttonWidth, 
        height: buttonHeight,
        centerX: winterButtonCenterX
    };
    
    // Draw Summer button - gold metallic with sun icon
    drawThemeButton(
        themeButtons.summerButton,
        "SUMMER",
        summerButtonCenterX,
        true, // isSummer
        buttonRadius
    );
    
    // Draw Winter button - light blue metallic with snowflake icons
    drawThemeButton(
        themeButtons.winterButton,
        "WINTER",
        winterButtonCenterX,
        false, // isSummer
        buttonRadius
    );
    
    return { summerButton: themeButtons.summerButton, winterButton: themeButtons.winterButton };
}

// Display random fact
function displayRandomFact() {
    if (factsDisplayed.length >= fruitFacts.length) {
        factsDisplayed = [];
    }
    
    const availableFacts = fruitFacts.filter(fact => !factsDisplayed.includes(fact));
    if (availableFacts.length === 0) {
        factsDisplayed = [];
        return fruitFacts[Math.floor(Math.random() * fruitFacts.length)];
    }
    
    const fact = availableFacts[Math.floor(Math.random() * availableFacts.length)];
    factsDisplayed.push(fact);
    return fact;
}

// Show game over screen
function showGameOverScreen() {
    ctx.drawImage(assets.background, 0, 0, WIDTH, HEIGHT);
    
    if (!gameOver) {
        drawText("Score : " + score, 35, WIDTH / 2, HEIGHT / 2);
    }
    
    drawText("Press Enter or Click to begin!", 35, WIDTH / 2, HEIGHT * 3 / 4);
}

// Update timer display
function updateTimerDisplay() {
    const remainingTime = Math.max(0, gameDuration - currentTime);
    drawText("Time: " + remainingTime, 27, 10, 50, WHITE, 'left');
}

// Display difficulty level
function displayDifficultyLevel() {
    drawText("Difficulty: " + currentDifficulty, 16, WIDTH - 10, HEIGHT - 10, WHITE, 'right');
}

// Mouse trail for better slicing
let mouseTrail = [];
const MAX_TRAIL_LENGTH = 5;

// Check collision with trail
function checkCollision(x, y, fruit) {
    const size = 60;
    return x > fruit.x && x < fruit.x + size && y > fruit.y && y < fruit.y + size;
}

function checkTrailCollision(fruit) {
    for (let i = 0; i < mouseTrail.length - 1; i++) {
        const p1 = mouseTrail[i];
        const p2 = mouseTrail[i + 1];
        
        // Check if fruit center is near the line segment
        const fruitCenterX = fruit.x + 30;
        const fruitCenterY = fruit.y + 30;
        
        const dist = distanceToLineSegment(fruitCenterX, fruitCenterY, p1.x, p1.y, p2.x, p2.y);
        if (dist < 30) {
            return true;
        }
    }
    return false;
}

function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
        param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Event listeners
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // Add to trail
    if (gameState === 'playing' && mouseDown) {
        mouseTrail.push({ x: mouseX, y: mouseY });
        if (mouseTrail.length > MAX_TRAIL_LENGTH) {
            mouseTrail.shift();
        }
    }
});

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    handleClick(mouseX, mouseY);
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
    mouseTrail = [];
});

canvas.addEventListener('mouseleave', () => {
    mouseDown = false;
    mouseTrail = [];
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
    
    // Add to trail
    if (gameState === 'playing' && mouseDown) {
        mouseTrail.push({ x: mouseX, y: mouseY });
        if (mouseTrail.length > MAX_TRAIL_LENGTH) {
            mouseTrail.shift();
        }
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
    mouseDown = true;
    mouseTrail = [{ x: mouseX, y: mouseY }];
    handleClick(mouseX, mouseY);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    mouseDown = false;
    mouseTrail = [];
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && gameState === 'menu') {
        gameState = 'playing';
        gameOver = false;
        playerLives = 3;
        score = 0;
        fruitSpawnRate = 0.2;
        bombFrequency = 0.1;
        currentDifficulty = "Easy";
        startTime = Date.now();
        currentTime = 0;
        mouseTrail = [];
        initializeFruits();
    }
});

function handleClick(x, y) {
    if (gameState === 'theme') {
        // Use stored button positions for consistent click detection
        const summerButton = themeButtons.summerButton;
        const winterButton = themeButtons.winterButton;
        
        // Check if buttons are initialized
        if (!summerButton || !winterButton) {
            return; // Buttons not ready yet
        }
        
        // Check Summer button click (with padding for better UX)
        const padding = 5;
        if (x >= summerButton.x - padding && x <= summerButton.x + summerButton.width + padding &&
            y >= summerButton.y - padding && y <= summerButton.y + summerButton.height + padding) {
            theme = "Summer";
            loadThemeBackground(theme);
            // Start game immediately after theme selection
            gameState = 'playing';
            gameOver = false;
            playerLives = 3;
            score = 0;
            fruitSpawnRate = 0.2;
            bombFrequency = 0.1;
            currentDifficulty = "Easy";
            startTime = Date.now();
            currentTime = 0;
            mouseTrail = [];
            initializeFruits();
        } 
        // Check Winter button click (with padding for better UX)
        else if (x >= winterButton.x - padding && x <= winterButton.x + winterButton.width + padding &&
                 y >= winterButton.y - padding && y <= winterButton.y + winterButton.height + padding) {
            theme = "Winter";
            loadThemeBackground(theme);
            // Start game immediately after theme selection
            gameState = 'playing';
            gameOver = false;
            playerLives = 3;
            score = 0;
            fruitSpawnRate = 0.2;
            bombFrequency = 0.1;
            currentDifficulty = "Easy";
            startTime = Date.now();
            currentTime = 0;
            mouseTrail = [];
            initializeFruits();
        }
    } else if (gameState === 'menu') {
        gameState = 'playing';
        gameOver = false;
        playerLives = 3;
        score = 0;
        fruitSpawnRate = 0.2;
        bombFrequency = 0.1;
        currentDifficulty = "Easy";
        startTime = Date.now();
        currentTime = 0;
        mouseTrail = [];
        initializeFruits();
    } else if (gameState === 'playing') {
        // Handle fruit slicing - check both point collision and trail collision
        for (const [key, value] of Object.entries(fruitData)) {
            if (value.throw && !value.hit) {
                let hit = false;
                
                // Check point collision
                if (checkCollision(mouseX, mouseY, value)) {
                    hit = true;
                }
                
                // Check trail collision if mouse is down
                if (!hit && mouseDown && mouseTrail.length > 1) {
                    hit = checkTrailCollision(value);
                }
                
                if (hit) {
                    if (key === 'bomb') {
                        playerLives--;
                        
                        if (playerLives === 0) {
                            hideCrossLives(WIDTH - 110, 15, 3);
                            gameState = 'gameover';
                            gameOver = true;
                        } else if (playerLives === 1) {
                            hideCrossLives(WIDTH - 110, 15, 2);
                        } else if (playerLives === 2) {
                            hideCrossLives(WIDTH - 110, 15, 1);
                        }
                        
                        value.img = assets.explosion;
                    } else {
                        value.img = assets.halfFruits[key];
                        score++;
                    }
                    
                    value.speedX += 10;
                    value.hit = true;
                }
            }
        }
    } else if (gameState === 'gameover') {
        gameState = 'menu';
    }
}

// Main game loop
function gameLoop() {
    // Update cybersecurity effects
    glitchTimer += 0.1;
    scanlineOffset = (scanlineOffset + 2) % 6;
    
    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    if (gameState === 'theme') {
        showThemeSelectionScreen();
        
        // Change cursor to pointer when hovering over buttons
        const summerButton = themeButtons.summerButton;
        const winterButton = themeButtons.winterButton;
        if (summerButton && winterButton) {
            const padding = 5;
            const isOverSummer = mouseX >= summerButton.x - padding && mouseX <= summerButton.x + summerButton.width + padding &&
                                mouseY >= summerButton.y - padding && mouseY <= summerButton.y + summerButton.height + padding;
            const isOverWinter = mouseX >= winterButton.x - padding && mouseX <= winterButton.x + winterButton.width + padding &&
                                mouseY >= winterButton.y - padding && mouseY <= winterButton.y + winterButton.height + padding;
            
            if (isOverSummer || isOverWinter) {
                canvas.style.cursor = 'pointer';
            } else {
                canvas.style.cursor = 'default';
            }
        }
        
        // Display fact if active
        if (currentFact && Date.now() - factDisplayTime < factDisplayDuration) {
            factScrollX -= factScrollSpeed;
            ctx.fillStyle = WHITE;
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            const textWidth = ctx.measureText(currentFact).width;
            
            if (factScrollX + textWidth > 0) {
                ctx.fillText(currentFact, factScrollX, HEIGHT / 2 + 50);
            } else {
                currentFact = null;
            }
        }
    } else if (gameState === 'menu') {
        canvas.style.cursor = 'default';
        showGameOverScreen();
    } else if (gameState === 'playing') {
        canvas.style.cursor = 'crosshair';
        // Draw background
        ctx.drawImage(assets.background, 0, 0, WIDTH, HEIGHT);
        
        // Update time
        currentTime = Math.floor((Date.now() - startTime) / 1000);
        
        // Check if time is up
        if (currentTime >= gameDuration) {
            gameState = 'gameover';
            gameOver = true;
        }
        
        // Update timer display
        updateTimerDisplay();
        
        // Draw score
        drawText('Score : ' + score, 42, 0, 20, WHITE, 'left');
        
        // Draw lives
        drawLives(WIDTH - 110, 5, playerLives);
        
        // Calculate player accuracy and adjust difficulty
        const playerAccuracy = (score + 1) / (score + 2);
        
        if (playerAccuracy > 0.8) {
            fruitSpawnRate = 0.03;
            bombFrequency = 0.2;
            if (currentDifficulty !== "Hard") {
                currentDifficulty = "Hard";
            }
        } else if (playerAccuracy < 0.3) {
            fruitSpawnRate = 0.3;
            bombFrequency = 0.02;
            if (currentDifficulty !== "Easy") {
                currentDifficulty = "Easy";
            }
        }
        
        // Update and draw fruits
        for (const [key, value] of Object.entries(fruitData)) {
            if (value.throw) {
                // Apply gravity (slower acceleration, scaled for 60 FPS)
                value.speedY += 0.15; // Gravity acceleration (was 1 * t in Python at 10 FPS)
                value.t += 0.1;
                
                // Update position
                value.x += value.speedX;
                value.y += value.speedY;
                
                // Draw fruit if it's on screen
                if (value.y > -60 && value.y < HEIGHT + 60 && value.x > -60 && value.x < WIDTH + 60) {
                    ctx.drawImage(value.img, value.x, value.y, 60, 60);
                }
                
                // Reset fruit if it goes below the screen or too far off screen
                if (value.y > HEIGHT + 60 || value.x < -100 || value.x > WIDTH + 100) {
                    generateRandomFruit(key);
                }
            } else {
                // Randomly spawn fruits based on spawn rate (adjusted for 60 FPS)
                if (key === 'bomb') {
                    if (Math.random() < bombFrequency / 6) {
                        value.throw = true;
                    }
                } else {
                    if (Math.random() < fruitSpawnRate / 6) {
                        value.throw = true;
                    }
                }
            }
        }
        
        // Draw mouse trail for visual feedback
        if (mouseDown && mouseTrail.length > 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(mouseTrail[0].x, mouseTrail[0].y);
            for (let i = 1; i < mouseTrail.length; i++) {
                ctx.lineTo(mouseTrail[i].x, mouseTrail[i].y);
            }
            ctx.stroke();
        }
        
        // Draw fact if active
        if (currentFact && Date.now() - factDisplayTime < factDisplayDuration) {
            factScrollX -= factScrollSpeed;
            ctx.fillStyle = WHITE;
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            const textWidth = ctx.measureText(currentFact).width;
            
            if (factScrollX + textWidth > 0) {
                ctx.fillText(currentFact, factScrollX, HEIGHT / 2 + 50);
            } else {
                currentFact = null;
            }
        }
    } else if (gameState === 'gameover') {
        canvas.style.cursor = 'default';
        showGameOverScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize game
async function init() {
    const loaded = await loadAssets();
    if (loaded) {
        initializeFruits();
        gameLoop();
    }
}

// Start the game
init();

