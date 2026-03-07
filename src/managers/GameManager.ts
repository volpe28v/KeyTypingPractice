import type { WordData, LevelData } from '../types';
import type { AudioManager } from './AudioManager';
import type { StorageManager } from './StorageManager';

/**
 * GameManager - ゲーム状態とロジック管理クラス
 * タイピングゲームの進行、時間管理、段階的練習モードなどを処理
 */
export class GameManager {
    // Dependencies
    private audioManager: AudioManager;
    private storageManager: StorageManager;
    
    // Game state
    public words: WordData[] = [];
    public currentWordIndex: number = 0;
    public correctCount: number = 0;
    public mistakeCount: number = 0;
    public currentLevel: number = 10;
    public gameActive: boolean = true;
    public timerStarted: boolean = false;
    public startTime: number | null = null;
    public endTime: number | null = null;
    public timerInterval: NodeJS.Timeout | null = null;
    public currentWordMistake: boolean = false;
    
    // Progressive mode properties
    public progressiveStep: number = 0;
    public maxProgressiveSteps: number = 0;
    public consecutiveMistakes: number = 0;
    public currentCharPosition: number = 0;
    public positionMistakes: Map<number, number> = new Map();
    
    // Custom lesson properties
    public isCustomLesson: boolean = false;
    public lessonMode: string = 'full';
    public currentLessonIndex: number = 0;
    
    // Vocabulary learning mode properties
    public vocabularyLearningCount: number = 0;
    public vocabularyLearningMaxCount: number = 5;
    public vocabularyLearningIsJapanese: boolean = false;
    
    // Combo properties
    public comboCount: number = 0;
    public maxCombo: number = 0;

    // Hidden letter selection properties
    public hiddenLetters: string[] = [];
    public shuffledChoices: string[] = [];
    public playerSequence: string[] = [];
    public currentChoiceIndex: number = 0;
    public lastShuffledStep: number = -1;

    constructor(audioManager: AudioManager, storageManager: StorageManager) {
        this.audioManager = audioManager;
        this.storageManager = storageManager;
        
        // ゲーム状態
        this.words = [];
        this.currentWordIndex = 0;
        this.correctCount = 0;
        this.mistakeCount = 0;
        this.currentLevel = 10;
        this.gameActive = true;
        this.timerStarted = false;
        this.startTime = null;
        this.endTime = null;
        this.timerInterval = null;
        this.currentWordMistake = false;
        
        // 段階的練習モード関連
        this.progressiveStep = 0;
        this.maxProgressiveSteps = 0;
        this.consecutiveMistakes = 0;
        this.currentCharPosition = 0;
        this.positionMistakes = new Map();
        
        // カスタムレッスン関連
        this.isCustomLesson = false;
        this.lessonMode = 'full';
        this.currentLessonIndex = 0;
        
        // Lv0: 単語学習モード関連
        this.vocabularyLearningCount = 0;
        this.vocabularyLearningMaxCount = 5;
        this.vocabularyLearningIsJapanese = false;
        
        // コンボ関連
        this.comboCount = 0;
        this.maxCombo = 0;

        // 隠れた文字選択機能関連
        this.hiddenLetters = [];
        this.shuffledChoices = [];
        this.playerSequence = [];
        this.currentChoiceIndex = 0;
        this.lastShuffledStep = -1; // 最後にシャッフルした段階を記録
    }
    
    // スマート引用符をASCII引用符に正規化
    private normalizeQuotes(text: string): string {
        return text
            .replace(/[\u2018\u2019\u02BC]/g, "'")  // ' ' ʼ → '
            .replace(/[\u201C\u201D]/g, '"');         // " " → "
    }

    // ゲームを初期化
    initGame(levelLists: LevelData[], customWords: WordData[] | null = null): void {
        if (!this.isCustomLesson) {
            const levelData = levelLists.find((level: LevelData) => level.level === this.currentLevel);
            if (levelData) {
                const fullWordList = [...levelData.words];
                this.shuffleArray(fullWordList);
                this.words = fullWordList.slice(0, 10);
            }
        } else {
            this.words = customWords || [];
            this.shuffleArray(this.words);
        }

        // スマート引用符を正規化
        this.words = this.words.map(w => ({
            ...w,
            word: this.normalizeQuotes(w.word)
        }));
        
        this.currentWordIndex = 0;
        this.correctCount = 0;
        this.mistakeCount = 0;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.gameActive = true;
        this.timerStarted = false;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // 配列をシャッフル
    shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 現在の単語を取得
    getCurrentWord(): WordData | null {
        if (this.currentWordIndex < this.words.length) {
            return this.words[this.currentWordIndex];
        }
        return null;
    }
    
    // 次の単語へ進む
    nextWord(): void {
        console.log('🔍 GameManager.nextWord() called - before increment:', this.currentWordIndex);
        this.currentWordIndex++;
        console.log('🔍 GameManager.nextWord() called - after increment:', this.currentWordIndex);
    }
    
    // ゲームが終了したかチェック
    isGameComplete(): boolean {
        return this.currentWordIndex >= this.words.length;
    }
    
    // タイマーを開始
    startTimer(): number {
        this.startTime = Date.now();
        this.timerStarted = true;
        return this.startTime;
    }
    
    // ゲームを終了
    endGame(): number {
        this.endTime = Date.now();
        this.gameActive = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        return this.endTime - (this.startTime || 0);
    }
    
    // 段階的練習モードの初期化
    initProgressiveMode(): void {
        this.progressiveStep = 0;
    }
    
    // 段階的練習モードを進める
    advanceProgressiveStep(): void {
        this.progressiveStep++;
        // 文字選択状態をリセット
        this.resetLetterSelection();
    }
    
    // ミスをカウント（段階的練習モードの特別処理を含む）
    countMistake(visibleCharCount: number | null): void {
        if (this.isCustomLesson && this.lessonMode === 'progressive' && visibleCharCount !== null) {
            // 段階的練習モードの場合、表示されている文字のミスはカウントしない
            // 実際には隠れた部分のミス処理を既存のロジックに任せる
        }
        
        (window as any).mistakeCount++;
        (window as any).currentWordMistake = true;  // ミス状態フラグを設定
        
        if (this.isCustomLesson && this.lessonMode === 'progressive') {
            this.consecutiveMistakes++;
            
            // 3回連続ミスで進捗を戻す
            if (this.consecutiveMistakes >= 3) {
                this.handleConsecutiveMistake();
            }
        }
    }
    
    // 段階的練習モード専用のミスカウント（consecutiveMistakesを増やさない）
    countMistakeForProgressive(): void {
        (window as any).mistakeCount++;
        (window as any).currentWordMistake = true;  // ミス状態フラグを設定
    }
    
    // 連続ミスの処理
    handleConsecutiveMistake(): void {
        // 進捗を戻す処理
        const newProgressiveStep = Math.min(this.progressiveStep + 2, this.getCurrentWord()!.word.length);
        this.revertProgress(newProgressiveStep);
    }
    
    // 文字位置ごとのミスをカウント（段階的練習モード用）
    countPositionMistake(position: number): boolean {
        const currentCount = this.positionMistakes.get(position) || 0;
        this.positionMistakes.set(position, currentCount + 1);
        
        // 同じ位置で3回ミスしたら進捗を戻す
        if (currentCount + 1 >= 3) {
            this.handlePositionMistake(position);
            return true; // 進捗を戻したことを通知
        }
        return false;
    }
    
    // 文字位置でのミス処理
    handlePositionMistake(position: number): void {
        // ミスした文字位置まで段階を戻す計算
        // position: ミスした文字の位置（0から開始）
        // 例: "hello"でposition=2('l')でミス → progressiveStep = 5-2-1 = 2（'l'まで表示）
        const currentWord = this.getCurrentWord();
        if (currentWord) {
            const newProgressiveStep = Math.max(0, currentWord.word.length - (position + 1));
            this.revertProgress(newProgressiveStep);
        }
        
        // その位置のミスカウントをリセット
        this.positionMistakes.set(position, 0);
    }
    
    // 進捗を戻す（段階的練習モード）
    revertProgress(newProgressiveStep: number): void {
        this.progressiveStep = newProgressiveStep;
    }
    
    // 連続ミスをリセット
    resetConsecutiveMistakes(): void {
        this.consecutiveMistakes = 0;
    }
    
    // 新しい単語用のリセット
    resetForNewWord(): void {
        (window as any).currentWordMistake = false;
        if (this.isCustomLesson && this.lessonMode === 'progressive') {
            this.consecutiveMistakes = 0;
            this.currentCharPosition = 0;
            this.positionMistakes.clear(); // 文字位置ごとのミスカウントをリセット
            // 隠れた文字選択もリセット
            this.resetLetterSelection();
            this.lastShuffledStep = -1;
        }
    }
    
    // Lv0: 単語学習モード用のリセット
    resetVocabularyLearning(): void {
        this.vocabularyLearningCount = 0;
        this.vocabularyLearningIsJapanese = false;
    }

    // コンボを更新（単語完了時に呼ぶ）
    updateCombo(): number {
        if (!this.currentWordMistake) {
            this.comboCount++;
            if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
        } else {
            this.comboCount = 0;
        }
        return this.comboCount;
    }

    // 隠れた文字選択機能の初期化
    initHiddenLetterChoices(word: string, visibleLength: number): void {
        this.hiddenLetters = word.slice(visibleLength).split('');
        this.shuffledChoices = [...this.hiddenLetters];
        this.shuffleArray(this.shuffledChoices);
        this.playerSequence = [];
        this.currentChoiceIndex = 0;
    }
    
    // 文字選択の処理
    selectLetter(letter: string): boolean {
        if (this.currentChoiceIndex >= this.hiddenLetters.length) {
            return false; // すでに全て選択済み
        }
        
        const correctLetter = this.hiddenLetters[this.currentChoiceIndex];
        if (letter === correctLetter) {
            this.playerSequence.push(letter);
            this.currentChoiceIndex++;
            return true; // 正解
        }
        return false; // 不正解
    }
    
    // 選択をリセット
    resetLetterSelection(): void {
        this.playerSequence = [];
        this.currentChoiceIndex = 0;
    }
    
    // 全ての文字が正しく選択されたかチェック
    isLetterSelectionComplete(): boolean {
        return this.currentChoiceIndex >= this.hiddenLetters.length;
    }
}