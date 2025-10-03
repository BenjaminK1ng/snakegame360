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
        this.touchArea = document.getElementById('touchArea');
        this.touchIndicator = document.querySelector('.touch-indicator');
        
        // PWA elements
        this.installPrompt = document.getElementById('installPrompt');
        this.installButton = document.getElementById('installButton');
        this.dismissInstall = document.getElementById('dismissInstall');
        this.deferredPrompt = null;
        
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
        const size = Math.min(window.innerWidth - 40, window.innerHeight * 0.7);
        this.canvas.width = size;
        this.canvas.height = size;
        
        this.gridSize = 20;
        this.gridWidth = Math.floor(this.canvas.width / this.gridSize);
        this.gridHeight = Math.floor(this.canvas.height / this.gridSize);
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
        
        // Touch events for 360° movement
        this.touchArea.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.touchArea.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.touchArea.addEventListener('touchend', () => this.handleTouchEnd());
        
        // Mouse events for testing on desktop
        this.touchArea.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.touchArea.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.touchArea.addEventListener('mouseup', () => this.handleTouchEnd());
        this.touchArea.addEventListener('mouseleave', () => this.handleTouchEnd());
        
        // PWA install events
        this.installButton.addEventListener('click', () => this.installPWA());
        this.dismissInstall.addEventListener('click', () => this.hideInstallPrompt());
        
        // Prevent context menu
        this.touchArea.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.draw();
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
        this.snake = [
            { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) }
        ];
        this.direction = { x: 0, y: 0 };
        this.food = this.generateFood();
        this.score = 0;
        this.gameActive = false;
        this.touchActive = false;
        this.touchStart = { x: 0, y: 0 };
        this.touchCurrent = { x: 0, y: 0 };
        
        this.scoreElement.textContent = this.score;
    }

    startGame() {
        this.resetGame();
        this.gameActive = true;
        this.gameOverElement.classList.add('hidden');
        this.startScreenElement.classList.add('hidden');
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

    handleTouchStart(e) {
        if (!this.gameActive) return;
        
        e.preventDefault();
        this.touchActive = true;
        const rect = this.touchArea.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        
        this.touchStart.x = touch.clientX - rect.left;
        this.touchStart.y = touch.clientY - rect.top;
        this.touchCurrent.x = this.touchStart.x;
        this.touchCurrent.y = this.touchStart.y;
        
        this.updateTouchIndicator();
    }

    handleTouchMove(e) {
        if (!this.touchActive || !this.gameActive) return;
        
        e.preventDefault();
        const rect = this.touchArea.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        
        this.touchCurrent.x = touch.clientX - rect.left;
        this.touchCurrent.y = touch.clientY - rect.top;
        
        this.calculateDirection();
        this.updateTouchIndicator();
        this.moveSnake();
    }

    handleMouseDown(e) {
        if (!this.gameActive) return;
        
        e.preventDefault();
        this.touchActive = true;
        const rect = this.touchArea.getBoundingClientRect();
        
        this.touchStart.x = e.clientX - rect.left;
        this.touchStart.y = e.clientY - rect.top;
        this.touchCurrent.x = this.touchStart.x;
        this.touchCurrent.y = this.touchStart.y;
        
        this.updateTouchIndicator();
    }

    handleMouseMove(e) {
        if (!this.touchActive || !this.gameActive) return;
        
        e.preventDefault();
        const rect = this.touchArea.getBoundingClientRect();
        
        this.touchCurrent.x = e.clientX - rect.left;
        this.touchCurrent.y = e.clientY - rect.top;
        
        this.calculateDirection();
        this.updateTouchIndicator();
        this.moveSnake();
    }

    handleTouchEnd() {
        this.touchActive = false;
        this.touchIndicator.style.transform = 'translate(-50%, -50%)';
    }

    calculateDirection() {
        const dx = this.touchCurrent.x - this.touchStart.x;
        const dy = this.touchCurrent.y - this.touchStart.y;
        
        // Calculate angle in radians
        let angle = Math.atan2(dy, dx);
        
        // Convert to direction vector
        const magnitude = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 50);
        
        this.direction.x = Math.cos(angle) * magnitude;
        this.direction.y = Math.sin(angle) * magnitude;
        
        // Normalize to grid movement (only one axis at a time for classic snake feel)
        // But for true 360 movement, we'll keep both components
        if (Math.abs(this.direction.x) > Math.abs(this.direction.y)) {
            this.direction.y = 0;
            this.direction.x = this.direction.x > 0 ? 1 : -1;
        } else {
            this.direction.x = 0;
            this.direction.y = this.direction.y > 0 ? 1 : -1;
        }
    }

    updateTouchIndicator() {
        if (!this.touchActive) return;
        
        const rect = this.touchArea.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const dx = this.touchCurrent.x - centerX;
        const dy = this.touchCurrent.y - centerY;
        
        // Limit movement to within the circle
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), centerX - 15);
        const angle = Math.atan2(dy, dx);
        
        const indicatorX = centerX + Math.cos(angle) * distance;
        const indicatorY = centerY + Math.sin(angle) * distance;
        
        this.touchIndicator.style.transform = `translate(${indicatorX - centerX}px, ${indicatorY - centerY}px)`;
    }

    moveSnake() {
        if (!this.gameActive) return;
        
        const head = { ...this.snake[0] };
        
        // Calculate new head position based on direction
        head.x += this.direction.x;
        head.y += this.direction.y;
        
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
            const gradient = this.ctx.createLinearGradient(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                (segment.x + 1) * this.gridSize,
                (segment.y + 1) * this.gridSize
            );
            
            if (index === 0) {
                // Head
                gradient.addColorStop(0, '#4caf50');
                gradient.addColorStop(1, '#45a049');
            } else {
                // Body
                gradient.addColorStop(0, '#388e3c');
                gradient.addColorStop(1, '#2e7d32');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            // Add rounded corners
            this.ctx.fillStyle = index === 0 ? '#81c784' : '#66bb6a';
            const cornerSize = 3;
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                cornerSize,
                cornerSize
            );
            this.ctx.fillRect(
                (segment.x + 1) * this.gridSize - cornerSize - 1,
                segment.y * this.gridSize + 1,
                cornerSize,
                cornerSize
            );
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                (segment.y + 1) * this.gridSize - cornerSize - 1,
                cornerSize,
                cornerSize
            );
            this.ctx.fillRect(
                (segment.x + 1) * this.gridSize - cornerSize - 1,
                (segment.y + 1) * this.gridSize - cornerSize - 1,
                cornerSize,
                cornerSize
            );
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
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});

// Prevent scrolling on touch
document.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('touch-area') || 
        e.target.id === 'gameCanvas' ||
        e.target.closest('.touch-area')) {
        e.preventDefault();
    }
}, { passive: false });