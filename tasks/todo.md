# 練習結果表示機能（弱点ワードリスト + 苦手単語リトライ）

## 背景
練習後に「どの単語をどれだけ間違えたか」が分からず、弱点を次に生かせない。
実装前は `GameManager.mistakeCount`（総ミス数）しか保持していなかった。

## スコープ
- フェーズ0: 単語別ミス記録の土台
- 案A: 弱点ワードリスト（ミス数降順・ミス文字ハイライト）
- 案D: 「間違えた単語だけもう一度」復習リトライ

## Todo
- [x] `types.ts` に `CharMiss` / `WordResult` を追加
- [x] `GameManager` に単語別ミス記録（開始・記録・確定・取得）を実装
- [x] `BaseLevel.validateInput` でミス文字を記録
- [x] `level1-progressive.validateInput` でミス文字を記録
- [x] `GameController.displayWord` で単語計測を開始
- [x] `GameController.scheduleNextWord` で単語結果を確定
- [x] `index.html` に結果パネルのマークアップを追加
- [x] `styles.css` に結果パネルのスタイルを追加
- [x] `UIManager.showResultPanel` / `hideResultPanel` を実装
- [x] クリア時に結果パネルを表示
- [x] `R` キー / ボタンで苦手単語のみリトライ
- [x] 復習セッションは XP・レッスン記録を保存しない（記録汚染防止）
- [x] typecheck / ビルド

## 設計メモ
- ミス検知点は `BaseLevel.ts:49` と `level1-progressive.ts:141` の 2 箇所のみ。
  期待文字・入力文字・文字位置が揃っているのでそのまま記録できる。
- 単語の確定は `GameController.scheduleNextWord()` に集約（全レベル共通の合流点）。
  段階的練習は 1 単語＝複数ステップだが、ステップ間は `scheduleNextWord` を通らないため
  ミスは単語単位で正しく累積される。
- `initGame()` は同じ単語に対して `displayWord()` を複数回呼ぶため、
  `beginWordAttempt()` は `attemptWordIndex` で単語ごとに 1 回だけ実行されるようにした。
- Lv0（単語学習）はタイピングしないため結果パネルの対象外
  （`wordResults` が空なら `showResultPanel()` は何も表示しない）。
- 復習セッションは単語数が減るため、XP とレッスン記録（ランキング）は保存しない。
  `pendingReviewSession` を `retryMissedWords()` でのみ立て、`initGame()` が消費する。
  これにより他の `initGame()` 呼び出し経路が誤って復習扱いになることを防ぐ。
- レッスン内容はユーザー入力のため、パネル描画は `escapeHTML()` を通す。

## レビュー
### 変更ファイル
| ファイル | 変更内容 |
|---|---|
| `src/types.ts` | `CharMiss` / `WordResult` 型を追加 |
| `src/managers/GameManager.ts` | 単語別ミス記録の状態と `beginWordAttempt` / `recordCharMistake` / `commitWordAttempt` / `getMissedWords`、`isReviewSession` を追加 |
| `src/levels/BaseLevel.ts` | ミス検知時に `recordCharMistake()` を呼ぶ（1行） |
| `src/levels/level1-progressive.ts` | 同上（1行） |
| `src/controllers/GameController.ts` | 計測開始・確定、結果パネル表示、`R` キー / `retryMissedWords()`、復習時の記録スキップ |
| `src/managers/UIManager.ts` | `showResultPanel()` / `hideResultPanel()` と描画ヘルパー |
| `index.html` | `#result-panel` のマークアップ |
| `src/styles.css` | 結果パネルのスタイル |

### 検討して見送ったもの
- `WordResult.elapsedMs`（単語ごとの所要時間）: 案E（遅かった単語）用のデータだが
  今回の表示では使わないため削除（YAGNI）。案E 着手時に再追加する。

### 未検証事項
- ブラウザでの実動作確認は未実施。サンドボックスが dev server のポート待受を禁止しており、
  かつアプリが Google ログイン必須のため。`npm run dev` での目視確認が必要。
- 確認したいポイント: 結果パネルのレイアウト崩れ、`R` キーでの復習リトライ、
  段階的練習（Lv1）でのミス集計、復習セッションで XP が加算されないこと。

### リンター
本プロジェクトには lint / format スクリプトが未設定のため、typecheck とビルドのみ実行した。
