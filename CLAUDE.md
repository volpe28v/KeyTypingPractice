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
- `index.html`: メインHTMLファイル（UIとマークアップ）
- `styles.css`: スタイルシート（UI設計とアニメーション）
- `script.js`: JavaScript機能（アプリケーションロジック）

### 主要コンポーネント
1. **HTML構造（index.html）**
   - メインコンテナ：ゲームエリアとサイドバー
   - ゲームエリア：単語表示、入力フィールド、キーボード表示
   - サイドバー：レッスン選択、記録表示
   - モーダル：レッスンモード選択、カスタムレッスン設定

2. **CSS設計（styles.css）**
   - レスポンシブデザイン（モバイル対応）
   - サイバーパンク風のビジュアルデザイン
   - キーボードアニメーション
   - 段階的練習モード用の特殊表示

3. **JavaScript アーキテクチャ（script.js）**
   
   **クラスベース設計**
   - `AudioManager`: 音声関連機能（タイピング音、発音、効果音）
   - `StorageManager`: LocalStorage操作（記録、レッスン保存）
   - `LessonManager`: レッスン管理（作成、編集、単語解析）
   - `GameManager`: ゲーム状態とロジック管理
   - `UIManager`: UI操作とDOM要素管理
   - `KeyboardManager`: キーボード表示と操作管理

   **主要機能**
   - `initGame()`: ゲーム初期化処理
   - `displayWord()`: 単語表示とモード制御
   - `checkInputRealtime()`: リアルタイム入力チェック
   - `validateKeyInput()`: キー入力バリデーション
   - 段階的練習モード: 徐々に文字を隠していく学習システム
   - 発音機能: Web Speech APIによる単語発音
   - 記録管理: ベストタイム、ミス回数の記録

   **レガシー互換性**
   - Object.definePropertyによるグローバル変数アクセサー
   - 既存のレガシー関数ラッパー
   - 段階的リファクタリングサポート

4. **学習モード**
   - **通常モード**: 単語を表示してタイピング
   - **段階的練習**: 全表示→徐々に隠す→全隠し
   - **発音+意味**: 発音と意味を表示してスペル入力
   - **発音のみ**: 発音のみでスペル入力

5. **特殊機能**
   - 3回連続ミスでの進捗巻き戻し（段階的練習モード）
   - 表示文字のミスは非カウント（段階的練習モード）
   - カスタムレッスン作成・編集
   - リアルタイムキーボードビジュアライゼーション

## データ管理
- **localStorage**: ベストタイム記録、カスタムレッスン、設定
- **メモリ**: ゲーム状態（クラスインスタンス内）
- **設定データ**: レッスンモード、プログレス状態

## 開発時の注意点
- クラスベース設計により機能が分離されているため、適切なクラスを選択して編集
- レガシー互換性を保つため、グローバル変数アクセサーを維持
- レベル追加時はmain.js内の`levelLists`配列に追加
- 段階的練習モードは複雑なロジックを持つため、GameManagerクラス内の関連メソッドを確認
- モバイル対応のため、タッチイベントとキーボードイベントの両方を考慮
- Web Speech APIは一部のブラウザで制限があるため、AudioManagerでエラーハンドリング実装済み

## クラス依存関係
```
AudioManager ← GameManager
StorageManager ← LessonManager, GameManager
LessonManager ← (グローバル関数)
GameManager ← (グローバル関数)
UIManager ← (グローバル関数)
KeyboardManager ← (グローバル関数)
```

## 主要な技術要素
- ES6クラス構文
- Web Audio API（AudioManager）
- Web Speech API（AudioManager）
- LocalStorage API（StorageManager）
- DOM操作（UIManager）
- リアルタイム入力処理
- CSS アニメーション
- レスポンシブデザイン