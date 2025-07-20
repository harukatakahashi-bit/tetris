# Python Tetris

Pygameを使用したシンプルなテトリスゲームです。

## 機能

- 7種類のテトリミノ
- スコアシステム
- グリッド表示
- ゴースト（落下予測位置）表示
- ゲームオーバー時のリトライ機能

## 操作方法

- ←→: 左右移動
- ↑: 回転
- ↓: 下に移動（ソフトドロップ）
- スペース: 一番下まで落とす（ハードドロップ）
- ゲームオーバー時:
  - スペース: リトライ
  - Q: 終了

## 必要条件

- Python 3.6以上
- Pygame

## インストール方法

```bash
# 仮想環境の作成
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# または
.venv\Scripts\activate     # Windows

# 依存パッケージのインストール
pip install pygame
```

## 実行方法

```bash
python tetris.py
```
