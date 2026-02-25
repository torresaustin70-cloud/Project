//board
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount*tileSize;
const boardHeight = rowCount*tileSize;
let context;


let blueGhostImage;
let orangeGhostImage;
let pinkGhostImage;
let redGhostImage;
let scaredGhostImage;
let pacmanUpImage;
let pacmanDownImage;
let pacmanLeftImage;
let pacmanRightImage;
let wallImage;
let pacmanLogoImage;
let menuBackgroundImage;

// fruit images
let appleImage;
let strawberryImage;
let orangeFruitImage;
let cherryImage;
let melonImage;

//X = wall, O = skip, P = pac man, ' ' = food ?=powerpill 
//Ghosts: b = blue, o = orange, p = pink, r = red 5 = tunnel wrap
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X?       X       ?X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X   X   X    X",
    "XXXX XXX X XXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "5      XbpoX      5",
    "XXXX X XXXXX X XXXX",
    "OOOX X   P   X XOOO",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X           X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X?               ?X",
    "XXXXXXXXXXXXXXXXXXX" 
];

const walls = new Set();
const foods = new Set();
const powerPellets = new Set();
const fruits = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R']; //up down left right
let score = 0;
let lives = 3;
let floatingScores = []; // for displaying score popups when eating ghosts
let lastGhostEatTime = 0; // timestamp of last ghost eaten
let ghostComboMultiplier = 1; // multiplier for consecutive ghost eats
let gameOver = false;
let powerMode = false;
let powerModeTimer = 0; // ticks (50ms per tick)
let paused = true;
let running = false;
let audioCtx = null;

// track whether the main update loop is already running
let gameLoopActive = false;
// next score threshold to award an extra life
let nextExtraLifeScore = 10000;

// menu state
let showStartMenu = true;

// button rectangles for in-game UI
const startButtonRect = { x: 10, y: 10, w: 80, h: 30 };
const pauseButtonRect = { x: 100, y: 10, w: 80, h: 30 };
const scoreboardButtonRect = { x: 190, y: 10, w: 100, h: 30 };

// menu button rectangles
const playButtonRect = { x: 0, y: 0, w: 0, h: 0 };
const scoreboardMenuButtonRect = { x: 0, y: 0, w: 0, h: 0 };
const instructionsButtonRect = { x: 0, y: 0, w: 0, h: 0 };

let showScoreboard = false;
let showNameInput = false;
let playerName = '';
let submitButtonRect = { x: 0, y: 0, w: 0, h: 0 };
let scoreboardOpenedFromMenu = false;
const fruitSpawnInterval = 300; // spawn fruit every ~15 seconds (300 * 50ms)

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board
    loadImages();
    
    // Wait for images to load before initializing the map
    setTimeout(function() {
        loadMap();
        document.addEventListener("keyup", movePacman);
        document.addEventListener("keydown", handleNameInput);
        board.addEventListener('click', handleCanvasClick);
        update(); // start the game loop
    }, 500);
}

function loadImages() {
    wallImage = new Image();
    wallImage.src = "./wall.png";

    blueGhostImage = new Image();
    blueGhostImage.src = "./blueGhost.png";
    orangeGhostImage = new Image();
    orangeGhostImage.src = "./orangeGhost.png"
    pinkGhostImage = new Image()
    pinkGhostImage.src = "./pinkGhost.png";
    redGhostImage = new Image()
    redGhostImage.src = "./redGhost.png";
    scaredGhostImage = new Image();
    scaredGhostImage.src = "./scaredGhost.png";

    pacmanUpImage = new Image();
    pacmanUpImage.src = "./pacmanUp.png";
    pacmanDownImage = new Image();
    pacmanDownImage.src = "./pacmanDown.png";
    pacmanLeftImage = new Image();
    pacmanLeftImage.src = "./pacmanLeft.png";
    pacmanRightImage = new Image();
    pacmanRightImage.src = "./pacmanRight.png";

    // load pacman logo for menu
    pacmanLogoImage = new Image();
    pacmanLogoImage.src = "./pacmanRight.png";

    // load menu background image
    menuBackgroundImage = new Image();
    menuBackgroundImage.src = "./pacmanRight.png";

    // load fruit images
    appleImage = new Image();
    appleImage.src = "./apple.png";
    strawberryImage = new Image();
    strawberryImage.src = "./strawberry.png";
    orangeFruitImage = new Image();
    orangeFruitImage.src = "./orange.png";
    cherryImage = new Image();
    cherryImage.src = "./cherry.png";
    melonImage = new Image();
    melonImage.src = "./melon.png";
}

function loadMap() {
    walls.clear();
    foods.clear();
    powerPellets.clear();
    fruits.clear();
    ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];

            const x = c*tileSize;
            const y = r*tileSize;

            if (tileMapChar == 'X') { //block wall
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);  
            }
            else if (tileMapChar == 'b') { //blue ghost
                const ghost = new Block(blueGhostImage, x, y, tileSize, tileSize);
                ghost.baseImage = blueGhostImage;
                ghost.lastX = x;
                ghost.lastY = y;
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'o') { //orange ghost
                const ghost = new Block(orangeGhostImage, x, y, tileSize, tileSize);
                ghost.baseImage = orangeGhostImage;
                ghost.lastX = x;
                ghost.lastY = y;
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'p') { //pink ghost
                const ghost = new Block(pinkGhostImage, x, y, tileSize, tileSize);
                ghost.baseImage = pinkGhostImage;
                ghost.lastX = x;
                ghost.lastY = y;
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'r') { //red ghost
                const ghost = new Block(redGhostImage, x, y, tileSize, tileSize);
                ghost.baseImage = redGhostImage;
                ghost.lastX = x;
                ghost.lastY = y;
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'P') { //pacman
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            }
            else if (tileMapChar == ' ') { //empty is food
                const food = new Block(null, x + 14, y + 14, 4, 4);
                foods.add(food);
            }
            else if (tileMapChar == '?') { //power pellet
                const pellet = new Block(null, x + 12, y + 12, 8, 8);
                powerPellets.add(pellet);
            }
        }
    }
}

function update() {
    // mark loop active on first call
    gameLoopActive = true;
    if (gameOver) {
        running = false;
        updateDisplays();
        checkHighscore();
        // still continue the loop to show name input and scoreboard
        draw();
        setTimeout(update, 50);
        return;
    }

    if (!paused) move();
    draw();
    setTimeout(update, 50); //1000/50 = 20 FPS
}

function updateDisplays() {
    const scoreDisp = document.getElementById('scoreDisp');
    const livesDisp = document.getElementById('livesDisp');
    const highDisp = document.getElementById('highDisp');
    if (scoreDisp) scoreDisp.textContent = String(score);
    if (livesDisp) livesDisp.textContent = String(lives);
    if (highDisp) highDisp.textContent = String(localStorage.getItem('pacman_highscore') || 0);
}

function checkExtraLife() {
    // Award one extra life for each 10,000 points crossed
    while (score >= nextExtraLifeScore) {
        lives += 1;
        playBeep(1800, 0.12, 'sine', 0.08);
        nextExtraLifeScore += 10000;
        updateDisplays();
    }
}

function checkHighscore() {
    const key = 'pacman_highscore';
    const prev = Number(localStorage.getItem(key) || 0);
    if (score > prev) {
        localStorage.setItem(key, String(score));
    }
    // show name input screen instead of immediately saving
    // only set up the prompt once so we don't clear typed input every frame
    if (!showNameInput) {
        showNameInput = true;
        playerName = '';
        updateDisplays();
    }
}

function submitScore(name) {
    // add score with player name
    addScoreToList(name || 'Anonymous', score);
    // hide name input and return to the main menu
    showNameInput = false;
    playerName = '';
    showStartMenu = true;
    showScoreboard = false;
    gameOver = false;
    paused = true;
    running = false;
    updateDisplays();
    // reset the map so menu shows fresh tiles next time
    loadMap();
    resetPositions();
}

function addScoreToList(playerName, newScore) {
    const key = 'pacman_scores';
    const scoresStr = localStorage.getItem(key) || '[]';
    let scores = JSON.parse(scoresStr);
    
    // add new score entry with name
    const entry = { name: String(playerName || 'Anonymous'), score: Number(newScore) || 0 };
    scores.push(entry);

    // sort robustly in descending order by numeric score (handle legacy formats)
    scores.sort((a, b) => {
        const sa = (typeof a === 'object' && a !== null) ? Number(a.score) || 0 : Number(a) || 0;
        const sb = (typeof b === 'object' && b !== null) ? Number(b.score) || 0 : Number(b) || 0;
        return sb - sa;
    });

    scores = scores.slice(0, 10);

    localStorage.setItem(key, JSON.stringify(scores));
}

function getScoresList() {
    const key = 'pacman_scores';
    const scoresStr = localStorage.getItem(key) || '[]';
    return JSON.parse(scoresStr);
}

function ensureAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        audioCtx = null;
    }
}

function playBeep(freq, duration, type = 'sine', volume = 0.05) {
    ensureAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = volume;
    o.connect(g);
    g.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(volume, now + 0.01);
    o.start(now);
    g.gain.linearRampToValueAtTime(0.0001, now + duration);
    o.stop(now + duration + 0.02);
}

function startGame() {
    // must be user gesture to enable audio
    ensureAudio();
    // always reload the map when starting a new game to ensure tiles reset
    loadMap();
    // reset extra-life threshold for new game
    nextExtraLifeScore = 10000;
    // reset ghost combo multiplier for new game
    ghostComboMultiplier = 1;
    lastGhostEatTime = 0;
    
    paused = false;
    running = true;
    gameOver = false;
    showNameInput = false;
    showScoreboard = false;
    lives = 3;
    score = 0;
    fruitSpawnTimer = 0;
    powerMode = false;
    powerModeTimer = 0;
    
    resetPositions();
    
    for (let ghost of ghosts.values()) {
        const newDirection = directions[Math.floor(Math.random()*4)];
        ghost.updateDirection(newDirection);
    }
    
    playBeep(600, 0.06, 'sine', 0.06);
    // only start the update loop if it isn't already running
    if (!gameLoopActive) update();
}

function pauseGame(shouldPause) {
    paused = shouldPause;
    playBeep(paused ? 300 : 800, 0.06, 'sine', 0.05);
}

function draw() {
    context.fillStyle = '#000000';
    context.fillRect(0, 0, board.width, board.height);
    context.clearRect(0, 0, board.width, board.height);
    
    // draw start menu if showing
    if (showStartMenu) {
        drawStartMenu();
        return;
    }
    
    // safety check for pacman
    if (pacman && pacman.image) {
        context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    }
    
    for (let ghost of ghosts.values()) {
        if (ghost && ghost.image) {
            context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
        }
    }
    
    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }

    context.fillStyle = "white";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    // power pellets
    context.fillStyle = "yellow";
    for (let pellet of powerPellets.values()) {
        context.fillRect(pellet.x, pellet.y, pellet.width, pellet.height);
    }

    // fruits
    for (let fruit of fruits.values()) {
        drawFruit(fruit);
    }

    // draw floating scores
    context.fillStyle = "white";
    context.font = "bold 20px sans-serif";
    for (let scorePopup of floatingScores) {
        const fadeAlpha = scorePopup.timer / scorePopup.maxTimer;
        context.globalAlpha = fadeAlpha;
        const yOffset = (scorePopup.maxTimer - scorePopup.timer) * 0.8; // float upward
        context.fillText("+" + scorePopup.score, scorePopup.x - 5, scorePopup.y - 20 - yOffset);
    }
    context.globalAlpha = 1;

    // draw in-game UI buttons and info
    drawUIButtons();

    //score and lives
    context.fillStyle = "white";
    context.font="14px sans-serif";
    if (gameOver) {
        context.fillText("Game Over: " + String(score), tileSize/2, boardHeight - 30);
        const highscore = localStorage.getItem('pacman_highscore') || 0;
        context.fillText("Highscore: " + String(highscore), tileSize/2, boardHeight - 10);
    }
    else {
        context.fillText("Lives: " + String(lives) + " | Score: " + String(score), tileSize/2, boardHeight - 10);
        const highscore = localStorage.getItem('pacman_highscore') || 0;
        context.fillText("Highscore: " + String(highscore), boardWidth - 200, boardHeight - 10);
    }

    // draw scoreboard overlay if requested
    if (showScoreboard) {
        drawScoreboard();
    }

    // draw name input if game just ended
    if (showNameInput) {
        drawNameInput();
    }
}

function drawStartMenu() {
    // background with gradient overlay
    const gradient = context.createLinearGradient(0, 0, 0, boardHeight);
    gradient.addColorStop(0, 'rgba(26, 0, 51, 0.7)');
    gradient.addColorStop(1, 'rgba(51, 0, 102, 0.7)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, boardWidth, boardHeight);

    // draw background image if loaded
    if (menuBackgroundImage && menuBackgroundImage.complete) {
        try {
            context.drawImage(menuBackgroundImage, boardWidth / 2 - 100, boardHeight / 2 - 100, 200, 200);
        } catch(e) {
            console.log("Background image error:", e);
        }
    }

    // draw logo if loaded (optional, can be removed if using full background)
    if (pacmanLogoImage && pacmanLogoImage.complete) {
        try {
            const logoSize = 80;
            const logoX = (boardWidth - logoSize) / 2;
            context.drawImage(pacmanLogoImage, logoX, 15, logoSize, logoSize);
        } catch(e) {
            console.log("Logo load error:", e);
        }
    }

    // title
    context.fillStyle = '#ffff00';
    context.font = 'bold 48px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText('PAC-MAN', boardWidth / 2, 120);

    // subtitle
    context.fillStyle = '#00ffff';
    context.font = 'bold 18px Arial, sans-serif';
    context.fillText('Press Start to Play', boardWidth / 2, 170);

    // play button
    playButtonRect.x = (boardWidth - 180) / 2;
    playButtonRect.y = 210;
    playButtonRect.w = 180;
    playButtonRect.h = 45;
    
    context.fillStyle = '#00ff00';
    context.fillRect(playButtonRect.x, playButtonRect.y, playButtonRect.w, playButtonRect.h);
    context.fillStyle = '#000';
    context.font = 'bold 18px Arial, sans-serif';
    context.textBaseline = 'middle';
    context.fillText('PLAY GAME', boardWidth / 2, playButtonRect.y + 22);

    // scoreboard button
    scoreboardMenuButtonRect.x = (boardWidth - 180) / 2;
    scoreboardMenuButtonRect.y = 265;
    scoreboardMenuButtonRect.w = 180;
    scoreboardMenuButtonRect.h = 45;
    
    context.fillStyle = '#ff8800';
    context.fillRect(scoreboardMenuButtonRect.x, scoreboardMenuButtonRect.y, scoreboardMenuButtonRect.w, scoreboardMenuButtonRect.h);
    context.fillStyle = '#000';
    context.fillText('SCOREBOARD', boardWidth / 2, scoreboardMenuButtonRect.y + 22);

    // instructions button
    instructionsButtonRect.x = (boardWidth - 180) / 2;
    instructionsButtonRect.y = 320;
    instructionsButtonRect.w = 180;
    instructionsButtonRect.h = 45;
    
    context.fillStyle = '#ff00ff';
    context.fillRect(instructionsButtonRect.x, instructionsButtonRect.y, instructionsButtonRect.w, instructionsButtonRect.h);
    context.fillStyle = '#fff';
    context.fillText('INSTRUCTIONS', boardWidth / 2, instructionsButtonRect.y + 22);

    // instructions text
    context.fillStyle = '#aaffff';
    context.font = '13px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    const instructions = [
        'Use Arrow Keys or WASD to move',
        'Eat all pellets and avoid ghosts',
        'Eat power pellets to scare ghosts',
        'Complete the level to win!'
    ];
    let yPos = 395;
    for (let line of instructions) {
        context.fillText(line, boardWidth / 2, yPos);
        yPos += 20;
    }

    context.textAlign = 'left';
}

function drawUIButtons() {
    const startRect = startButtonRect;
    const pauseRect = pauseButtonRect;
    const scoreRect = scoreboardButtonRect;

    // start button
    context.fillStyle = running ? '#666' : '#0f0';
    context.fillRect(startRect.x, startRect.y, startRect.w, startRect.h);
    context.fillStyle = '#000';
    context.font = 'bold 12px sans-serif';
    context.textAlign = 'center';
    context.fillText('START', startRect.x + startRect.w / 2, startRect.y + startRect.h / 2 + 4);

    // pause button
    context.fillStyle = running ? '#00f' : '#666';
    context.fillRect(pauseRect.x, pauseRect.y, pauseRect.w, pauseRect.h);
    context.fillStyle = '#fff';
    const pauseLabel = paused ? 'RESUME' : 'PAUSE';
    context.fillText(pauseLabel, pauseRect.x + pauseRect.w / 2, pauseRect.y + pauseRect.h / 2 + 4);

    // scoreboard button
    context.fillStyle = '#ff8800';
    context.fillRect(scoreRect.x, scoreRect.y, scoreRect.w, scoreRect.h);
    context.fillStyle = '#000';
    context.fillText('SCOREBOARD', scoreRect.x + scoreRect.w / 2, scoreRect.y + scoreRect.h / 2 + 4);

    context.textAlign = 'left';
}


function move() {
    // safety check
    if (!pacman) return;
    
    // update floating scores (decay over time)
    floatingScores.forEach(scorePopup => scorePopup.timer--);
    floatingScores = floatingScores.filter(scorePopup => scorePopup.timer > 0);
    
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    //check wall collisions
    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    // wrap pacman if on a tunnel
    wrapEntityIfNeeded(pacman);

    //check power-pellet collision
    let pelletEaten = null;
    for (let pellet of powerPellets.values()) {
        if (collision(pacman, pellet)) {
            pelletEaten = pellet;
            score += 50;
            powerMode = true;
            powerModeTimer = 100; // ~5 seconds (100 * 50ms)
            for (let g of ghosts.values()) {
                g.image = scaredGhostImage; // scared look
            }
            playBeep(1200, 0.08, 'sine', 0.06);
            break;
        }
    }
    powerPellets.delete(pelletEaten);
    // check for extra life after scoring
    checkExtraLife();

    //check ghosts collision and movement
    for (let ghost of ghosts.values()) {
        if (collision(ghost, pacman)) {
            if (powerMode) {
                // check if within 15 seconds (15000ms) of last ghost eaten
                const now = Date.now();
                if (now - lastGhostEatTime > 15000) {
                    ghostComboMultiplier = 1; // reset combo
                } else {
                    ghostComboMultiplier *= 2; // double combo for consecutive eat
                }
                lastGhostEatTime = now;
                
                const earnedPoints = 200 * ghostComboMultiplier;
                score += earnedPoints;
                // add floating score display at ghost position
                floatingScores.push({ x: ghost.x, y: ghost.y, score: earnedPoints, timer: 60, maxTimer: 60 });
                ghost.reset();
                const newDirection = directions[Math.floor(Math.random()*4)];
                ghost.updateDirection(newDirection);
                playBeep(1500, 0.12, 'sawtooth', 0.06);
                // extra life check for large point gain
                checkExtraLife();
                continue;
            }
            else {
                lives -= 1;
                playBeep(120, 0.28, 'sine', 0.08);
                if (lives == 0) {
                    gameOver = true;
                    return;
                }
                resetPositions();
                continue;
            }
        }

        if (ghost.y == tileSize*9 && ghost.direction != 'U' && ghost.direction != 'D') {
            ghost.updateDirection('U');
        }

        // scared ghosts run away from pacman at normal speed
        if (powerMode) {
            const fleeDir = getFleeDirection(ghost, pacman);
            const opposite = { 'U':'D', 'D':'U', 'L':'R', 'R':'L' };
            const perps = (fleeDir === 'U' || fleeDir === 'D') ? ['L','R'] : ['U','D'];
            const candidates = [fleeDir, perps[0], perps[1], opposite[fleeDir]];

            let chosen = null;
            // check candidates in order (prefer flee direction)
            for (let d of candidates) {
                if (canMoveInDirection(ghost, d)) {
                    chosen = d;
                    break;
                }
            }

            // if stuck, shuffle all directions and try to find any escape
            if (!chosen) {
                const shuffled = [...directions].sort(() => Math.random() - 0.5);
                for (let d of shuffled) {
                    if (canMoveInDirection(ghost, d)) {
                        chosen = d;
                        break;
                    }
                }
            }

            // if we found a valid direction, use it; otherwise keep current direction
            if (chosen) {
                ghost.direction = chosen;
                ghost.updateVelocity();
            }
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        
        // detect if scared ghost is stuck (didn't move) and force escape
        if (powerMode && ghost.x === ghost.lastX && ghost.y === ghost.lastY) {
            const shuffled = [...directions].sort(() => Math.random() - 0.5);
            for (let d of shuffled) {
                if (canMoveInDirection(ghost, d)) {
                    ghost.direction = d;
                    ghost.updateVelocity();
                    ghost.x += ghost.velocityX;
                    ghost.y += ghost.velocityY;
                    break;
                }
            }
        }
        
        // update last position for next frame's stuck detection
        ghost.lastX = ghost.x;
        ghost.lastY = ghost.y;
        
        let bumped = false;
        for (let wall of walls.values()) {
            if (collision(ghost, wall)) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                const newDirection = directions[Math.floor(Math.random()*4)];
                ghost.updateDirection(newDirection);
                bumped = true;
                break;
            }
        }
        if (bumped) continue;

        // allow tunnel wrapping if the ghost is on a tunnel tile
        if (wrapEntityIfNeeded(ghost)) {
            continue;
        }

        // otherwise if it hits the horizontal bounds, bounce
        if (ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
            ghost.x -= ghost.velocityX;
            ghost.y -= ghost.velocityY;
            const newDirection = directions[Math.floor(Math.random()*4)];
            ghost.updateDirection(newDirection);
        }
    }

    //check food collision
    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    foods.delete(foodEaten);
    if (foodEaten) playBeep(900, 0.03, 'triangle', 0.03);
    checkExtraLife();

    //check fruit collision
    let fruitEaten = null;
    for (let fruit of fruits.values()) {
        if (collision(pacman, fruit)) {
            fruitEaten = fruit;
            score += 100;
            playBeep(1100, 0.1, 'sine', 0.07);
            break;
        }
    }
    fruits.delete(fruitEaten);
    checkExtraLife();

    //power mode timer
    if (powerMode) {
        powerModeTimer -= 1;
        if (powerModeTimer <= 0) {
            powerMode = false;
            for (let g of ghosts.values()) {
                if (g.baseImage) g.image = g.baseImage;
            }
        }
    }

    //spawn random fruits
    fruitSpawnTimer++;
    if (fruitSpawnTimer >= fruitSpawnInterval && fruits.size < 2) {
        spawnRandomFruit();
        fruitSpawnTimer = 0;
    }

    //next level
    if (foods.size == 0) {
        loadMap();
        resetPositions();
    }
}

function handleNameInput(e) {
    if (!showNameInput) return;

    // handle backspace
    if (e.code === 'Backspace') {
        playerName = playerName.slice(0, -1);
        return;
    }

    // handle enter to submit
    if (e.code === 'Enter') {
        submitScore(playerName);
        return;
    }

    // only allow alphanumeric and space (max 12 characters)
    if (playerName.length >= 12) return;
    if (/^[a-zA-Z0-9\s]$/.test(e.key)) {
        playerName += e.key;
    }
}

function movePacman(e) {
    // don't process game controls if showing name input, scoreboard, or game over
    if (showNameInput || showScoreboard || gameOver) {
        return;
    }

    if (e.code == "ArrowUp" || e.code == "KeyW") {
        pacman.updateDirection('U');
    }
    else if (e.code == "ArrowDown" || e.code == "KeyS") {
        pacman.updateDirection('D');
    }
    else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        pacman.updateDirection('L');
    }
    else if (e.code == "ArrowRight" || e.code == "KeyD") {
        pacman.updateDirection('R');
    }

    //update pacman images
    if (pacman.direction == 'U') {
        pacman.image = pacmanUpImage;
    }
    else if (pacman.direction == 'D') {
        pacman.image = pacmanDownImage;
    }
    else if (pacman.direction == 'L') {
        pacman.image = pacmanLeftImage;
    }
    else if (pacman.direction == 'R') {
        pacman.image = pacmanRightImage;
    }
    
}

function collision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function getTileCharAt(x, y) {
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    if (row < 0 || row >= rowCount || col < 0 || col >= columnCount) return null;
    return tileMap[row][col];
}

function isOnTunnel(entity) {
    const cx = entity.x + entity.width/2;
    const cy = entity.y + entity.height/2;
    const tile = getTileCharAt(cx, cy);
    return tile === 'O' || tile === '5'; // both O and 5 are tunnel tiles
}

function wrapEntityIfNeeded(entity) {
    // check if on tunnel row (row 9 in the map)
    const cy = entity.y + entity.height/2;
    const row = Math.floor(cy / tileSize);
    const isOnTunnelRow = row === 9 || row === 10; // tunnel is around row 9
    
    if (!isOnTunnelRow) return false;
    
    // wrap left side to right
    if (entity.x < 0) {
        entity.x = boardWidth - entity.width;
        return true;
    }
    
    // wrap right side to left
    if (entity.x + entity.width > boardWidth) {
        entity.x = 0;
        return true;
    }
    
    return false;
}

function getFleeDirection(ghost, pacman) {
    // calculate difference between ghost and pacman
    const dx = ghost.x - pacman.x;
    const dy = ghost.y - pacman.y;
    
    // move away from pacman (opposite direction)
    if (Math.abs(dx) > Math.abs(dy)) {
        // horizontal distance is greater
        return dx > 0 ? 'R' : 'L'; // move right if further left, left if further right
    } else {
        // vertical distance is greater
        return dy > 0 ? 'D' : 'U'; // move down if further up, up if further down
    }
}

function canMoveInDirection(entity, dir) {
    // check 2-3 steps ahead to better detect corner traps
    let vx = 0, vy = 0;
    if (dir == 'U') vy = -tileSize/2;  // check 2 steps instead of 1
    else if (dir == 'D') vy = tileSize/2;
    else if (dir == 'L') vx = -tileSize/2;
    else if (dir == 'R') vx = tileSize/2;

    const newX = entity.x + vx;
    const newY = entity.y + vy;
    const testRect = { x: newX, y: newY, width: entity.width, height: entity.height };

    // check for wall collisions
    for (let wall of walls.values()) {
        if (testRect.x < wall.x + wall.width &&
            testRect.x + testRect.width > wall.x &&
            testRect.y < wall.y + wall.height &&
            testRect.y + testRect.height > wall.y) {
            return false;
        }
    }

    // also ensure not moving out of horizontal bounds unless on tunnel row
    const cy = testRect.y + testRect.height/2;
    const row = Math.floor(cy / tileSize);
    const isOnTunnelRow = row === 9 || row === 10;
    if (!isOnTunnelRow) {
        if (testRect.x < 0 || testRect.x + testRect.width > boardWidth) return false;
    }

    return true;
}

function drawScoreboard() {
    // dark overlay
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, boardWidth, boardHeight);

    // scoreboard panel
    const panelWidth = 350;
    const panelHeight = 450;
    const panelX = (boardWidth - panelWidth) / 2;
    const panelY = (boardHeight - panelHeight) / 2;

    context.fillStyle = '#222';
    context.fillRect(panelX, panelY, panelWidth, panelHeight);
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // title
    context.fillStyle = '#fff';
    context.font = 'bold 24px sans-serif';
    context.textAlign = 'center';
    context.fillText('TOP SCORES', boardWidth / 2, panelY + 35);

    // get scores list and sort by highest to lowest (robust to legacy formats)
    const scoresList = (getScoresList() || []).slice().sort((a, b) => {
        const sa = (typeof a === 'object' && a !== null) ? Number(a.score) || 0 : Number(a) || 0;
        const sb = (typeof b === 'object' && b !== null) ? Number(b.score) || 0 : Number(b) || 0;
        return sb - sa;
    });
    
    // draw scores
    context.font = 'bold 14px sans-serif';
    context.fillStyle = '#ffff00';
    context.textAlign = 'left';
    let yPos = panelY + 70;
    
    if (scoresList.length === 0) {
        context.fillStyle = '#fff';
        context.textAlign = 'center';
        context.fillText('No scores yet', boardWidth / 2, yPos);
    } else {
        for (let i = 0; i < scoresList.length; i++) {
            const rank = i + 1;
            const entry = scoresList[i];
            
            // handle both old format (just number) and new format (object with name and score)
            const playerName = typeof entry === 'object' ? entry.name : 'Unknown';
            const scoreValue = typeof entry === 'object' ? entry.score : entry;
            
            // rank
            context.fillStyle = '#ffff00';
            context.font = 'bold 14px sans-serif';
            context.fillText(rank + '.', panelX + 15, yPos);
            
            // player name
            context.fillStyle = '#fff';
            context.fillText(playerName, panelX + 40, yPos);
            
            // score
            context.fillStyle = '#00ff00';
            context.textAlign = 'right';
            context.fillText(String(scoreValue), panelX + panelWidth - 20, yPos);
            context.textAlign = 'left';
            
            yPos += 30;
        }
    }

    // close instruction
    context.font = '12px sans-serif';
    context.fillStyle = '#888';
    context.textAlign = 'center';
    context.fillText(scoreboardOpenedFromMenu ? 'Click to return to menu' : 'Click to close', boardWidth / 2, panelY + panelHeight - 15);

    context.textAlign = 'left';
}

function drawNameInput() {
    // dark overlay
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, boardWidth, boardHeight);

    // input panel
    const panelWidth = 350;
    const panelHeight = 250;
    const panelX = (boardWidth - panelWidth) / 2;
    const panelY = (boardHeight - panelHeight) / 2;

    context.fillStyle = '#222';
    context.fillRect(panelX, panelY, panelWidth, panelHeight);
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // title
    context.fillStyle = '#fff';
    context.font = 'bold 20px sans-serif';
    context.textAlign = 'center';
    context.fillText('GAME OVER!', boardWidth / 2, panelY + 35);

    // score display
    context.font = 'bold 16px sans-serif';
    context.fillStyle = '#ffff00';
    context.fillText('Your Score: ' + String(score), boardWidth / 2, panelY + 70);

    // name input label
    context.font = 'bold 14px sans-serif';
    context.fillStyle = '#fff';
    context.fillText('Enter your name:', boardWidth / 2, panelY + 105);

    // name input field
    const inputX = panelX + 30;
    const inputY = panelY + 125;
    const inputWidth = panelWidth - 60;
    const inputHeight = 35;
    
    context.fillStyle = '#fff';
    context.fillRect(inputX, inputY, inputWidth, inputHeight);
    context.fillStyle = '#000';
    context.font = '16px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    // center horizontally and nudge slightly up vertically inside the input box
    context.fillText(playerName + '_', inputX + inputWidth / 2, inputY + inputHeight / 2 - 3);

    // submit button
    const submitX = panelX + 30;
    const submitY = panelY + 175;
    const submitWidth = panelWidth - 60;
    const submitHeight = 35;
    submitButtonRect = { x: submitX, y: submitY, w: submitWidth, h: submitHeight };
    
    context.fillStyle = '#00ff00';
    context.fillRect(submitX, submitY, submitWidth, submitHeight);
    context.fillStyle = '#000';
    context.font = 'bold 16px sans-serif';
    context.textAlign = 'center';
    context.fillText('SUBMIT', submitX + submitWidth / 2, submitY + 24);

    context.textAlign = 'left';
    context.textBaseline = 'top';
}

function handleCanvasClick(e) {
    const rect = board.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // if start menu is showing, check menu buttons
    if (showStartMenu) {
        // check play button
        if (x >= playButtonRect.x && x <= playButtonRect.x + playButtonRect.w &&
            y >= playButtonRect.y && y <= playButtonRect.y + playButtonRect.h) {
            showStartMenu = false;
            startGame();
            return;
        }

        // check scoreboard button
        if (x >= scoreboardMenuButtonRect.x && x <= scoreboardMenuButtonRect.x + scoreboardMenuButtonRect.w &&
            y >= scoreboardMenuButtonRect.y && y <= scoreboardMenuButtonRect.y + scoreboardMenuButtonRect.h) {
            showScoreboard = true;
            scoreboardOpenedFromMenu = true;
            showStartMenu = false;
            return;
        }

        // check instructions button (just visual on menu)
        return;
    }

    // if name input is showing, check submit button
    if (showNameInput) {
        if (x >= submitButtonRect.x && x <= submitButtonRect.x + submitButtonRect.w &&
            y >= submitButtonRect.y && y <= submitButtonRect.y + submitButtonRect.h) {
            submitScore(playerName);
        }
        return;
    }

    // if scoreboard is showing, close it and return to menu if it was opened from menu
    if (showScoreboard) {
        showScoreboard = false;
        if (scoreboardOpenedFromMenu) {
            showStartMenu = true;
            scoreboardOpenedFromMenu = false;
        }
        return;
    }

    // check start button
    if (x >= startButtonRect.x && x <= startButtonRect.x + startButtonRect.w &&
        y >= startButtonRect.y && y <= startButtonRect.y + startButtonRect.h) {
        if (!running) {
            startGame();
        }
        return;
    }

    // check pause button
    if (x >= pauseButtonRect.x && x <= pauseButtonRect.x + pauseButtonRect.w &&
        y >= pauseButtonRect.y && y <= pauseButtonRect.y + pauseButtonRect.h) {
        if (running) {
            pauseGame(!paused);
        }
        return;
    }

    // check scoreboard button
    if (x >= scoreboardButtonRect.x && x <= scoreboardButtonRect.x + scoreboardButtonRect.w &&
        y >= scoreboardButtonRect.y && y <= scoreboardButtonRect.y + scoreboardButtonRect.h) {
        showScoreboard = true;
        scoreboardOpenedFromMenu = false;
        return;
    }
}

function spawnRandomFruit() {
    // pick a random empty location
    let fruitX, fruitY;
    let isValid = false;
    let attempts = 0;
    
    while (!isValid && attempts < 50) {
        fruitX = Math.random() * boardWidth;
        fruitY = Math.random() * (boardHeight - 40); // avoid UI area
        
        // check if position overlaps with walls or skip tiles
        const testBlock = new Block(null, fruitX, fruitY, 16, 16);
        isValid = true;
        
        // check walls
        for (let wall of walls.values()) {
            if (collision(testBlock, wall)) {
                isValid = false;
                break;
            }
        }
        
        // check skip tiles (O) - convert position to tile coordinates
        if (isValid) {
            const tileX = Math.floor(fruitX / tileSize);
            const tileY = Math.floor(fruitY / tileSize);
            if (tileY >= 0 && tileY < rowCount && tileX >= 0 && tileX < columnCount) {
                if (tileMap[tileY][tileX] === 'O') {
                    isValid = false;
                }
            }
        }
        
        attempts++;
    }
    
    if (!isValid) return; // give up if can't find spot
    
    const fruitImages = [appleImage, strawberryImage, orangeFruitImage, cherryImage, melonImage];
    const fruit = new Block(null, fruitX, fruitY, 16, 16);
    fruit.type = Math.floor(Math.random() * fruitImages.length);
    fruit.image = fruitImages[fruit.type];
    fruits.add(fruit);
}

function drawFruit(fruit) {
    if (fruit.image && fruit.image.complete) {
        try {
            context.drawImage(fruit.image, fruit.x, fruit.y, fruit.width, fruit.height);
        } catch (e) {
            // fallback if image fails to load
            context.fillStyle = '#ff6600';
            context.fillRect(fruit.x, fruit.y, fruit.width, fruit.height);
        }
    } else {
        // fallback circle if image not loaded
        context.fillStyle = '#ff6600';
        context.fillRect(fruit.x, fruit.y, fruit.width, fruit.height);
    }
}


function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    for (let ghost of ghosts.values()) {
        ghost.reset();
        const newDirection = directions[Math.floor(Math.random()*4)];
        ghost.updateDirection(newDirection);
    }
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.startX = x;
        this.startY = y;

        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        for (let wall of walls.values()) {
            if (collision(this, wall)) {
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity() {
        if (this.direction == 'U') {
            this.velocityX = 0;
            this.velocityY = -tileSize/4;
        }
        else if (this.direction == 'D') {
            this.velocityX = 0;
            this.velocityY = tileSize/4;
        }
        else if (this.direction == 'L') {
            this.velocityX = -tileSize/4;
            this.velocityY = 0;
        }
        else if (this.direction == 'R') {
            this.velocityX = tileSize/4;
            this.velocityY = 0;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }
};
