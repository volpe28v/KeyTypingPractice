// Lv4: 日本語のみモード
// 日本語の意味だけを見て英単語のスペルを入力するモード

import type { WordData } from '../types';
import type { GameManager } from '../managers/GameManager';
import type { AudioManager } from '../managers/AudioManager';
import type { UIManager } from '../managers/UIManager';
import { BaseLevel } from './BaseLevel';

class JapaneseReadingLevel extends BaseLevel {
    constructor(gameManager: GameManager, audioManager: AudioManager, uiManager: UIManager) {
        super(gameManager, audioManager, uiManager, 'japanese-reading', 'Lv4: 日本語のみ');
    }

    // 単語表示の初期化
    initializeWord(word: WordData, playAudio: boolean = true, clearInput: boolean = true): void {
        if (clearInput) {
            this.uiManager.wordInput.value = '';
        }

        // 英単語を隠して、日本語の意味のみ表示
        this.uiManager.wordDisplay.textContent = '●'.repeat(word.word.length);
        this.uiManager.meaningDisplay.textContent = word.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        this.uiManager.wordInput.style.display = 'inline-block';

        // Lv1の選択肢表示を非表示にする
        const hiddenLettersContainer = document.getElementById('hidden-letters-container');
        if (hiddenLettersContainer) {
            hiddenLettersContainer.style.display = 'none';
        }

        // 発音は再生しない（日本語のみモードのため）

        // フィードバック表示
        this.uiManager.feedback.textContent = '日本語の意味からスペルを推測して入力してください';
        this.uiManager.feedback.className = 'feedback';
    }

    // リアルタイム表示更新
    updateDisplay(): void {
        const currentWord = this.gameManager.getCurrentWord().word;
        const userInput = this.uiManager.wordInput.value.trim();
        let displayHTML = '';

        for (let i = 0; i < currentWord.length; i++) {
            if (i < userInput.length) {
                // 入力済み文字
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
        return 'next_word';
    }

    // 発音再生機能（日本語のみモードでは音声なし）
    replayAudio(): void {
        // 日本語のみモードでは発音なし
        console.log('日本語のみモードでは音声再生はありません');
    }
}

// Export for ES modules
export { JapaneseReadingLevel };

// グローバルアクセス用
if (typeof window !== 'undefined') {
    (window as any).JapaneseReadingLevel = JapaneseReadingLevel;
}