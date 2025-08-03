# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
「タイピングマスター」というキータイピング練習アプリケーション。純粋なHTML/CSS/JavaScriptで構築された単一ページアプリケーション。

## コマンド
- **実行方法**: `index.html`をブラウザで開く、またはローカルWebサーバーで配信
- **ビルド**: 不要（静的ファイルのみ）
- **テスト**: テストフレームワークなし
- **リント**: リンターなし

## アーキテクチャ
### ファイル構成
- `index.html`: アプリケーション全体（HTML/CSS/JavaScript統合）
- `level-lists.js`: レベル別単語リストデータ

### 主要コンポーネント（index.html内）
1. **HTML構造**
   - ヘッダー：タイトルとベストタイム表示
   - レベル選択セクション
   - ゲームセクション：入力フィールドと単語表示
   - キーボード表示セクション
   - 結果表示セクション

2. **JavaScript機能**
   - `startGame()`: ゲーム開始処理
   - `checkInput()`: 入力チェックとフィードバック
   - `generateWord()`: 次の単語生成
   - `updateKeyboard()`: キーボードハイライト更新
   - `saveScore()`: スコア保存（localStorage）
   - `playWord()`: 単語発音（Web Speech API）

3. **データ管理**
   - localStorage: ベストタイム記録
   - グローバル変数: ゲーム状態管理

## 開発時の注意点
- すべてのコードが`index.html`に含まれているため、変更時は該当セクションを慎重に編集
- レベル追加時は`level-lists.js`の`wordLists`オブジェクトに追加
- モバイル対応のため、タッチイベントとキーボードイベントの両方を考慮
- Web Speech APIは一部のブラウザで制限があるため、エラーハンドリングが必要