// レベル管理クラス
// 各レベルクラスのインスタンス化と管理を行う

import { VocabularyLearningLevel } from './level0-vocabulary.ts';
import { ProgressiveLearningLevel } from './level1-progressive.ts';
import { PronunciationMeaningLevel } from './level2-pronunciation-meaning.ts';
import { PronunciationOnlyLevel } from './level3-pronunciation-only.ts';
import { JapaneseReadingLevel } from './level4-japanese-reading.ts';
import { PronunciationBlindLevel } from './level5-pronunciation-blind.ts';
import type { WordData } from '../types';
import type { GameManager } from '../managers/GameManager';
import type { AudioManager } from '../managers/AudioManager';
import type { UIManager } from '../managers/UIManager';

class LevelManager {
    public gameManager: GameManager;
    public audioManager: AudioManager;
    public uiManager: UIManager;
    public levels: any;
    public currentLevel: any;

    constructor(gameManager: GameManager, audioManager: AudioManager, uiManager: UIManager) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.levels = {};
        this.currentLevel = null;
        
        this.initializeLevels();
    }

    // 全レベルクラスを初期化
    initializeLevels(): void {
        this.levels = {
            'vocabulary-learning': new VocabularyLearningLevel(this.gameManager, this.audioManager, this.uiManager),
            'progressive': new ProgressiveLearningLevel(this.gameManager, this.audioManager, this.uiManager),
            'pronunciation-meaning': new PronunciationMeaningLevel(this.gameManager, this.audioManager, this.uiManager),
            'pronunciation-only': new PronunciationOnlyLevel(this.gameManager, this.audioManager, this.uiManager),
            'japanese-reading': new JapaneseReadingLevel(this.gameManager, this.audioManager, this.uiManager),
            'pronunciation-blind': new PronunciationBlindLevel(this.gameManager, this.audioManager, this.uiManager)
        };
    }

    // レベルを設定
    setLevel(levelName: string): boolean {
        if (this.levels[levelName]) {
            this.currentLevel = this.levels[levelName];
            return true;
        }
        console.warn(`Level '${levelName}' not found`);
        return false;
    }

    // 現在のレベルを取得
    getCurrentLevel(): any {
        return this.currentLevel;
    }

    // レベル名からレベル情報を取得
    getLevelInfo(levelName: string): any {
        return this.levels[levelName] || null;
    }

    // 利用可能な全レベル名を取得
    getAvailableLevels(): string[] {
        return Object.keys(this.levels);
    }

    // レベル表示名を取得
    getLevelDisplayName(levelName: string): string | null {
        const level = this.levels[levelName];
        return level ? level.displayName : levelName;
    }

    // 現在のレベルで単語を初期化
    initializeWord(word: WordData, playAudio: boolean = true, clearInput: boolean = true): void {
        if (this.currentLevel) {
            return this.currentLevel.initializeWord(word, playAudio, clearInput);
        }
    }

    // 現在のレベルでキー入力を処理
    handleKeyInput(e: KeyboardEvent, currentWord: WordData): boolean | string | undefined {
        if (this.currentLevel && this.currentLevel.handleKeyInput) {
            return this.currentLevel.handleKeyInput(e, currentWord);
        }
        return false;
    }

    // 現在のレベルで入力バリデーション
    validateInput(e: KeyboardEvent, currentWord: WordData): boolean {
        if (this.currentLevel && this.currentLevel.validateInput) {
            return this.currentLevel.validateInput(e, currentWord);
        }
        return true;
    }

    // 現在のレベルでリアルタイム入力チェック
    checkInputRealtime(): void {
        if (this.currentLevel && this.currentLevel.checkInputRealtime) {
            return this.currentLevel.checkInputRealtime();
        }
    }

    // 現在のレベルで単語完了処理
    handleWordComplete(): boolean | string | undefined {
        if (this.currentLevel && this.currentLevel.handleWordComplete) {
            return this.currentLevel.handleWordComplete();
        }
        return 'next_word';
    }

    // 現在のレベルで音声再生
    replayAudio(): void {
        if (this.currentLevel && this.currentLevel.replayAudio) {
            return this.currentLevel.replayAudio();
        }
    }

    // 表示更新（現在のレベル用）
    updateDisplay(): void {
        if (this.currentLevel && this.currentLevel.updateDisplay) {
            return this.currentLevel.updateDisplay();
        }
    }

    
    // クリーンアップ（ゲーム終了時の後処理）
    cleanup(): void {
        if (this.currentLevel && this.currentLevel.cleanup) {
            this.currentLevel.cleanup();
        }
    }
}

// Export for ES modules
export { LevelManager };

// グローバルアクセス用
if (typeof window !== 'undefined') {
    (window as any).LevelManager = LevelManager;
}