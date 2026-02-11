// Lv5: 発音のみ（文字数非表示）モード
// 発音だけを聞いてスペルを入力。文字数も隠されている最高難度モード

import type { WordData } from '../types';
import type { GameManager } from '../managers/GameManager';
import type { AudioManager } from '../managers/AudioManager';
import type { UIManager } from '../managers/UIManager';
import { BaseLevel } from './BaseLevel';

class PronunciationBlindLevel extends BaseLevel {
    private meaningDisplayTimer: NodeJS.Timeout | null = null;

    constructor(gameManager: GameManager, audioManager: AudioManager, uiManager: UIManager) {
        super(gameManager, audioManager, uiManager, 'pronunciation-blind', 'Lv5: 発音のみ（文字数非表示）');
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

        // 初期状態では透明な文字で高さを確保（文字数は隠す）
        // 透明なプレースホルダーで高さを維持
        this.uiManager.wordDisplay.innerHTML = '<span style="opacity: 0;">_</span>';
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
        this.uiManager.feedback.textContent = '発音を聞いてスペルを入力（文字数も不明）';
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
                    // 正解した文字だけ表示
                    displayHTML += `<span class="correct-char">${currentWord[i]}</span>`;
                } else {
                    // 間違った文字は赤で表示
                    displayHTML += `<span class="incorrect-char">${userInput[i]}</span>`;
                }
            } else {
                // 未入力の文字は何も表示しない（文字数を隠す）
                // 空のままにする
            }
        }

        // ユーザーが正解の文字数を超えて入力した場合、余分な文字を赤で表示
        if (userInput.length > currentWord.length) {
            for (let i = currentWord.length; i < userInput.length; i++) {
                displayHTML += `<span class="incorrect-char">${userInput[i]}</span>`;
            }
        }

        // 何も表示する文字がない場合は、透明なプレースホルダーで高さを維持
        if (displayHTML === '') {
            displayHTML = '<span style="opacity: 0;">_</span>';
        }

        this.uiManager.wordDisplay.innerHTML = displayHTML;
    }

    // ヒント表示（3回ミス後）
    showHint(word: WordData, position: number): void {
        // 3回ミスした位置のヒントとして意味を表示
        this.uiManager.meaningDisplay.textContent = word.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        this.uiManager.feedback.textContent = 'ヒント: 意味を表示しました';
        this.uiManager.feedback.className = 'feedback hint';

        // 5秒後に意味を非表示に戻す
        this.meaningDisplayTimer = setTimeout(() => {
            this.uiManager.meaningDisplay.style.display = 'none';
            this.uiManager.feedback.textContent = '発音を聞いてスペルを入力（文字数も不明）';
            this.uiManager.feedback.className = 'feedback';
        }, 5000);
    }

    // 単語完了処理
    handleWordComplete(): string {
        // タイマーをクリア
        if (this.meaningDisplayTimer) {
            clearTimeout(this.meaningDisplayTimer);
            this.meaningDisplayTimer = null;
        }

        // 効果音を再生
        if (!this.gameManager.currentWordMistake) {
            this.audioManager.playCorrectSound("excellent");
        } else {
            this.audioManager.playCorrectSound("good");
        }
        return 'next_word';
    }

    // クリーンアップ処理
    cleanup(): void {
        if (this.meaningDisplayTimer) {
            clearTimeout(this.meaningDisplayTimer);
            this.meaningDisplayTimer = null;
        }
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
export { PronunciationBlindLevel };

// グローバルアクセス用
if (typeof window !== 'undefined') {
    (window as any).PronunciationBlindLevel = PronunciationBlindLevel;
}