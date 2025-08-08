// Lv0: 単語学習モード
// 単語の意味を表示し、発音を聞きながら学習するモード

class VocabularyLearningLevel {
    constructor(gameManager, audioManager, uiManager) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.name = 'vocabulary-learning';
        this.displayName = 'Lv0: 単語学習';
    }

    // 単語表示の初期化
    initializeWord(word, playAudio = true, clearInput = true) {
        if (clearInput) {
            this.uiManager.wordInput.value = '';
        }

        // 意味のみ表示し、入力フィールドを非表示
        this.uiManager.wordDisplay.textContent = word.word;
        this.uiManager.meaningDisplay.textContent = word.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        this.uiManager.wordInput.style.display = 'none';

        // カウンターと状態をリセット
        this.gameManager.resetVocabularyLearning();

        // 発音を再生（最初は英語）
        if (playAudio) {
            this.audioManager.speakEnglish(word.word);
        }

        // フィードバック表示
        this.uiManager.feedback.textContent = `Enter/Spaceで日本語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`;
        this.uiManager.feedback.className = 'feedback';
    }

    // キー入力ハンドラ（Enter/Spaceで音声切り替え）
    handleKeyInput(e, currentWord) {
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
                    this.audioManager.speakEnglish(currentWord.word);
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
    validateInput() {
        return true; // 入力バリデーションをスキップ
    }

    // リアルタイム入力チェック（このモードでは不要）
    checkInputRealtime() {
        return;
    }

    // 単語完了処理（このモードでは自動的に次へ進む）
    handleWordComplete() {
        return false;
    }
}

// グローバルアクセス用
window.VocabularyLearningLevel = VocabularyLearningLevel;