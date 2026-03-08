/**
 * AudioManager - 音声関連機能を管理するクラス
 * タイピング音、ミスタイプ音、効果音、音声合成などを処理
 */
export class AudioManager {
    private audioContext: AudioContext | null = null;
    private speechTimerId: ReturnType<typeof setTimeout> | null = null;
    private cachedVoices: { [lang: string]: SpeechSynthesisVoice | null } = {};

    constructor() {
        this.audioContext = null;
        // ボイス一覧のロードを事前に開始
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                this.cachedVoices = {};
            });
        }
    }

    // 高品質ボイスを優先的に選択
    private getPreferredVoice(lang: string): SpeechSynthesisVoice | null {
        if (this.cachedVoices[lang] !== undefined) return this.cachedVoices[lang];

        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return null;

        const langPrefix = lang.split('-')[0];

        // 優先ボイスリスト（上から順に試す）
        const preferred: { [key: string]: string[] } = {
            'en': ['Google US English', 'Samantha', 'Karen', 'Daniel', 'Moira'],
            'ja': ['Google 日本語', 'Kyoko', 'Otoya'],
            'ms': ['Google Bahasa Melayu'],
        };

        const preferredNames = preferred[langPrefix] || [];
        for (const name of preferredNames) {
            const voice = voices.find(v => v.name === name);
            if (voice) {
                this.cachedVoices[lang] = voice;
                return voice;
            }
        }

        // フォールバック: 同じ言語のボイスから選択
        const fallback = voices.find(v => v.lang.startsWith(langPrefix)) || null;
        this.cachedVoices[lang] = fallback;
        return fallback;
    }

    // AudioContextの初期化（ユーザー操作後に実行）
    initAudioContext(): AudioContext | null {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error('Failed to create AudioContext:', e);
            }
        }
        // suspended 状態なら resume
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    // キータイピング音を再生する関数
    playTypingSound(): void {
        const ctx = this.initAudioContext();
        if (!ctx) return;
        
        try {
            const currentTime = ctx.currentTime;
            
            // メインのクリック音
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // 高音の短いクリック音（カシャという音）
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(4000, currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, currentTime + 0.005);
            
            // 音量の設定（短く鋭い音）
            gainNode.gain.setValueAtTime(0.15, currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.015);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.015);
            
            // 追加の低音成分
            const oscillator2 = ctx.createOscillator();
            const gainNode2 = ctx.createGain();
            
            oscillator2.connect(gainNode2);
            gainNode2.connect(ctx.destination);
            
            oscillator2.type = 'sine';
            oscillator2.frequency.setValueAtTime(200, currentTime);
            
            gainNode2.gain.setValueAtTime(0.05, currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.01);
            
            oscillator2.start(currentTime);
            oscillator2.stop(currentTime + 0.01);
        } catch (e) {
            console.error('Error playing typing sound:', e);
        }
    }

    // ミスタイプ音を再生する関数
    playMistypeSound(): void {
        const ctx = this.initAudioContext();
        if (!ctx) return;
        
        try {
            const currentTime = ctx.currentTime;
            
            // よりわかりやすい「ポン」という音
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // 中音域の「ポン」という音
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, currentTime + 0.08);
            
            // フィルターで音を丸くする
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, currentTime);
            
            // 音量設定（正解音より少し大きめでわかりやすく）
            gainNode.gain.setValueAtTime(0.2, currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.1);
            
            // 2つ目の音を追加（二重音でより特徴的に）
            const oscillator2 = ctx.createOscillator();
            const gainNode2 = ctx.createGain();
            
            oscillator2.connect(gainNode2);
            gainNode2.connect(ctx.destination);
            
            oscillator2.type = 'triangle';
            oscillator2.frequency.setValueAtTime(300, currentTime);
            oscillator2.frequency.exponentialRampToValueAtTime(150, currentTime + 0.08);
            
            gainNode2.gain.setValueAtTime(0.1, currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);
            
            oscillator2.start(currentTime);
            oscillator2.stop(currentTime + 0.08);
        } catch (e) {
            console.error('Error playing mistype sound:', e);
        }
    }

    // 安全な SpeechSynthesis ラッパー
    private safeSpeek(text: string, options: { lang: string; rate: number; pitch?: number; volume?: number }): void {
        if (!window.speechSynthesis) return;

        // 前回の予約をキャンセル（連続呼び出し時の競合防止）
        if (this.speechTimerId !== null) {
            clearTimeout(this.speechTimerId);
            this.speechTimerId = null;
        }

        window.speechSynthesis.cancel();

        // Chrome の既知バグ対策: cancel() 直後の speak() がスタックするため遅延を入れる
        this.speechTimerId = setTimeout(() => {
            this.speechTimerId = null;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = options.lang;
            utterance.rate = options.rate;
            if (options.pitch !== undefined) utterance.pitch = options.pitch;
            if (options.volume !== undefined) utterance.volume = options.volume;

            const voice = this.getPreferredVoice(options.lang);
            if (voice) utterance.voice = voice;

            utterance.onerror = (e) => {
                if (e.error !== 'interrupted') {
                    console.warn('SpeechSynthesis error:', e.error);
                }
            };

            window.speechSynthesis.speak(utterance);
        }, 100);
    }

    // 正解時に効果音を再生する関数
    playCorrectSound(type: string = "good"): void {
        const ctx = this.initAudioContext();
        if (!ctx) return;

        try {
            const currentTime = ctx.currentTime;

            if (type === "excellent") {
                // excellent: 明るい2音チャイム（ピンポン♪）
                const notes = [880, 1108.73]; // A5, C#6
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    const start = currentTime + i * 0.1;
                    osc.frequency.setValueAtTime(freq, start);
                    gain.gain.setValueAtTime(0, start);
                    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
                    osc.start(start);
                    osc.stop(start + 0.18);
                });
            } else {
                // good: 柔らかい単音チャイム（ポン♪）
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(784, currentTime); // G5
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(0.15, currentTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
                osc.start(currentTime);
                osc.stop(currentTime + 0.15);
            }
        } catch (e) {
            console.error('Error playing correct sound:', e);
        }
    }

    // 単語を発音する関数
    speakWord(word: string, lang: string = 'en-US'): void {
        this.safeSpeek(word, { lang, rate: 0.8 });
    }

    // 日本語を音声で読み上げる
    speakJapanese(text: string): void {
        if (!text || text.trim() === '') return;
        this.safeSpeek(text, { lang: 'ja-JP', rate: 0.9, pitch: 1.0 });
    }
    
    // speak関数（speakWordのエイリアス - 互換性のため）
    speak(word: string, lang: string = 'en-US'): void {
        this.speakWord(word, lang);
    }

    // 音声機能の手動リセット
    resetAudio(): void {
        // SpeechSynthesis 多段階リセット
        if (window.speechSynthesis) {
            // 1. キャンセルで既存キューをクリア
            window.speechSynthesis.cancel();

            // 2. ダミー発話でパイプラインをフラッシュ（Chrome のスタック解消）
            setTimeout(() => {
                const dummy = new SpeechSynthesisUtterance('');
                dummy.volume = 0;
                dummy.lang = 'en-US';
                window.speechSynthesis.speak(dummy);

                // 3. ダミー発話後にもう一度キャンセルしてクリーンな状態に
                setTimeout(() => {
                    window.speechSynthesis.cancel();
                }, 50);
            }, 100);
        }

        // AudioContext リセット（破棄して再作成）
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }
        // 新しい AudioContext を即時作成
        this.initAudioContext();
    }

    // パーフェクトクリア用お祝いサウンド（上昇アルペジオ）
    playCelebrationSound(): void {
        const ctx = this.initAudioContext();
        if (!ctx) return;

        try {
            const currentTime = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const noteDuration = 0.15;

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                const noteStart = currentTime + i * noteDuration;
                osc.frequency.setValueAtTime(freq, noteStart);

                gain.gain.setValueAtTime(0, noteStart);
                gain.gain.linearRampToValueAtTime(0.2, noteStart + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

                osc.start(noteStart);
                osc.stop(noteStart + noteDuration);
            });
        } catch (e) {
            console.error('Error playing celebration sound:', e);
        }
    }

    // 通常クリア用チャイム（2音）
    playClearSound(): void {
        const ctx = this.initAudioContext();
        if (!ctx) return;

        try {
            const currentTime = ctx.currentTime;
            const notes = [783.99, 1046.50]; // G5, C6
            const durations = [0.2, 0.2];

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'triangle';
                const noteStart = currentTime + i * 0.2;
                osc.frequency.setValueAtTime(freq, noteStart);

                gain.gain.setValueAtTime(0, noteStart);
                gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + durations[i]);

                osc.start(noteStart);
                osc.stop(noteStart + durations[i]);
            });
        } catch (e) {
            console.error('Error playing clear sound:', e);
        }
    }

    // コンボ時の短い「ポン！」（コンボ数でピッチ上昇）
    playComboSound(comboCount: number): void {
        const ctx = this.initAudioContext();
        if (!ctx) return;

        try {
            const currentTime = ctx.currentTime;
            const baseFreq = 600;
            const maxFreq = 1000;
            const freq = Math.min(baseFreq + (comboCount - 2) * 50, maxFreq);

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.2, currentTime + 0.08);

            gain.gain.setValueAtTime(0.15, currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.12);

            osc.start(currentTime);
            osc.stop(currentTime + 0.12);
        } catch (e) {
            console.error('Error playing combo sound:', e);
        }
    }
}