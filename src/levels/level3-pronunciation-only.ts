// Lv3: 発音のみモード
// 発音だけを聞いてスペルを入力する最も難しいモード

import type { WordData } from '../types';
import type { GameManager } from '../managers/GameManager';
import type { AudioManager } from '../managers/AudioManager';
import type { UIManager } from '../managers/UIManager';
import { BaseLevel } from './BaseLevel';

class PronunciationOnlyLevel extends BaseLevel {
    private meaningDisplayTimer: NodeJS.Timeout | null = null;

    constructor(gameManager: GameManager, audioManager: AudioManager, uiManager: UIManager) {
        super(gameManager, audioManager, uiManager, 'pronunciation-only', 'Lv3: 発音のみ');
    }

    // 単語表示の初期化
    initializeWord(word: WordData, playAudio: boolean = true, clearInput: boolean = true): void {
        // 既存の意味表示タイマーをクリア
        if (this.meaningDisplayTimer) {
            clearTimeout(this.meaningDisplayTimer);
            this.meaningDisplayTimer = null;
        }
        
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
        const currentWord = this.gameManager.getCurrentWord().word;
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

    // 単語完了処理
    handleWordComplete(): string {
        // 効果音を再生
        if (!this.gameManager.currentWordMistake) {
            this.audioManager.playCorrectSound("excellent");
        } else {
            this.audioManager.playCorrectSound("good");
        }
        
        // 既存の意味表示タイマーをクリア
        if (this.meaningDisplayTimer) {
            clearTimeout(this.meaningDisplayTimer);
            this.meaningDisplayTimer = null;
        }
        
        // 完了時に正解を表示
        const currentWord = this.gameManager.getCurrentWord();
        this.uiManager.meaningDisplay.textContent = currentWord.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        
        // 管理されたタイマーで意味を非表示に
        this.meaningDisplayTimer = setTimeout(() => {
            this.uiManager.meaningDisplay.style.display = 'none';
            this.meaningDisplayTimer = null;
        }, 2000);
        
        return 'next_word';
    }

    // 発音再生機能（BaseLevel.replayAudioをオーバーライド）
    replayAudio(): void {
        const currentWord = this.gameManager.getCurrentWord();
        if (currentWord && currentWord.word) {
            this.audioManager.speakWord(currentWord.word);
        }
    }

    // クリーンアップ（ゲーム終了時にタイマーをクリア）
    cleanup(): void {
        if (this.meaningDisplayTimer) {
            clearTimeout(this.meaningDisplayTimer);
            this.meaningDisplayTimer = null;
        }
    }
}

// Export for ES modules
export { PronunciationOnlyLevel };

// グローバルアクセス用
if (typeof window !== 'undefined') {
    (window as any).PronunciationOnlyLevel = PronunciationOnlyLevel;
}