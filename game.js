class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameOverElement = document.getElementById('gameOver');
        this.startScreenElement = document.getElementById('startScreen');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        
        // Direction buttons
        this.upButton = document.getElementById('upButton');
        this.downButton = document.getElementById('downButton');
        this.leftButton = document.getElementById('leftButton');
        this.rightButton = document.getElementById('rightButton');
        
        // PWA elements
        this.installPrompt = document.getElementById('installPrompt');
        this.installButton = document.getElementById('installButton');
        this.dismissInstall = document.getElementById('dismissInstall');
        this.deferredPrompt = null;
        
        // Game settings
        this.gridSize = 20;
        this.moveInterval = 300; // Slower movement (300ms between moves)
        this.gameLoop = null;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.setupPWA();
        this.resetGame();
        
        // Load high score from localStorage
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.highScoreElement.textContent = this.highScore;
    }

    setupCanvas() {
        // Set canvas size based on screen size
        const size = Math.min(window.innerWidth - 40, window.innerHeight * 0.6);
        this.canvas.width = size;
        this.canvas.height = size;
        
        this.gridWidth = Math.floor(this.canvas.width / this.gridSize);
        this.gridHeight = Math.floor(this.canvas.height / this.gridSize);
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
        
        // Direction button events
        this.upButton.addEventListener('click', () => this.changeDirection('up'));
        this.downButton.addEventListener('click', () => this.changeDirection('down'));
        this.leftButton.addEventListener('click', () => this.changeDirection('left'));
        this.rightButton.addEventListener('click', () => this.changeDirection('right'));
        
        // Keyboard support for testing
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.changeDirection('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.changeDirection('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.changeDirection('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.changeDirection('right');
                    break;
            }
        });
        
        // PWA install events
        this.installButton.addEventListener('click', () => this.installPWA());
        this.dismissInstall.addEventListener('click', () => this.hideInstallPrompt());
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.gameActive) {
                this.draw();
            }
        });
    }

    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }

        // Handle PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Hide install prompt if app is already installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallPrompt();
            this.deferredPrompt = null;
        });

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.hideInstallPrompt();
        }
    }

    showInstallPrompt() {
        // Show prompt after a short delay
        setTimeout(() => {
            if (this.deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
                this.installPrompt.classList.remove('hidden');
            }
        }, 3000);
    }

    hideInstallPrompt() {
        this.installPrompt.classList.add('hidden');
    }

    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
                this.hideInstallPrompt();
            }
            
            this.deferredPrompt = null;
        }
    }

    resetGame() {
        // Initialize snake in the center
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);
        
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        
        this.direction = 'right';
        this.nextDirection = 'right';
        this.food = this.generateFood();
        this.score = 0;
        this.gameActive = false;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        this.scoreElement.textContent = this.score;
    }

    startGame() {
        this.resetGame();
        this.gameActive = true;
        this.gameOverElement.classList.add('hidden');
        this.startScreenElement.classList.add('hidden');
        
        // Start the game loop with slower movement
        this.gameLoop = setInterval(() => {
            this.moveSnake();
        }, this.moveInterval);
        
        this.draw();
    }

    changeDirection(newDirection) {
        if (!this.gameActive) return;
        
        // Prevent 180-degree turns (opposite direction)
        if (
            (newDirection === 'up' && this.direction !== 'down') ||
            (newDirection === 'down' && this.direction !== 'up') ||
            (newDirection === 'left' && this.direction !== 'right') ||
            (newDirection === 'right' && this.direction !== 'left')
        ) {
            this.nextDirection = newDirection;
        }
    }

    moveSnake() {
        if (!this.gameActive) return;
        
        // Update direction
        this.direction = this.nextDirection;
        
        const head = { ...this.snake[0] };
        
        // Calculate new head position based on direction
        switch(this.direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // Check for wall collision
        if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
            this.gameOver();
            return;
        }
        
        // Check for self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
                this.gameOver();
                return;
            }
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check for food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreElement.textContent = this.score;
            this.food = this.generateFood();
            
            // Update high score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreElement.textContent = this.highScore;
                localStorage.setItem('snakeHighScore', this.highScore);
            }
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
        
        this.draw();
    }

    generateFood() {
        let food;
        let onSnake;
        
        do {
            onSnake = false;
            food = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            
            // Check if food is on snake
            for (let segment of this.snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    onSnake = true;
                    break;
                }
            }
        } while (onSnake);
        
        return food;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (subtle)
        this.ctx.strokeStyle = '#2a2a2a';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Snake head
                this.ctx.fillStyle = '#4caf50';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
                
                // Draw eyes based on direction
                this.ctx.fillStyle = '#1b5e20';
                const eyeSize = 3;
                const offset = 4;
                
                switch(this.direction) {
                    case 'up':
                        this.ctx.fillRect(
                            segment.x * this.gridSize + offset,
                            segment.y * this.gridSize + offset,
                            eyeSize, eyeSize
                        );
                        this.ctx.fillRect(
                            segment.x * this.gridSize + this.gridSize - offset - eyeSize,
                            segment.y * this.gridSize + offset,
                            eyeSize, eyeSize
                        );
                        break;
                    case 'down':
                        this.ctx.fillRect(
                            segment.x * this.gridSize + offset,
                            segment.y * this.gridSize + this.gridSize - offset - eyeSize,
                            eyeSize, eyeSize
                        );
                        this.ctx.fillRect(
                            segment.x * this.gridSize + this.gridSize - offset - eyeSize,
                            segment.y * this.gridSize + this.gridSize - offset - eyeSize,
                            eyeSize, eyeSize
                        );
                        break;
                    case 'left':
                        this.ctx.fillRect(
                            segment.x * this.gridSize + offset,
                            segment.y * this.gridSize + offset,
                            eyeSize, eyeSize
                        );
                        this.ctx.fillRect(
                            segment.x * this.gridSize + offset,
                            segment.y * this.gridSize + this.gridSize - offset - eyeSize,
                            eyeSize, eyeSize
                        );
                        break;
                    case 'right':
                        this.ctx.fillRect(
                            segment.x * this.gridSize + this.gridSize - offset - eyeSize,
                            segment.y * this.gridSize + offset,
                            eyeSize, eyeSize
                        );
                        this.ctx.fillRect(
                            segment.x * this.gridSize + this.gridSize - offset - eyeSize,
                            segment.y * this.gridSize + this.gridSize - offset - eyeSize,
                            eyeSize, eyeSize
                        );
                        break;
                }
            } else {
                // Snake body
                this.ctx.fillStyle = '#388e3c';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
                
                // Add rounded corners for body segments
                this.ctx.fillStyle = '#2e7d32';
                const cornerSize = 2;
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    cornerSize, cornerSize
                );
                this.ctx.fillRect(
                    (segment.x + 1) * this.gridSize - cornerSize - 1,
                    segment.y * this.gridSize + 1,
                    cornerSize, cornerSize
                );
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    (segment.y + 1) * this.gridSize - cornerSize - 1,
                    cornerSize, cornerSize
                );
                this.ctx.fillRect(
                    (segment.x + 1) * this.gridSize - cornerSize - 1,
                    (segment.y + 1) * this.gridSize - cornerSize - 1,
                    cornerSize, cornerSize
                );
            }
        });
        
        // Draw food
        this.ctx.fillStyle = '#ff5252';
        this.ctx.beginPath();
        this.ctx.arc(
            (this.food.x + 0.5) * this.gridSize,
            (this.food.y + 0.5) * this.gridSize,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Add shine to food
        this.ctx.fillStyle = '#ff8a80';
        this.ctx.beginPath();
        this.ctx.arc(
            (this.food.x + 0.5) * this.gridSize - 3,
            (this.food.y + 0.5) * this.gridSize - 3,
            this.gridSize / 6,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    gameOver() {
        this.gameActive = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.remove('hidden');
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});

// Prevent scrolling on touch
document.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('dir-button')) {
        e.preventDefault();
    }
}, { passive: false });
