import pygame
import random
import time

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

# テトリミノの形状定義
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

# テトリミノの色
TETROMINO_COLORS = {
    'I': COLORS['CYAN'],
    'O': COLORS['YELLOW'],
    'T': COLORS['MAGENTA'],
    'S': COLORS['GREEN'],
    'Z': COLORS['RED'],
    'J': COLORS['BLUE'],
    'L': COLORS['ORANGE']
}

class Tetris:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption('テトリス')
        self.clock = pygame.time.Clock()
        self.field = [[0] * FIELD_WIDTH for _ in range(FIELD_HEIGHT)]
        self.score = 0
        self.game_over = False
        self.new_piece()
        self.last_drop_time = time.time()
        self.drop_speed = 1.0  # 1秒ごとに落下

    def new_piece(self):
        # 新しいテトリミノを生成
        self.current_piece = random.choice(list(TETROMINOS.keys()))
        self.current_rotation = 0
        self.current_x = FIELD_WIDTH // 2 - len(TETROMINOS[self.current_piece][0]) // 2
        self.current_y = 0

    def rotate_piece(self):
        # テトリミノを回転
        shape = TETROMINOS[self.current_piece]
        # 現在の形状をコピー
        current_shape = [list(row) for row in shape]
        # 回転した新しい形状を作成
        rotated = list(zip(*current_shape[::-1]))
        if self.is_valid_move(rotated, self.current_x, self.current_y):
            # 回転後の形状を2次元リストに変換
            TETROMINOS[self.current_piece] = [list(row) for row in rotated]

    def is_valid_move(self, shape, x, y):
        # 移動が有効かチェック
        for i, row in enumerate(shape):
            for j, cell in enumerate(row):
                if cell:
                    if (y + i >= FIELD_HEIGHT or
                        x + j < 0 or
                        x + j >= FIELD_WIDTH or
                        y + i < 0 or
                        self.field[y + i][x + j]):
                        return False
        return True

    def merge_piece(self):
        # テトリミノをフィールドに固定
        shape = TETROMINOS[self.current_piece]
        for i, row in enumerate(shape):
            for j, cell in enumerate(row):
                if cell:
                    self.field[self.current_y + i][self.current_x + j] = self.current_piece

    def clear_lines(self):
        # 完成したラインを消去
        lines_cleared = 0
        i = FIELD_HEIGHT - 1
        while i >= 0:
            if all(self.field[i]):
                del self.field[i]
                self.field.insert(0, [0] * FIELD_WIDTH)
                lines_cleared += 1
            else:
                i -= 1
        # スコア計算
        if lines_cleared:
            self.score += (100 * lines_cleared) * lines_cleared

    def get_ghost_position(self):
        # ゴースト位置（落下予測位置）を計算
        ghost_y = self.current_y
        while self.is_valid_move(TETROMINOS[self.current_piece], 
                               self.current_x, ghost_y + 1):
            ghost_y += 1
        return ghost_y

    def draw(self):
        self.screen.fill(COLORS['BLACK'])
        
        # グリッドの描画
        for x in range(FIELD_WIDTH + 1):
            pygame.draw.line(self.screen, (50, 50, 50),
                           (x * BLOCK_SIZE, 0),
                           (x * BLOCK_SIZE, FIELD_HEIGHT * BLOCK_SIZE))
        for y in range(FIELD_HEIGHT + 1):
            pygame.draw.line(self.screen, (50, 50, 50),
                           (0, y * BLOCK_SIZE),
                           (FIELD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE))
        
        # フィールドの描画
        for y, row in enumerate(self.field):
            for x, cell in enumerate(row):
                if cell:
                    pygame.draw.rect(self.screen, TETROMINO_COLORS[cell],
                                  (x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1))

        # 落下予測位置（ゴースト）の描画
        ghost_y = self.get_ghost_position()
        shape = TETROMINOS[self.current_piece]
        for i, row in enumerate(shape):
            for j, cell in enumerate(row):
                if cell:
                    # ゴーストカラーを白っぽく（より見やすく）
                    ghost_color = (180, 180, 180)
                    pygame.draw.rect(self.screen, ghost_color,
                                  ((self.current_x + j) * BLOCK_SIZE,
                                   (ghost_y + i) * BLOCK_SIZE,
                                   BLOCK_SIZE - 1, BLOCK_SIZE - 1), 1)  # 枠線のみ描画

        # 現在のテトリミノの描画
        shape = TETROMINOS[self.current_piece]
        for i, row in enumerate(shape):
            for j, cell in enumerate(row):
                if cell:
                    pygame.draw.rect(self.screen, TETROMINO_COLORS[self.current_piece],
                                  ((self.current_x + j) * BLOCK_SIZE,
                                   (self.current_y + i) * BLOCK_SIZE,
                                   BLOCK_SIZE - 1, BLOCK_SIZE - 1))

        # スコアの表示
        font = pygame.font.Font(None, 36)
        score_text = font.render(f'Score: {self.score}', True, COLORS['WHITE'])
        self.screen.blit(score_text, (FIELD_WIDTH * BLOCK_SIZE + 10, 10))

        pygame.display.flip()

    def reset_game(self):
        # ゲームの状態をリセット
        self.field = [[0] * FIELD_WIDTH for _ in range(FIELD_HEIGHT)]
        self.score = 0
        self.game_over = False
        self.new_piece()
        self.last_drop_time = time.time()
        self.drop_speed = 1.0

    def run(self):
        running = True
        while running:
            while not self.game_over:
                current_time = time.time()
                
                # イベント処理
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        running = False
                        return
                    if event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_LEFT:
                            if self.is_valid_move(TETROMINOS[self.current_piece], 
                                                self.current_x - 1, self.current_y):
                                self.current_x -= 1
                        elif event.key == pygame.K_RIGHT:
                            if self.is_valid_move(TETROMINOS[self.current_piece], 
                                                self.current_x + 1, self.current_y):
                                self.current_x += 1
                        elif event.key == pygame.K_UP:
                            self.rotate_piece()
                        elif event.key == pygame.K_DOWN:
                            if self.is_valid_move(TETROMINOS[self.current_piece], 
                                                self.current_x, self.current_y + 1):
                                self.current_y += 1
                        elif event.key == pygame.K_SPACE:
                            # ハードドロップ
                            while self.is_valid_move(TETROMINOS[self.current_piece], 
                                                   self.current_x, self.current_y + 1):
                                self.current_y += 1

                # 自動落下
                if current_time - self.last_drop_time > self.drop_speed:
                    if self.is_valid_move(TETROMINOS[self.current_piece], 
                                        self.current_x, self.current_y + 1):
                        self.current_y += 1
                    else:
                        self.merge_piece()
                        self.clear_lines()
                        self.new_piece()
                        if not self.is_valid_move(TETROMINOS[self.current_piece], 
                                                self.current_x, self.current_y):
                            self.game_over = True
                    self.last_drop_time = current_time

                self.draw()
                self.clock.tick(60)

            # ゲームオーバー画面
            font = pygame.font.Font(None, 48)
            game_over_text = font.render('GAME OVER', True, COLORS['WHITE'])
            retry_text = font.render('Press SPACE to Retry', True, COLORS['WHITE'])
            quit_text = font.render('Press Q to Quit', True, COLORS['WHITE'])
            
            self.screen.blit(game_over_text, 
                          (SCREEN_WIDTH // 2 - game_over_text.get_width() // 2,
                           SCREEN_HEIGHT // 2 - game_over_text.get_height() * 2))
            self.screen.blit(retry_text,
                          (SCREEN_WIDTH // 2 - retry_text.get_width() // 2,
                           SCREEN_HEIGHT // 2))
            self.screen.blit(quit_text,
                          (SCREEN_WIDTH // 2 - quit_text.get_width() // 2,
                           SCREEN_HEIGHT // 2 + quit_text.get_height() * 1.5))
            pygame.display.flip()

            # リトライ待ち
            waiting_for_input = True
            while waiting_for_input and running:
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        running = False
                        waiting_for_input = False
                    elif event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_SPACE:
                            self.reset_game()
                            waiting_for_input = False
                        elif event.key == pygame.K_q:
                            running = False
                            waiting_for_input = False

        pygame.quit()

if __name__ == '__main__':
    game = Tetris()
    game.run()
