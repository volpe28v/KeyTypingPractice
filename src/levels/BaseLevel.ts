// BaseLevelクラス - 全レベルクラスの共通処理を提供
// Lv2-4で共通する処理を抽出した基底クラス

import type { WordData } from '../types';
import type { GameManager } from '../managers/GameManager';
import type { AudioManager } from '../managers/AudioManager';
import type { UIManager } from '../managers/UIManager';

export abstract class BaseLevel {
    public gameManager: GameManager;
    public audioManager: AudioManager;
    public uiManager: UIManager;
    public name: string;
    public displayName: string;

    constructor(gameManager: GameManager, audioManager: AudioManager, uiManager: UIManager, name: string, displayName: string) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.name = name;
        this.displayName = displayName;
    }

    // 抽象メソッド - 各レベルで実装必須
    abstract initializeWord(word: WordData, playAudio?: boolean, clearInput?: boolean): void;
    abstract updateDisplay(): void;
    
    // オプショナルメソッド（各レベルで必要に応じて実装）
    showHint?(word: WordData, position: number): void;

    // 共通入力検証メソッド
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
            this.gameManager.countMistake(null);
            this.handleMistake?.(currentWord, currentPosition);
        }

        return isCorrect;
    }

    // 共通ミス処理メソッド（オーバーライド可能）
    protected handleMistake?(currentWord: WordData, currentPosition: number): void {
        // デフォルトでは何もしない
        // 各レベルでヒント表示等の処理をオーバーライド
    }

    // 共通リアルタイム入力チェック
    checkInputRealtime(): void {
        // 各レベルでupdateDisplayを呼び出す
        this.updateDisplay();
    }

    // 共通単語完了処理の基盤メソッド
    protected baseHandleWordComplete(): void {
        // 基本的な完了処理
        this.uiManager.wordInput.value = '';
        this.gameManager.nextWord();
    }

    // 各レベル独自の完了処理
    abstract handleWordComplete(): void;

    // 共通音声再生メソッド
    protected playAudio(word: string): void {
        this.audioManager.speak(word);
    }

    // 共通リプレイメソッド（オーバーライド可能）
    replayAudio(): void {
        const currentWord = this.gameManager.getCurrentWord();
        if (currentWord) {
            this.playAudio(currentWord.word);
        }
    }

    // 共通クリーンアップメソッド（必要に応じてオーバーライド）
    cleanup?(): void {
        // デフォルトでは何もしない
    }
}