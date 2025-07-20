import pygame
import random
import time
import asyncio
from pygame.locals import *

# 初期化
pygame.init()

# 色の定義
COLORS = {
    'BLACK': (0, 0, 0),
    'WHITE': (255, 255, 255),
    'CYAN': (0, 255, 255),
    'YELLOW': (255, 255, 0),
    'MAGENTA': (255, 0, 255),
    'RED': (255, 0, 0),
    'GREEN': (0, 255, 0),
    'BLUE': (0, 0, 255),
    'ORANGE': (255, 165, 0)
}

# ゲーム設定
BLOCK_SIZE = 30
FIELD_WIDTH = 10
FIELD_HEIGHT = 20
SCREEN_WIDTH = BLOCK_SIZE * (FIELD_WIDTH + 6)
SCREEN_HEIGHT = BLOCK_SIZE * FIELD_HEIGHT

# テトリミノの形状定義 (元のコードと同じ)
TETROMINOS = {
    'I': [[1, 1, 1, 1]],
    'O': [[1, 1],
          [1, 1]],
    'T': [[0, 1, 0],
          [1, 1, 1]],
    'S': [[0, 1, 1],
          [1, 1, 0]],
    'Z': [[1, 1, 0],
          [0, 1, 1]],
    'J': [[1, 0, 0],
          [1, 1, 1]],
    'L': [[0, 0, 1],
          [1, 1, 1]]
}

# テトリミノの色 (元のコードと同じ)
TETROMINO_COLORS = {
    'I': COLORS['CYAN'],
    'O': COLORS['YELLOW'],
    'T': COLORS['MAGENTA'],
    'S': COLORS['GREEN'],
    'Z': COLORS['RED'],
    'J': COLORS['BLUE'],
    'L': COLORS['ORANGE']
}

class TetrisWeb(Tetris):
    def __init__(self):
        super().__init__()
        # キーイベントのマッピング
        self.key_actions = {
            K_LEFT: lambda: self.move(-1),
            K_RIGHT: lambda: self.move(1),
            K_DOWN: lambda: self.drop(True),
            K_UP: lambda: self.rotate_piece(),
            K_SPACE: lambda: self.hard_drop()
        }

    async def run_web(self):
        running = True
        while running:
            while not self.game_over:
                current_time = time.time()
                
                # イベント処理
                for event in pygame.event.get():
                    if event.type == QUIT:
                        running = False
                        break
                    if event.type == KEYDOWN:
                        if event.key in self.key_actions:
                            self.key_actions[event.key]()

                # 自動落下
                if current_time - self.last_drop_time > self.drop_speed:
                    if not self.drop(False):
                        self.merge_piece()
                        self.clear_lines()
                        self.new_piece()
                        if not self.is_valid_move(TETROMINOS[self.current_piece], 
                                                self.current_x, self.current_y):
                            self.game_over = True
                    self.last_drop_time = current_time

                self.draw()
                await asyncio.sleep(0.016)  # 約60FPS

            # ゲームオーバー画面
            self.draw_game_over()
            
            # リトライ待ち
            waiting = True
            while waiting and running:
                for event in pygame.event.get():
                    if event.type == QUIT:
                        running = False
                        waiting = False
                    if event.type == KEYDOWN:
                        if event.key == K_SPACE:
                            self.reset_game()
                            waiting = False
                        elif event.key == K_q:
                            running = False
                            waiting = False
                await asyncio.sleep(0.016)

        pygame.quit()

    def move(self, dx):
        if self.is_valid_move(TETROMINOS[self.current_piece], 
                            self.current_x + dx, self.current_y):
            self.current_x += dx

    def drop(self, manual):
        if self.is_valid_move(TETROMINOS[self.current_piece], 
                            self.current_x, self.current_y + 1):
            self.current_y += 1
            return True
        return False

    def hard_drop(self):
        while self.drop(True):
            pass

# ゲーム起動
async def main():
    game = TetrisWeb()
    await game.run_web()

# Webブラウザ用のエントリーポイント
asyncio.ensure_future(main())
