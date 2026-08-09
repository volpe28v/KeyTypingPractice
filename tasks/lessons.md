# Lessons

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
