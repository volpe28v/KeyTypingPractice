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

## 🎉 Firebase移行完了タスク

### Phase 1: Firebase認証の実装 🔐 ✅ 完了
- [x] Firebase Authentication の初期化
- [x] Googleアカウント認証の実装
  - [x] サインインボタンの追加
  - [x] 認証状態の管理
  - [x] ユーザー情報の表示（左上配置に調整済み）
  - [x] サインアウト機能
- [x] 認証状態によるアクセス制御
  - [x] 未認証時の機能制限（ログインモーダル表示）
  - [x] 認証後の機能解放

### Phase 2: Firestore移行 ☁️ ✅ 完了
- [x] Firestore の初期化設定
- [x] データモデルの設計
  - [x] ユーザーコレクション
  - [x] レッスンデータコレクション
  - [x] 学習記録コレクション
- [x] LocalStorageからFirestoreへの完全移行
  - [x] カスタムレッスンの保存/読み込み
  - [x] 学習記録の保存/読み込み
  - [x] ベストタイムの記録
- [x] 環境変数による設定管理
  - [x] .envファイルによるFirebase設定
  - [x] TypeScript型定義（vite-env.d.ts）
- [x] FirestoreManagerクラスの実装
  - [x] CRUD操作の実装
  - [x] ネットワーク状態監視
  - [x] エラーハンドリング
- [x] LocalStorage機能の完全削除
- [x] データ読み込みタイミングの最適化
  - [x] Firebase認証完了後のデータロード
  - [x] 最新レッスンの自動選択機能
- [x] Firestoreインデックスの作成・設定

### Phase 2.5: バグ修正・UI/UX改善 🐛 ✅ 完了
- [x] レッスン重複問題の修正
  - [x] firestoreIdフィールド統一（idからfirestoreIdに変更）
  - [x] データ読み込み時の重複防止
- [x] レッスン削除機能の修正
  - [x] Firestore削除処理の追加
  - [x] 非同期削除処理の実装
  - [x] ID互換性対応（id/firestoreId両対応）
- [x] 削除後の自動選択機能
  - [x] 削除後に残存レッスンの自動選択
  - [x] モーダルタイミング競合の修正
- [x] Firebase Hostingデプロイ設定
  - [x] firebase.json設定ファイル作成
  - [x] firestore.rules, firestore.indexes.json作成
  - [x] プロジェクト設定（spellingmaster-49b44）

## 残りのタスク 📝

### Phase 3: TypeScript完全移行 📘 ✅ 大幅に進捗
- [x] レベルモジュールのTypeScript化
  - [x] level-manager.ts への変換
  - [x] level0-vocabulary.ts への変換
  - [x] level1-progressive.ts への変換
  - [x] level2-pronunciation-meaning.ts への変換
  - [x] level3-pronunciation-only.ts への変換
  - [x] level4-japanese-reading.ts への変換
- [x] Firebase関連モジュールのTypeScript化
  - [x] auth.ts への変換
  - [x] firestore.ts への変換
  - [x] firebase.ts（初期設定）
- [x] 型定義ファイルの作成
  - [x] types.ts（WordData, LessonData, RecordData等）
- [ ] main.jsの段階的型付け
  - [ ] クラスの型定義追加
  - [ ] any型の逐次排除
  - [ ] 厳格モードへの移行

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
- [x] Firebase Hostingへのデプロイ設定
  - [x] firebase.jsonの作成
  - [x] .firebasercの設定
  - [x] firestore.rules、firestore.indexes.jsonの作成
- [ ] GitHub Actionsによる自動デプロイ設定

## 🎯 現在の状況（2025年8月11日更新）

### ✅ 完了済み機能
- **Firebase Authentication**: Google OAuth認証システム
- **Firestore統合**: 完全なクラウドデータ永続化
- **データ管理**: カスタムレッスン・ゲーム記録・ユーザー設定
- **UI/UX改善**: ユーザー情報表示位置の最適化
- **最新レッスン自動選択**: データ読み込み後の自動選択機能
- **データ整合性**: レッスン重複・削除問題の完全解決
- **Firebase Hosting**: 本番環境デプロイ準備完了
- **TypeScript移行**: レベルモジュール、Firebase関連モジュールの完全移行

### 🏗️ 技術スタック
- **フロントエンド**: HTML/CSS/JavaScript（ESモジュール）
- **認証**: Firebase Authentication（Google Provider）
- **データベース**: Cloud Firestore
- **ホスティング**: Firebase Hosting
- **開発環境**: Vite開発サーバー
- **設定管理**: 環境変数（.env）
- **型安全性**: TypeScript（レベル・認証・Firestoreモジュール完了）

### 🔧 実装詳細
- **AuthManager**: 認証状態管理クラス
- **FirestoreManager**: Firestore CRUD操作クラス
- **StorageManager**: データストレージ管理（Firestore統合済み）
- **自動データ同期**: 認証完了と同時にFirestoreからデータロード
- **オフライン対応**: ネットワーク状態監視とエラーハンドリング
- **データ整合性**: IDフィールド統一、重複・削除問題解決済み

### 🌐 アプリケーション状態
- **開発サーバー**: http://localhost:3000/ (実行中)
- **認証**: Google OAuth必須ログイン
- **データ永続化**: 100% Firestore（LocalStorage完全廃止）
- **レスポンシブ対応**: モバイル・デスクトップ両対応
- **Firebase プロジェクト**: spellingmaster-49b44

## 次のアクション 🎯

### 🔴 最優先：main.tsのファイル分割（3187行→モジュール化） 🔧
**現在進行中：2025年1月13日**

#### 分割計画
1. **managers/** ディレクトリ
   - `AudioManager.ts` - 音声関連機能（約170行）
   - `StorageManager.ts` - データ保存機能（約140行）
   - `LessonManager.ts` - レッスン管理（約180行）
   - `GameManager.ts` - ゲームロジック（約210行）
   - `UIManager.ts` - UI操作（約240行）
   - `KeyboardManager.ts` - キーボード表示（約100行）

2. **utils/** ディレクトリ
   - `globals.ts` - グローバル変数定義
   - `helpers.ts` - ユーティリティ関数

3. **game/** ディレクトリ
   - `game-logic.ts` - ゲームのメインロジック
   - `display-word.ts` - 単語表示関連
   - `input-validation.ts` - 入力検証

4. **ui/** ディレクトリ
   - `modals.ts` - モーダル制御
   - `lesson-selection.ts` - レッスン選択UI

#### 実行手順
- [x] todo.md更新
- [ ] managersディレクトリ作成と各Managerクラス分離
- [ ] utilsディレクトリ作成とヘルパー関数分離
- [ ] gameディレクトリ作成とゲームロジック分離
- [ ] uiディレクトリ作成とUI関連分離
- [ ] main.tsでのimport整理
- [ ] 型エラー修正
- [ ] 動作確認

### 优先度高：機能改善・バグ修正 🔧
1. **レベルデータの実装**
   - 現在main.js内の`levelLists`はカスタムレッスンのみ
   - Level 0-9の実際の単語データを追加必要
   - 別ファイル化を検討（word-data.ts）

2. **ユーザー体験改善**
   - キーボードビジュアライゼーションの改善
   - タイピング統計の表示機能（WPM、正確率等）
   - レベル選択画面のUI改善

3. **パフォーマンス最適化**
   - main.jsのリファクタリング（3010行の分割）
   - コード分割による初期ロード時間の短縮
   - 不要なグローバル変数の削減

### 中位度：main.jsの整理 📦
1. **main.jsの段階的分割**
   - GameManager関連 → game-manager.js
   - UIManager関連 → ui-manager.js
   - KeyboardManager関連 → keyboard-manager.js
   - LessonManager関連 → lesson-manager.js
   - AudioManager関連 → audio-manager.js
   - StorageManager関連 → storage-manager.js

2. **グローバル関数の整理**
   - レガシー関数のクラス化
   - windowオブジェクトへの依存削減

### 低位度：将来的な改善 🚀
1. **React移行**（大規模リファクタリング）
2. **テストの追加**（Jest/Vitest）
3. **CI/CDパイプラインの構築**

## 技術的な成果 🏆

- **セキュリティ**: 環境変数による設定管理、Firebase Rulesによるアクセス制御
- **パフォーマンス**: データ読み込みタイミング最適化、効率的なFirestore操作
- **可用性**: オフライン対応、エラーハンドリング
- **ユーザビリティ**: 自動ログイン、最新レッスン自動選択、削除後の自動選択
- **データ整合性**: レッスン重複・削除問題の完全解決、IDフィールド統一
- **保守性**: モジュール化されたクラス設計、明確な責任分離
- **デプロイ**: Firebase Hostingへのデプロイ準備完了

## 解決した重要な問題 🔧

1. **レッスン重複問題**: firestoreIdフィールドの統一により解決
2. **削除データの復活問題**: 非同期削除処理とFirestore削除の実装により解決
3. **モーダルタイミング競合**: hideModal/showModalのタイミング調整により解決
4. **認証・データ読み込み競合**: onAuthStateChangedでの順次処理により解決
5. **UI配置問題**: ユーザー情報表示位置の最適化（左上配置）
6. **TypeScript構文エラー**: main.js内のTypeScript構文削除により解決
7. **Level1 validateInputバグ**: WordDataオブジェクトの正しい渡し方に修正
8. **不要ファイル削除**: level-lists.tsの削除、package.json/CLAUDE.mdの更新

Firebase移行フェーズが正常に完了し、TypeScript移行も大幅に進捗しました。アプリケーションは完全にクラウドベースの近代的な構成となり、すべての重要なバグが修正され、安定した動作を実現しています。

## 今後の開発方針 📝

現在のアプリケーションは安定稼働しており、基本機能は完成しています。今後は：

1. **実用性の向上**: 実際の単語データ追加、UI/UX改善
2. **コード品質**: main.jsの分割、モジュール化
3. **将来性**: React移行は必要に応じて検討