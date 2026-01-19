// Game Constants
const WIDTH = 800;
const HEIGHT = 500;
const FPS = 60;
const GAME_DURATION = 60; // seconds

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

// Game assets
const assets = {
    background: null,
    summerBg: null,
    winterBg: null,
    professor: null,
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

// Game state
let gameState = 'loading'; // 'loading', 'theme', 'menu', 'playing', 'gameover'

// Load all images
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function loadAssets() {
    try {
        // Load backgrounds
        assets.summerBg = await loadImage('summer.jpg');
        assets.winterBg = await loadImage('winter.jpg');
        assets.background = assets.summerBg;
        
        // Load professor
        assets.professor = await loadImage('professor.png');
        
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
        x: Math.random() * (500 - 100) + 100,
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
    
    const positions = [690, 725, 760];
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
    ctx.drawImage(assets.background, 0, 0, WIDTH, HEIGHT);
    
    drawText("FRUIT NINJA!", 70, WIDTH / 2, HEIGHT / 5);
    drawText("Select a Theme", 35, WIDTH / 2, HEIGHT / 2 - 45);
    
    // Theme buttons
    const summerButton = { x: WIDTH / 4 - 75, y: HEIGHT / 2 - 27.5, width: 150, height: 55 };
    const winterButton = { x: 3 * WIDTH / 4 - 75, y: HEIGHT / 2 - 27.5, width: 150, height: 55 };
    
    ctx.fillStyle = GREEN;
    ctx.fillRect(summerButton.x, summerButton.y, summerButton.width, summerButton.height);
    
    ctx.fillStyle = BLUE;
    ctx.fillRect(winterButton.x, winterButton.y, winterButton.width, winterButton.height);
    
    drawText("Summer", 20, WIDTH / 4, HEIGHT / 2);
    drawText("Winter", 20, 3 * WIDTH / 4, HEIGHT / 2);
    
    // Draw professor
    const professorX = 20;
    const professorY = HEIGHT / 2 - assets.professor.height / 2;
    ctx.drawImage(assets.professor, professorX, professorY);
    
    const professorRect = {
        x: professorX,
        y: professorY,
        width: assets.professor.width,
        height: assets.professor.height
    };
    
    return { summerButton, winterButton, professorRect };
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
    drawText("FRUIT NINJA!", 70, WIDTH / 2, HEIGHT / 4);
    
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
        const themeScreen = showThemeSelectionScreen();
        const summerButton = themeScreen.summerButton;
        const winterButton = themeScreen.winterButton;
        const professorRect = themeScreen.professorRect;
        
        if (x >= summerButton.x && x <= summerButton.x + summerButton.width &&
            y >= summerButton.y && y <= summerButton.y + summerButton.height) {
            theme = "Summer";
            loadThemeBackground(theme);
            gameState = 'menu';
        } else if (x >= winterButton.x && x <= winterButton.x + winterButton.width &&
                   y >= winterButton.y && y <= winterButton.y + winterButton.height) {
            theme = "Winter";
            loadThemeBackground(theme);
            gameState = 'menu';
        } else if (x >= professorRect.x && x <= professorRect.x + professorRect.width &&
                   y >= professorRect.y && y <= professorRect.y + professorRect.height) {
            currentFact = displayRandomFact();
            factScrollX = WIDTH;
            factDisplayTime = Date.now();
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
                            hideCrossLives(690, 15, 3);
                            gameState = 'gameover';
                            gameOver = true;
                        } else if (playerLives === 1) {
                            hideCrossLives(690, 15, 2);
                        } else if (playerLives === 2) {
                            hideCrossLives(690, 15, 1);
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
    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    if (gameState === 'theme') {
        showThemeSelectionScreen();
        
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
        showGameOverScreen();
    } else if (gameState === 'playing') {
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
        drawLives(690, 5, playerLives);
        
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
        
        // Display difficulty
        displayDifficultyLevel();
        
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

