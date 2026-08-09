# Lessons

## firebase deploy はデータを消さないが、rules と indexes を丸ごと上書きする
- 事故: 別リポジトリ（SpeakNote）から `firebase deploy --project spellingmaster-49b44`
  を実行し、このアプリのプロジェクトに対して
  「定義ファイルに無いインデックスを削除しますか？」に Yes と答えてしまった。
- 実際に壊れたもの: 複合インデックス4件の削除 / `firestore.rules` の上書き / Hosting の差し替え。
  **Firestore のドキュメントは一切削除されない**（deploy は hosting・rules・indexes しか触らない）。
- 復旧: 正しいリポジトリから `npm run deploy:all` するだけ。rules も indexes も Hosting も
  リポジトリに揃っているため1コマンドで戻る。インデックスのビルド完了まで数分かかる。
- 教訓:
  - `--project` を手打ちしない。`.firebaserc` でリポジトリごとに固定する
  - 通常のリリースは `--only hosting`。rules/indexes は変更時だけ明示的にデプロイする
  - 「データが消えた」ように見えても、まず rules 上書きとインデックス欠落を疑う
    （どちらもアプリからは空に見える）
- 関連: `.firebaserc`, `package.json` の deploy スクリプト

## クエリ失敗を握りつぶすと「データ消失」と区別できなくなる
- 症状: マイレッスンが 0 件表示。実際はインデックスのビルド中でクエリが失敗していただけ。
- 原因: `loadCustomLessons()` が `.catch(() => ({ docs: [] }))` でエラーを無言で捨てていた。
- 対策: フォールバックを残す場合でも `console.error` で必ず痕跡を残す。
- 関連: `src/firestore.ts` の `loadCustomLessons()`

## SpeechSynthesis: 発話していないときに cancel() を呼ばない
- 症状: 音声が出ない + `SpeechSynthesis error: canceled`
- 原因: `speak()` の前に無条件で `speechSynthesis.cancel()` を呼んでいた。
  キューが空の状態で `cancel()` すると、直後に予約した utterance が開始前に破棄され
  `onerror: 'canceled'` になる（Chrome）。
- 対策: `synth.speaking || synth.pending` のときだけ `cancel()` する。
  併せて以下も守る。
  - `synth.paused` なら `resume()` してから `speak()`（pause 状態だと無音になる）
  - utterance への参照を保持する（GC で発話が途中終了するブラウザバグ対策）
  - ボイスのキャッシュは `getVoices()` に現存するか毎回確認する
    （一覧は再生成されることがあり、古いボイス指定は発話失敗の原因になる）
  - `'interrupted'` と `'canceled'` は単語切り替え時に正常に発生するのでログを出さない
- 関連: `src/managers/AudioManager.ts` の `safeSpeek()` / `speakNow()`
