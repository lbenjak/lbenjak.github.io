const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const borderWidth = 4;

class Asteroid {
  constructor(x, y, width, height, velocityX, velocityY) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.isOnScreen = false;

    let grayValue = Math.floor(Math.random() * 60) + 180;
    this.color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
  }

  draw(ctx) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Check if the asteroid has entered the screen for the first time
    if (!this.isOnScreen) {
      if (this.x >= 0 && this.x + this.width <= canvas.width &&
        this.y >= 0 && this.y + this.height <= canvas.height) {
        this.isOnScreen = true;
      }
    }

    // Bounce off the edges if the asteroid is on screen
    if (this.isOnScreen) {
      if (this.x <= 0 || this.x + this.width >= canvas.width) {
        this.velocityX *= -1;
      }
      if (this.y <= 0 || this.y + this.height >= canvas.height) {
        this.velocityY *= -1;
      }
    }
  }
}

class Rocket {
  constructor() {
    this.width = 70;
    this.height = 70;
    this.x = canvas.width / 2 - this.width / 2;
    this.y = canvas.height / 2 - this.height / 2;
    this.speed = 5; // Speed of the rocket movement
  }

  draw(ctx) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  move(direction) {
    if (direction === 'left') this.x -= this.speed;
    if (direction === 'right') this.x += this.speed;
    if (direction === 'up') this.y -= this.speed;
    if (direction === 'down') this.y += this.speed;

    if (this.x < -this.width) this.x = canvas.width;
    else if (this.x > canvas.width) this.x = -this.width;

    if (this.y < -this.height) this.y = canvas.height;
    else if (this.y > canvas.height) this.y = -this.height;
  }
}

let keys = {
  left: false,
  right: false,
  up: false,
  down: false
};

let asteroids = [];
let rocket = new Rocket();

let gameRunning = true;

let startTime, elapsedTime = 0;
let timerInterval;
let bestTime = localStorage.getItem('bestTime') ? parseInt(localStorage.getItem('bestTime')) : 0;

let lastAsteroidTime = 0;
let lastSpeedIncreaseTime = 0;
const asteroidAddInterval = 5000; // 5 seconds in milliseconds
const speedIncreaseInterval = 10000; // 10 seconds in milliseconds

function resizeCanvas() {
  canvas.width = window.innerWidth - borderWidth * 2;
  canvas.height = window.innerHeight - borderWidth * 2;
}

function startTimer() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(function () {
    elapsedTime = Date.now() - startTime;

    // Function to draw the timer, defined below
    drawTimer();
  }, 10); // Update every 10 milliseconds for smooth display
}

function drawTimer() {
  let time = new Date(elapsedTime);

  // Format minutes, seconds, and milliseconds
  let minutes = time.getMinutes().toString().padStart(2, "0");
  let seconds = time.getSeconds().toString().padStart(2, "0");
  let milliseconds = Math.floor(time.getMilliseconds() / 10).toString().padStart(2, "0");

  // Display the timer on the canvas
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "right";
  ctx.fillText(`Current time: ${minutes}:${seconds}:${milliseconds}`, canvas.width - 20, 30); // Adjust position as needed
}

function displayBestTime() {
  let bestTimeDate = new Date(bestTime);
  let minutes = bestTimeDate.getMinutes().toString().padStart(2, "0");
  let seconds = bestTimeDate.getSeconds().toString().padStart(2, "0");
  let milliseconds = Math.floor(bestTimeDate.getMilliseconds() / 10).toString().padStart(2, "0");

  ctx.fillText(`Best Time: ${minutes}:${seconds}:${milliseconds}`, canvas.width - 20, 60); // Adjust position as needed
}

function updateBestTime() {
  if (elapsedTime > bestTime) {
    bestTime = elapsedTime;
    localStorage.setItem('bestTime', bestTime.toString());
  }
}


function createAsteroids(numAsteroids) {
  const asteroids = [];
  for (let i = 0; i < numAsteroids; i++) {
    // Random size
    let width = Math.random() * 50 + 20;
    let height = Math.random() * 50 + 20;

    // Position off-screen
    let x, y, velocityX, velocityY;
    if (Math.random() < 0.5) {
      // Start off-screen horizontally (left or right)
      x = Math.random() < 0.5 ? -width : canvas.width;
      y = Math.random() * canvas.height;
      velocityX = x === -width ? Math.random() * 2 + 1 : -(Math.random() * 2 + 1);
      velocityY = Math.random() * 4 - 2;
    } else {
      // Start off-screen vertically (top or bottom)
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? -height : canvas.height;
      velocityX = Math.random() * 4 - 2;
      velocityY = y === -height ? Math.random() * 2 + 1 : -(Math.random() * 2 + 1);
    }

    asteroids.push(new Asteroid(x, y, width, height, velocityX, velocityY));
  }
  return asteroids;
}

function checkCollisionWithRocket(rocket, asteroid) {
  return (
    rocket.x < asteroid.x + asteroid.width &&
    rocket.x + rocket.width > asteroid.x &&
    rocket.y < asteroid.y + asteroid.height &&
    rocket.y + rocket.height > asteroid.y
  );
}

function addAsteroid() {
  let width = Math.random() * 50 + 20;
  let height = Math.random() * 50 + 20;
  let x = Math.random() < 0.5 ? -width : canvas.width;
  let y = Math.random() * canvas.height;
  let velocityX = Math.random() * 4 - 2;
  let velocityY = Math.random() * 4 - 2;

  asteroids.push(new Asteroid(x, y, width, height, velocityX, velocityY));
}

function increaseAsteroidsSpeed() {
  asteroids.forEach(asteroid => {
    asteroid.velocityX *= 1.1; // Increase horizontal velocity by 10%
    asteroid.velocityY *= 1.1; // Increase vertical velocity by 10%
  });
}

function checkCollision(asteroid1, asteroid2) {
  return (
    asteroid1.x < asteroid2.x + asteroid2.width &&
    asteroid1.x + asteroid1.width > asteroid2.x &&
    asteroid1.y < asteroid2.y + asteroid2.height &&
    asteroid1.y + asteroid1.height > asteroid2.y
  );
}

function increaseDifficulty(currentTime) {
  // Add an asteroid every 5 seconds
  if (currentTime - lastAsteroidTime > asteroidAddInterval) {
    lastAsteroidTime = currentTime;
    addAsteroid();
  }

  // Increase speed of all asteroids by 10% every 10 seconds
  if (currentTime - lastSpeedIncreaseTime > speedIncreaseInterval) {
    lastSpeedIncreaseTime = currentTime;
    increaseAsteroidsSpeed();
  }
}

function startGame() {
  console.log("Game started!");
  elapsedTime = 0; // Reset elapsed time
  asteroids = createAsteroids(5);
  rocket = new Rocket();
  lastAsteroidTime = Date.now();
  lastSpeedIncreaseTime = Date.now();
  startTimer();
  gameLoop(); // Start the game loop
}

function gameLoop() {

  if (!gameRunning) {
    clearInterval(timerInterval);
    updateBestTime();
    document.getElementById('restartButton').style.display = 'block'; // Show the button
    return; // Stop the game loop if the game stopped
  }

  let currentTime = Date.now();
  increaseDifficulty(currentTime);

  requestAnimationFrame(gameLoop);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update and draw each asteroid
  if (Array.isArray(asteroids)) {
    asteroids.forEach(asteroid => {
      asteroid.update();
      asteroid.draw(ctx);

      if (checkCollisionWithRocket(rocket, asteroid)) {
        gameRunning = false; // Stop the game
        alert("Game Over!"); // Notify the player
        return; // Exit the function to stop the loop
      }
    });
  }

  // Move the rocket based on key presses
  if (keys.left) rocket.move('left');
  if (keys.right) rocket.move('right');
  if (keys.up) rocket.move('up');
  if (keys.down) rocket.move('down');

  rocket.draw(ctx);

  drawTimer();
  displayBestTime();
}

function resetGame() {
  clearInterval(timerInterval);
  displayBestTime();
  keys = { left: false, right: false, up: false, down: false };
  gameRunning = true;
  document.getElementById('restartButton').style.display = 'none'; // Hide the button
  startGame();
}

window.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'ArrowUp') keys.up = true;
  if (e.key === 'ArrowDown') keys.down = true;
});

window.addEventListener('keyup', function (e) {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
  if (e.key === 'ArrowUp') keys.up = false;
  if (e.key === 'ArrowDown') keys.down = false;
});

window.addEventListener('resize', resizeCanvas, false);

window.addEventListener('load', function () {
  resizeCanvas(); // Ensure canvas is resized at start
  startGame();
});

document.getElementById('restartButton').addEventListener('click', resetGame);


