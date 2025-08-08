// レベル管理クラス
// 各レベルクラスのインスタンス化と管理を行う

class LevelManager {
    constructor(gameManager, audioManager, uiManager) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.levels = {};
        this.currentLevel = null;
        
        this.initializeLevels();
    }

    // 全レベルクラスを初期化
    initializeLevels() {
        this.levels = {
            'vocabulary-learning': new VocabularyLearningLevel(this.gameManager, this.audioManager, this.uiManager),
            'progressive': new ProgressiveLearningLevel(this.gameManager, this.audioManager, this.uiManager),
            'pronunciation-meaning': new PronunciationMeaningLevel(this.gameManager, this.audioManager, this.uiManager),
            'pronunciation-only': new PronunciationOnlyLevel(this.gameManager, this.audioManager, this.uiManager),
            'japanese-reading': new JapaneseReadingLevel(this.gameManager, this.audioManager, this.uiManager)
        };
    }

    // レベルを設定
    setLevel(levelName) {
        if (this.levels[levelName]) {
            this.currentLevel = this.levels[levelName];
            return true;
        }
        console.warn(`Level '${levelName}' not found`);
        return false;
    }

    // 現在のレベルを取得
    getCurrentLevel() {
        return this.currentLevel;
    }

    // レベル名からレベル情報を取得
    getLevelInfo(levelName) {
        return this.levels[levelName] || null;
    }

    // 利用可能な全レベル名を取得
    getAvailableLevels() {
        return Object.keys(this.levels);
    }

    // レベル表示名を取得
    getLevelDisplayName(levelName) {
        const level = this.levels[levelName];
        return level ? level.displayName : levelName;
    }

    // 現在のレベルで単語を初期化
    initializeWord(word, playAudio = true, clearInput = true) {
        if (this.currentLevel) {
            return this.currentLevel.initializeWord(word, playAudio, clearInput);
        }
    }

    // 現在のレベルでキー入力を処理
    handleKeyInput(e, currentWord) {
        if (this.currentLevel && this.currentLevel.handleKeyInput) {
            return this.currentLevel.handleKeyInput(e, currentWord);
        }
        return false;
    }

    // 現在のレベルで入力バリデーション
    validateInput(e, currentWord) {
        if (this.currentLevel && this.currentLevel.validateInput) {
            return this.currentLevel.validateInput(e, currentWord);
        }
        return true;
    }

    // 現在のレベルでリアルタイム入力チェック
    checkInputRealtime() {
        if (this.currentLevel && this.currentLevel.checkInputRealtime) {
            return this.currentLevel.checkInputRealtime();
        }
    }

    // 現在のレベルで単語完了処理
    handleWordComplete() {
        if (this.currentLevel && this.currentLevel.handleWordComplete) {
            return this.currentLevel.handleWordComplete();
        }
        return 'next_word';
    }

    // 現在のレベルで音声再生
    replayAudio() {
        if (this.currentLevel && this.currentLevel.replayAudio) {
            return this.currentLevel.replayAudio();
        }
    }

    // 表示更新（現在のレベル用）
    updateDisplay() {
        if (this.currentLevel && this.currentLevel.updateDisplay) {
            return this.currentLevel.updateDisplay();
        }
    }
}

// グローバルアクセス用
window.LevelManager = LevelManager;