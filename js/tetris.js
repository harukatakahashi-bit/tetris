class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // ゲーム設定
        this.BLOCK_SIZE = 30;
        this.FIELD_WIDTH = 10;
        this.FIELD_HEIGHT = 20;
        this.SCREEN_WIDTH = this.BLOCK_SIZE * (this.FIELD_WIDTH + 6);
        this.SCREEN_HEIGHT = this.BLOCK_SIZE * this.FIELD_HEIGHT;
        
        // キャンバスサイズを設定
        this.canvas.width = this.SCREEN_WIDTH;
        this.canvas.height = this.SCREEN_HEIGHT;
        
        // 色の定義
        this.COLORS = {
            BLACK: '#000000',
            WHITE: '#FFFFFF',
            CYAN: '#00FFFF',
            YELLOW: '#FFFF00',
            MAGENTA: '#FF00FF',
            RED: '#FF0000',
            GREEN: '#00FF00',
            BLUE: '#0000FF',
            ORANGE: '#FFA500'
        };
        
        // テトリミノの形状定義
        this.TETROMINOS = {
            'I': [[1, 1, 1, 1]],
            'O': [[1, 1], [1, 1]],
            'T': [[0, 1, 0], [1, 1, 1]],
            'S': [[0, 1, 1], [1, 1, 0]],
            'Z': [[1, 1, 0], [0, 1, 1]],
            'J': [[1, 0, 0], [1, 1, 1]],
            'L': [[0, 0, 1], [1, 1, 1]]
        };
        
        // テトリミノの色
        this.TETROMINO_COLORS = {
            'I': this.COLORS.CYAN,
            'O': this.COLORS.YELLOW,
            'T': this.COLORS.MAGENTA,
            'S': this.COLORS.GREEN,
            'Z': this.COLORS.RED,
            'J': this.COLORS.BLUE,
            'L': this.COLORS.ORANGE
        };
        
        this.init();
        this.bindEvents();
        this.run();
    }
    
    init() {
        this.field = Array(this.FIELD_HEIGHT).fill().map(() => Array(this.FIELD_WIDTH).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.nextPiece = this.randomPiece();
        this.newPiece();
        this.lastDropTime = Date.now();
        this.dropSpeed = 1000; // 1秒ごとに落下
    }
    
    randomPiece() {
        const pieces = Object.keys(this.TETROMINOS);
        return pieces[Math.floor(Math.random() * pieces.length)];
    }
    
    newPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomPiece();
        this.currentX = Math.floor(this.FIELD_WIDTH / 2) - Math.floor(this.TETROMINOS[this.currentPiece][0].length / 2);
        this.currentY = 0;
    }
    
    getWallKicks(pieceType, rotationState, direction) {
        // SRSのウォールキックテストデータ
        const wallKickData = {
            'I': [
                [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],  // 0->R
                [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],  // R->2
                [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],  // 2->L
                [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]   // L->0
            ],
            'JLSTZ': [
                [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],  // 0->R
                [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],      // R->2
                [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],     // 2->L
                [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]    // L->0
            ]
        };

        const testData = pieceType === 'I' ? wallKickData['I'] : wallKickData['JLSTZ'];
        return testData[rotationState].map(([x, y]) => direction === 1 ? [x, y] : [-x, -y]);
    }

    rotatePiece() {
        if (this.currentPiece === 'O') return; // O piece doesn't rotate
        
        const currentRotation = this.currentRotationState || 0;
        const newRotationState = (currentRotation + 1) % 4;
        
        // テトリミノを回転
        const shape = this.TETROMINOS[this.currentPiece];
        const rotated = shape[0].map((_, i) => shape.map(row => row[row.length - 1 - i]));
        
        // ウォールキックテストを実行
        const kicks = this.getWallKicks(
            this.currentPiece,
            currentRotation,
            1
        );
        
        for (const [kickX, kickY] of kicks) {
            if (this.isValidMove(rotated, this.currentX + kickX, this.currentY + kickY)) {
                this.TETROMINOS[this.currentPiece] = rotated;
                this.currentX += kickX;
                this.currentY += kickY;
                this.currentRotationState = newRotationState;
                return true;
            }
        }
        return false;
    }
    
    isValidMove(shape, x, y) {
        return shape.every((row, dy) => {
            return row.every((cell, dx) => {
                if (!cell) return true;
                const newX = x + dx;
                const newY = y + dy;
                return (
                    newX >= 0 &&
                    newX < this.FIELD_WIDTH &&
                    newY >= 0 &&
                    newY < this.FIELD_HEIGHT &&
                    !this.field[newY][newX]
                );
            });
        });
    }
    
    mergePiece() {
        const shape = this.TETROMINOS[this.currentPiece];
        shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.field[this.currentY + y][this.currentX + x] = this.currentPiece;
                }
            });
        });
    }
    
    async clearLines() {
        const linesToClear = [];
        
        for (let y = this.FIELD_HEIGHT - 1; y >= 0; y--) {
            if (this.field[y].every(cell => cell)) {
                linesToClear.push(y);
            }
        }
        
        if (linesToClear.length) {
            const linesCount = linesToClear.length;
            const flashCount = linesCount === 1 ? 3 : 5;
            const flashColors = linesCount === 1 ? 
                [this.COLORS.WHITE] : 
                [this.COLORS.RED, this.COLORS.YELLOW, this.COLORS.GREEN, this.COLORS.CYAN, this.COLORS.BLUE];
            
            // エフェクト表示
            for (let i = 0; i < flashCount; i++) {
                for (const color of flashColors) {
                    linesToClear.forEach(line => {
                        for (let x = 0; x < this.FIELD_WIDTH; x++) {
                            this.ctx.fillStyle = color;
                            this.ctx.fillRect(
                                x * this.BLOCK_SIZE,
                                line * this.BLOCK_SIZE,
                                this.BLOCK_SIZE - 1,
                                this.BLOCK_SIZE - 1
                            );
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
                this.draw();
                await new Promise(resolve => setTimeout(resolve, 30));
            }
            
            // ラインを消去（上から順に処理するために並べ替え）
            linesToClear.sort((a, b) => a - b).forEach(line => {
                this.field.splice(line, 1);
                this.field.unshift(Array(this.FIELD_WIDTH).fill(0));
            });
            
            // スコア計算
            this.score += (100 * linesCount) * linesCount;
        }
    }
    
    getGhostPosition() {
        let ghostY = this.currentY;
        while (this.isValidMove(this.TETROMINOS[this.currentPiece], this.currentX, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }
    
    draw() {
        // 画面をクリア
        this.ctx.fillStyle = this.COLORS.BLACK;
        this.ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        
        // グリッドの描画
        this.ctx.strokeStyle = '#323232';
        for (let x = 0; x <= this.FIELD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.FIELD_HEIGHT * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.FIELD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.FIELD_WIDTH * this.BLOCK_SIZE, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // フィールドの描画
        this.field.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.ctx.fillStyle = this.TETROMINO_COLORS[cell];
                    this.ctx.fillRect(
                        x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            });
        });
        
        // 落下予測位置（ゴースト）の描画
        const ghostY = this.getGhostPosition();
        const shape = this.TETROMINOS[this.currentPiece];
        shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.ctx.strokeStyle = '#B4B4B4';
                    this.ctx.strokeRect(
                        (this.currentX + x) * this.BLOCK_SIZE,
                        (ghostY + y) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            });
        });
        
        // 現在のテトリミノの描画
        shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.ctx.fillStyle = this.TETROMINO_COLORS[this.currentPiece];
                    this.ctx.fillRect(
                        (this.currentX + x) * this.BLOCK_SIZE,
                        (this.currentY + y) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            });
        });
        
        // サイドパネルの背景
        this.ctx.fillStyle = '#1E1E1E';
        this.ctx.fillRect(
            this.FIELD_WIDTH * this.BLOCK_SIZE,
            0,
            this.SCREEN_WIDTH - this.FIELD_WIDTH * this.BLOCK_SIZE,
            this.SCREEN_HEIGHT
        );
        
        // スコアの表示
        this.ctx.fillStyle = this.COLORS.WHITE;
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.FIELD_WIDTH * this.BLOCK_SIZE + 10, 30);
        
        // NEXT表示
        this.ctx.fillText('NEXT', this.FIELD_WIDTH * this.BLOCK_SIZE + 10, 80);
        
        // 次のテトリミノの表示
        const nextShape = this.TETROMINOS[this.nextPiece];
        const shapeHeight = nextShape.length * this.BLOCK_SIZE;
        const shapeWidth = nextShape[0].length * this.BLOCK_SIZE;
        const offsetX = this.FIELD_WIDTH * this.BLOCK_SIZE + 
                       (this.SCREEN_WIDTH - this.FIELD_WIDTH * this.BLOCK_SIZE - shapeWidth) / 2;
        const offsetY = 100;
        
        nextShape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.ctx.fillStyle = this.TETROMINO_COLORS[this.nextPiece];
                    this.ctx.fillRect(
                        offsetX + x * this.BLOCK_SIZE,
                        offsetY + y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            });
        });
    }
    
    bindEvents() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        
        this.keydownHandler = (event) => {
            if (this.gameOver) {
                if (event.key.toLowerCase() === 'r') {
                    this.init();
                    this.run(); // ゲームのメインループを再開
                } else if (event.key.toLowerCase() === 'q') {
                    // ゲーム終了の処理
                }
                return;
            }
            
            switch (event.key) {
                case 'ArrowLeft':
                    if (this.isValidMove(this.TETROMINOS[this.currentPiece], this.currentX - 1, this.currentY)) {
                        this.currentX--;
                    }
                    break;
                case 'ArrowRight':
                    if (this.isValidMove(this.TETROMINOS[this.currentPiece], this.currentX + 1, this.currentY)) {
                        this.currentX++;
                    }
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case 'ArrowDown':
                    if (this.isValidMove(this.TETROMINOS[this.currentPiece], this.currentX, this.currentY + 1)) {
                        this.currentY++;
                    }
                    break;
                case ' ':
                    while (this.isValidMove(this.TETROMINOS[this.currentPiece], this.currentX, this.currentY + 1)) {
                        this.currentY++;
                    }
                    break;
            }
            this.draw();
        };
        
        document.addEventListener('keydown', this.keydownHandler);
    }
    
    async run() {
        while (!this.gameOver) {
            const currentTime = Date.now();
            
            if (currentTime - this.lastDropTime > this.dropSpeed) {
                if (this.isValidMove(this.TETROMINOS[this.currentPiece], this.currentX, this.currentY + 1)) {
                    this.currentY++;
                } else {
                    this.mergePiece();
                    await this.clearLines();
                    this.newPiece();
                    if (!this.isValidMove(this.TETROMINOS[this.currentPiece], this.currentX, this.currentY)) {
                        this.gameOver = true;
                    }
                }
                this.lastDropTime = currentTime;
            }
            
            this.draw();
            
            if (this.gameOver) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
                
                this.ctx.fillStyle = this.COLORS.WHITE;
                this.ctx.font = '36px Arial';
                
                const gameOverText = 'GAME OVER';
                const retryText = 'Press R to Retry';
                const quitText = 'Press Q to Quit';
                
                this.ctx.fillText(
                    gameOverText,
                    this.SCREEN_WIDTH / 2 - this.ctx.measureText(gameOverText).width / 2,
                    this.SCREEN_HEIGHT / 2 - 50
                );
                this.ctx.fillText(
                    retryText,
                    this.SCREEN_WIDTH / 2 - this.ctx.measureText(retryText).width / 2,
                    this.SCREEN_HEIGHT / 2
                );
                this.ctx.fillText(
                    quitText,
                    this.SCREEN_WIDTH / 2 - this.ctx.measureText(quitText).width / 2,
                    this.SCREEN_HEIGHT / 2 + 50
                );
            }
            
            await new Promise(requestAnimationFrame);
        }
    }
}
