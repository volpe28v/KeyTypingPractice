# Firebase移行タスクリスト

## 完了済みタスク ✅

### 1. 環境構築
- [x] firebaseブランチの作成
- [x] Vite環境の構築
- [x] package.jsonの設定
- [x] vite.config.tsの作成
- [x] tsconfig.jsonの作成（TypeScript設定）

### 2. ファイル構成の変更
- [x] JavaScriptファイルをsrcディレクトリへ移動
- [x] ESモジュール形式への変換
- [x] レベル別モジュールのimport/export対応
- [x] グローバル関数の公開処理

### 3. バグ修正
- [x] 音声効果機能の修正（excellent, goodの再生）
- [x] ゲームクリア時のformatTimeエラー修正
- [x] favicon 404エラーの修正

## 残りのタスク 📝

### Phase 1: Firebase認証の実装 🔐
- [ ] Firebase Authentication の初期化
- [ ] Googleアカウント認証の実装
  - [ ] サインインボタンの追加
  - [ ] 認証状態の管理
  - [ ] ユーザー情報の表示
  - [ ] サインアウト機能
- [ ] 認証状態によるアクセス制御
  - [ ] 未認証時の機能制限
  - [ ] 認証後の機能解放

### Phase 2: Firestore移行 ☁️
- [ ] Firestore の初期化設定
- [ ] データモデルの設計
  - [ ] ユーザーコレクション
  - [ ] レッスンデータコレクション
  - [ ] 学習記録コレクション
- [ ] LocalStorageからFirestoreへの移行
  - [ ] カスタムレッスンの保存/読み込み
  - [ ] 学習記録の保存/読み込み
  - [ ] ベストタイムの記録
- [ ] オフライン対応
  - [ ] Firestoreのオフライン永続化設定
  - [ ] 同期処理の実装

### Phase 3: TypeScript完全移行 📘
- [ ] main.jsをmain.tsへ変換
  - [ ] 型定義の追加
  - [ ] any型の排除
  - [ ] インターフェースの定義
- [ ] レベルモジュールのTypeScript化
  - [ ] level-manager.ts への変換
  - [ ] 各レベルファイルの型付け
- [ ] 厳格な型チェックの有効化
  - [ ] tsconfig.jsonのstrict: true設定
  - [ ] エラーの修正

### Phase 4: React移行 ⚛️
- [ ] Reactの導入
  - [ ] react, react-domのインストール
  - [ ] Vite設定の更新
- [ ] コンポーネント化
  - [ ] App.tsxの作成
  - [ ] ゲーム画面コンポーネント
  - [ ] レッスン選択コンポーネント
  - [ ] キーボード表示コンポーネント
  - [ ] 記録表示コンポーネント
- [ ] 状態管理
  - [ ] useStateによる状態管理
  - [ ] Context APIまたはZustandの導入検討
- [ ] カスタムフックの作成
  - [ ] useAuth（認証）
  - [ ] useFirestore（データ取得）
  - [ ] useGame（ゲームロジック）

### Phase 5: ビルドとデプロイ 🚀
- [ ] ビルド設定の最適化
  - [ ] 本番ビルドの設定
  - [ ] コード分割の設定
  - [ ] 最小化の設定
- [ ] Firebase Hostingへのデプロイ設定
  - [ ] firebase.jsonの作成
  - [ ] .firebasercの設定
  - [ ] GitHub Actionsによる自動デプロイ設定

## 作業順序の推奨 📋

1. **Firebase認証** - ユーザー管理の基盤を作る
2. **Firestore移行** - データの永続化をクラウドへ
3. **TypeScript完全移行** - 型安全性を確保
4. **React移行** - モダンなUIフレームワークへ
5. **ビルド・デプロイ** - 本番環境への展開

## 注意事項 ⚠️

- 各フェーズは段階的に実装し、動作確認を行う
- デグレを防ぐため、既存機能のテストを重視
- ユーザー体験を損なわないよう、移行は慎重に行う
- Firebase関連の設定（APIキーなど）は環境変数化を検討

## 現在の状態 📊

- **ブランチ**: firebase
- **開発サーバー**: http://localhost:3000/ (Vite)
- **主な技術スタック**: 
  - Vite (ビルドツール)
  - TypeScript (一部設定済み)
  - Firebase SDK (インストール済み)
  - ESモジュール形式

## 現在の状況 📊

**✅ Firebase認証完了**
- Google OAuth認証機能を実装済み
- 必須ログイン機能（未ログインではメイン画面非表示）
- AuthManagerクラスによる認証状態管理

**🔄 現在進行中：Firestore移行**
- 環境変数を使用したセキュアな設定
- LocalStorage + Firestore のハイブリッドストレージ
- オフライン対応の実装

## 次のアクション 🎯

**Phase 2: Firestore移行を実施中**

### 現在の作業項目
1. **環境変数設定** - .envファイルによるFirebase設定の外部化
2. **FirestoreManager実装** - データの保存・読み込み機能
3. **ハイブリッドストレージ** - LocalStorageとFirestoreの統合
4. **オフライン対応** - ネットワーク状態に応じた自動切り替え
5. **データ移行** - 既存LocalStorageデータのFirestore移行

### 参考実装
- [SpeakNote Firebase実装](https://github.com/volpe28v/SpeakNote/tree/firebase) を参考に実装