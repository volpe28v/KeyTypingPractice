// Lv3: 発音のみモード
// 発音だけを聞いてスペルを入力する最も難しいモード

import type { WordData } from '../types';

class PronunciationOnlyLevel {
    public gameManager: any;
    public audioManager: any;
    public uiManager: any;
    public name: string;
    public displayName: string;

    constructor(gameManager: any, audioManager: any, uiManager: any) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.name = 'pronunciation-only';
        this.displayName = 'Lv3: 発音のみ';
    }

    // 単語表示の初期化
    initializeWord(word: WordData, playAudio: boolean = true, clearInput: boolean = true): void {
        if (clearInput) {
            this.uiManager.wordInput.value = '';
        }

        // 文字と意味を完全に隠す
        this.uiManager.wordDisplay.textContent = '●'.repeat(word.word.length);
        this.uiManager.meaningDisplay.textContent = '';
        this.uiManager.meaningDisplay.style.display = 'none';
        this.uiManager.wordInput.style.display = 'inline-block';

        // Lv1の選択肢表示を非表示にする
        const hiddenLettersContainer = document.getElementById('hidden-letters-container');
        if (hiddenLettersContainer) {
            hiddenLettersContainer.style.display = 'none';
        }

        // 発音を再生
        if (playAudio) {
            this.audioManager.speakWord(word.word);
        }

        // フィードバック表示
        this.uiManager.feedback.textContent = '発音だけを頼りにスペルを入力してください';
        this.uiManager.feedback.className = 'feedback';
    }

    // リアルタイム表示更新
    updateDisplay(): void {
        // グローバル変数から直接現在の単語を取得（同期問題を回避）
        const globalWords = (window as any).words;
        const globalCurrentWordIndex = (window as any).currentWordIndex;
        const currentWord = globalWords && globalWords[globalCurrentWordIndex] ? globalWords[globalCurrentWordIndex].word : this.gameManager.getCurrentWord().word;
        const userInput = this.uiManager.wordInput.value.trim();
        let displayHTML = '';

        for (let i = 0; i < currentWord.length; i++) {
            if (i < userInput.length) {
                // 入力済み文字のみ表示
                if (userInput[i].toLowerCase() === currentWord[i].toLowerCase()) {
                    displayHTML += `<span class="correct-char">${currentWord[i]}</span>`;
                } else {
                    displayHTML += `<span class="incorrect-char">${currentWord[i]}</span>`;
                }
            } else {
                // 未入力文字（●で隠す）
                displayHTML += `<span class="hidden-char">●</span>`;
            }
        }

        this.uiManager.wordDisplay.innerHTML = displayHTML;
    }

    // キー入力バリデーション
    validateInput(e: KeyboardEvent, currentWord: WordData): boolean {
        // Backspaceキーの処理
        if (e.key === 'Backspace') {
            return true;
        }

        const currentPosition = this.uiManager.wordInput.value.length;
        
        if (currentPosition >= currentWord.word.length) {
            e.preventDefault();
            return false;
        }

        const expectedChar = currentWord.word[currentPosition].toLowerCase();
        const inputChar = e.key.toLowerCase();
        const isCorrect = expectedChar === inputChar;

        if (!isCorrect && e.key !== 'Shift') {
            this.gameManager.countMistake();
            
            // 発音のみモードではヒント表示しない（最高難易度のため）
        }

        return isCorrect;
    }

    // ヒント表示（ミス時の正解文字表示）
    showHint(word: WordData, position: number): void {
        const hintHTML = this.uiManager.wordDisplay.innerHTML;
        let tempHTML = '';
        
        for (let i = 0; i < word.word.length; i++) {
            if (i === position) {
                tempHTML += `<span class="hint-char">${word.word[i]}</span>`;
            } else if (i < this.uiManager.wordInput.value.length) {
                const userChar = this.uiManager.wordInput.value[i];
                if (userChar.toLowerCase() === word.word[i].toLowerCase()) {
                    tempHTML += `<span class="correct-char">${word.word[i]}</span>`;
                } else {
                    tempHTML += `<span class="incorrect-char">${word.word[i]}</span>`;
                }
            } else {
                tempHTML += `<span class="hidden-char">●</span>`;
            }
        }
        
        this.uiManager.wordDisplay.innerHTML = tempHTML;
        
        // 1秒後に元に戻す
        setTimeout(() => {
            this.updateDisplay();
        }, 1000);
    }

    // リアルタイム入力チェック
    checkInputRealtime(): void {
        this.updateDisplay();
    }

    // 単語完了処理
    handleWordComplete(): string {
        // 効果音を再生
        if (!this.gameManager.currentWordMistake) {
            this.audioManager.playCorrectSound("excellent");
        } else {
            this.audioManager.playCorrectSound("good");
        }
        
        // 完了時に正解を表示
        // グローバル変数から直接現在の単語を取得（同期問題を回避）
        const globalWords = (window as any).words;
        const globalCurrentWordIndex = (window as any).currentWordIndex;
        const currentWord = globalWords && globalWords[globalCurrentWordIndex] ? globalWords[globalCurrentWordIndex] : this.gameManager.getCurrentWord();
        this.uiManager.meaningDisplay.textContent = currentWord.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        
        setTimeout(() => {
            this.uiManager.meaningDisplay.style.display = 'none';
        }, 2000);
        
        return 'next_word';
    }

    // 発音再生機能
    replayAudio(): void {
        // グローバル変数から直接現在の単語を取得（同期問題を回避）
        const globalWords = (window as any).words;
        const globalCurrentWordIndex = (window as any).currentWordIndex;
        const currentWord = globalWords && globalWords[globalCurrentWordIndex] ? globalWords[globalCurrentWordIndex] : this.gameManager.getCurrentWord();
        if (currentWord && currentWord.word) {
            this.audioManager.speakWord(currentWord.word);
        }
    }
}

// Export for ES modules
export { PronunciationOnlyLevel };

// グローバルアクセス用
if (typeof window !== 'undefined') {
    (window as any).PronunciationOnlyLevel = PronunciationOnlyLevel;
}