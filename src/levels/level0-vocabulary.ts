// Lv0: 単語学習モード
// 単語の意味を表示し、発音を聞きながら学習するモード

import type { WordData } from '../types';

class VocabularyLearningLevel {
    public gameManager: any;
    public audioManager: any;
    public uiManager: any;
    public name: string;
    public displayName: string;

    constructor(gameManager: any, audioManager: any, uiManager: any) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.name = 'vocabulary-learning';
        this.displayName = 'Lv0: 単語学習';
    }

    // 単語表示の初期化
    initializeWord(word: WordData, playAudio: boolean = true, clearInput: boolean = true): void {
        if (clearInput) {
            this.uiManager.wordInput.value = '';
        }

        // 単語を通常表示（spanで各文字を分割）
        this.uiManager.wordDisplay.innerHTML = word.word.split('').map(char => `<span>${char}</span>`).join('');
        
        // 意味を表示
        this.uiManager.meaningDisplay.textContent = word.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        
        // 入力フィールドを非表示
        this.uiManager.wordInput.style.display = 'none';

        // Lv1の選択肢表示を非表示にする
        const hiddenLettersContainer = document.getElementById('hidden-letters-container');
        if (hiddenLettersContainer) {
            hiddenLettersContainer.style.display = 'none';
        }

        // カウンターと状態をリセット
        this.gameManager.resetVocabularyLearning();

        // 発音を再生（最初は英語）
        if (playAudio) {
            // speakWord関数を使用（既存コードとの互換性保持）
            if (typeof (window as any).speakWord !== 'undefined') {
                (window as any).speakWord(word.word);
            } else {
                this.audioManager.speakWord(word.word);
            }
        }

        // フィードバック表示を更新
        this.uiManager.feedback.textContent = `Enter/Spaceで日本語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`;
        this.uiManager.feedback.className = 'feedback';
        
        // 進捗バーを更新（既存関数を呼び出し）
        if (typeof (window as any).updateProgressBar !== 'undefined') {
            (window as any).updateProgressBar();
        }
    }

    // キー入力ハンドラ（Enter/Spaceで音声切り替え）
    handleKeyInput(e: KeyboardEvent, currentWord: WordData): boolean | string {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            
            if (currentWord && currentWord.word) {
                if (!this.gameManager.vocabularyLearningIsJapanese) {
                    // 日本語を読み上げ
                    this.audioManager.speakJapanese(currentWord.meaning);
                    this.gameManager.vocabularyLearningIsJapanese = true;
                    this.uiManager.feedback.textContent = `Enter/Spaceで英語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`;
                } else {
                    // 英語を読み上げてカウントアップ
                    if (typeof (window as any).speakWord !== 'undefined') {
                        (window as any).speakWord(currentWord.word);
                    } else {
                        this.audioManager.speakWord(currentWord.word);
                    }
                    this.gameManager.vocabularyLearningIsJapanese = false;
                    this.gameManager.vocabularyLearningCount++;

                    // 規定回数に達したら次の単語へ
                    if (this.gameManager.vocabularyLearningCount >= this.gameManager.vocabularyLearningMaxCount) {
                        return 'next_word';
                    } else {
                        this.uiManager.feedback.textContent = `Enter/Spaceで日本語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`;
                    }
                }
            }
            return true;
        }
        return false;
    }

    // 入力バリデーション（このモードでは文字入力を無効化）
    validateInput(): boolean {
        return true; // 入力バリデーションをスキップ
    }

    // リアルタイム入力チェック（このモードでは不要）
    checkInputRealtime(): void {
        return;
    }

    // 単語完了処理（このモードでは自動的に次へ進む）
    handleWordComplete(): boolean {
        return false;
    }
}

// Export for ES modules
export { VocabularyLearningLevel };

// グローバルアクセス用
if (typeof window !== 'undefined') {
    (window as any).VocabularyLearningLevel = VocabularyLearningLevel;
}