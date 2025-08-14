// Lv2: 発音＋日本語モード
// 発音を聞き、日本語の意味を見てスペルを入力するモード

import type { WordData } from '../types';
import type { GameManager } from '../managers/GameManager';
import type { AudioManager } from '../managers/AudioManager';
import type { UIManager } from '../managers/UIManager';
import { BaseLevel } from './BaseLevel';

class PronunciationMeaningLevel extends BaseLevel {
    constructor(gameManager: GameManager, audioManager: AudioManager, uiManager: UIManager) {
        super(gameManager, audioManager, uiManager, 'pronunciation-meaning', 'Lv2: 発音＋日本語');
    }

    // 単語表示の初期化
    initializeWord(word: WordData, playAudio: boolean = true, clearInput: boolean = true): void {
        if (clearInput) {
            this.uiManager.wordInput.value = '';
        }

        // 文字を隠して表示（●で隠す）
        this.uiManager.wordDisplay.textContent = '●'.repeat(word.word.length);
        this.uiManager.meaningDisplay.textContent = word.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
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
        this.uiManager.feedback.textContent = '発音と意味からスペルを入力してください';
        this.uiManager.feedback.className = 'feedback';
    }

    // リアルタイム表示更新
    updateDisplay(): void {
        // GameManagerから直接現在の単語を取得
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

    // ヒント表示（Lv2では使用しない）
    showHint(word: WordData, position: number): void {
        // Lv2では意味が表示されているためヒント不要
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

    // 発音再生機能（BaseLevel.replayAudioをオーバーライド）
    replayAudio(): void {
        const currentWord = this.gameManager.getCurrentWord();
        if (currentWord && currentWord.word) {
            this.audioManager.speakWord(currentWord.word);
        }
    }
}

// Export for ES modules
export { PronunciationMeaningLevel };

// グローバルアクセス用
if (typeof window !== 'undefined') {
    (window as any).PronunciationMeaningLevel = PronunciationMeaningLevel;
}