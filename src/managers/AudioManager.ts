/**
 * AudioManager - 音声関連機能を管理するクラス
 * タイピング音、ミスタイプ音、効果音、音声合成などを処理
 */
export class AudioManager {
    private audioContext: AudioContext | null = null;

    constructor() {
        this.audioContext = null;
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

    // 正解時に効果音を再生する関数
    playCorrectSound(word: string = "good"): void {

        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 1.2;
            utterance.pitch = 2.0;
            utterance.volume = 1.0;
            

            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('speechSynthesis not available');
        }
    }

    // 単語を発音する関数（英語）
    speakWord(word: string): void {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // 日本語を音声で読み上げる
    speakJapanese(text: string): void {
        if (!text || text.trim() === '') return;
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // speak関数（speakWordのエイリアス - 互換性のため）
    speak(word: string): void {
        this.speakWord(word);
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