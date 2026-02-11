# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
「タイピングマスター」というキータイピング練習アプリケーション。TypeScript + Vite で構築し、Firebase（Auth + Firestore）でデータ永続化を行う SPA。

## コマンド
- **開発サーバー**: `npm run dev`（Vite、ポート3000）
- **ビルド**: `npm run build`（tsc && vite build → `dist/`）
- **プレビュー**: `npm run preview`
- **型チェック**: `npm run typecheck`（tsc --noEmit）
- **デプロイ**: `npm run deploy`（build → Firebase Hosting）
- **テスト**: テストフレームワークなし
- **リント**: リンターなし

## アーキテクチャ
### ファイル構成
```
index.html              # メインHTML（UIとマークアップ）
vite.config.ts          # Vite設定
tsconfig.json           # TypeScript設定（strict: false）
firebase.json           # Firebase Hosting/Firestore設定
firestore.rules         # Firestoreセキュリティルール
.env.template           # Firebase環境変数テンプレート
src/
  main.ts               # エントリーポイント（2202行）★要リファクタリング
  main.js               # レガシーJS版（3032行）※移行中の残留ファイル
  types.ts              # TypeScript型定義（WordData, LessonData, RecordData等）
  firebase.ts           # Firebase初期化（Auth, Firestore）
  auth.ts               # AuthManager（Google認証）
  firestore.ts          # FirestoreManager（CRUD操作）
  styles.css            # スタイルシート（サイバーパンク風デザイン）
  managers/
    AudioManager.ts     # 音声機能（タイピング音、Web Speech API発音、効果音）
    GameManager.ts      # ゲーム状態・ロジック管理
    KeyboardManager.ts  # キーボード表示・ハイライト管理
    LessonManager.ts    # レッスンCRUD・単語解析
    StorageManager.ts   # データ永続化（Firestore連携）
    UIManager.ts        # DOM操作・UI状態管理
  levels/
    BaseLevel.ts        # レベル基底クラス（abstract）
    level-manager.ts    # LevelManager（多態性によるレベル切替）
    level0-vocabulary.ts       # Lv0: 単語学習（発音聞き流し）
    level1-progressive.ts      # Lv1: 段階的練習（全表示→徐々に隠す→全隠し）
    level2-pronunciation-meaning.ts  # Lv2: 発音+意味→スペル入力
    level3-pronunciation-only.ts     # Lv3: 発音のみ→スペル入力
    level4-japanese-reading.ts       # Lv4: 日本語読み→スペル入力
    level5-pronunciation-blind.ts    # Lv5: 発音のみ（文字数非表示）
```

### 主要コンポーネント

1. **Firebase統合**
   - Google認証（`AuthManager`）でログイン必須
   - Firestore でレッスン・記録をユーザー単位で保存（`FirestoreManager`）
   - 環境変数は `.env` で管理（`VITE_FIREBASE_*`）

2. **レベルシステム（多態性設計）**
   - `BaseLevel`（abstract）→ 各レベルクラスが継承
   - `LevelManager` がレッスンモード名でレベルを切替
   - 各レベルは `initializeWord()`, `validateInput()`, `handleWordComplete()`, `updateDisplay()` を実装
   - レベル追加時: `src/levels/` に新クラス作成 → `level-manager.ts` の `initializeLevels()` に登録

3. **マネージャークラス群**
   - `AudioManager`: Web Audio API + Web Speech API（タイピング音、発音、効果音）
   - `StorageManager`: Firestore経由のデータ永続化（旧localStorage→Firestore移行済み）
   - `LessonManager`: レッスンCRUD、単語テキスト解析
   - `GameManager`: ゲーム状態（スコア、タイマー、進捗、ミス管理）
   - `UIManager`: DOM要素管理、プログレスバー、ゲーム完了画面
   - `KeyboardManager`: キーボードビジュアライゼーション

4. **エントリーポイント（main.ts）**
   - グローバル変数と `Object.defineProperty` によるGameManagerプロキシ（レガシー互換）
   - ゲームループ: `initGame()` → `displayWord()` → `checkInputRealtime()` / `validateKeyInput()`
   - イベントリスナー: keydown, input, keyup, load, DOMContentLoaded
   - モーダル制御: レッスン作成、モード選択、クリア画面

5. **学習モード（6種類）**
   - **Lv0 単語学習**: 発音聞き流し（Enter/Spaceで日英交互再生）
   - **Lv1 段階的練習**: 全表示→徐々に隠す→全隠し（隠し文字選択UI付き）
   - **Lv2 発音+意味**: 発音と意味を表示してスペル入力
   - **Lv3 発音のみ**: 発音のみでスペル入力（文字数表示あり）
   - **Lv4 日本語読み**: 日本語の意味からスペル入力
   - **Lv5 発音のみ（ブラインド）**: 発音のみでスペル入力（文字数非表示）

6. **特殊機能**
   - 3回連続ミスでの進捗巻き戻し（段階的練習モード）
   - 表示文字のミスは非カウント（段階的練習モード）
   - カスタムレッスンCRUD（作成・編集・削除）
   - リアルタイムキーボードビジュアライゼーション
   - 正確率ベースの記録管理（正確率優先、同率なら時間優先）

## データ管理
- **Firestore**: レッスン（`lessons`）、記録（`gameRecords`）、設定（`users`）
- **認証**: Google Sign-In（Firebase Auth）
- **セキュリティ**: Firestoreルールでユーザー単位のアクセス制御
- **メモリ**: ゲーム状態（マネージャーインスタンス内）

## クラス依存関係
```
Firebase Auth → AuthManager → DOMContentLoaded初期化
Firebase Firestore → FirestoreManager → StorageManager
AudioManager ← GameManager, LevelManager
StorageManager ← LessonManager, GameManager
GameManager ← LevelManager, main.ts
UIManager ← LevelManager, main.ts
KeyboardManager ← main.ts
BaseLevel ← 各Levelクラス ← LevelManager
```

## 開発時の注意点
- `main.ts` が2202行あり、リファクタリング推奨（グローバル関数をマネージャーに移行）
- `main.js`（3032行）はTypeScript移行中の残留ファイル。`main.ts`が正式版
- レガシー互換のため `Object.defineProperty` によるwindowプロキシが多数存在
- `tsconfig.json` は `strict: false` で運用中
- Firebase環境変数は `.env` に設定（`.env.template` 参照）
- レベル追加時は `src/levels/` に BaseLevel 継承クラスを作成し `level-manager.ts` に登録
- モバイル対応のため、タッチイベントとキーボードイベントの両方を考慮
- Web Speech APIは一部ブラウザで制限あり（AudioManagerでエラーハンドリング済み）

## 主要な技術要素
- TypeScript（ES2020ターゲット）
- Vite（ビルドツール）
- Firebase（Auth + Firestore + Hosting）
- Web Audio API / Web Speech API
- ES6クラス + 抽象クラスによる多態性設計
- DOM操作・リアルタイム入力処理
- CSS アニメーション・レスポンシブデザイン
- ファイルサイズが2000行を超えたらリファクタリングを提案して
