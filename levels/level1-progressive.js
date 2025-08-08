// Lv1: 反復練習モード
// 徐々に文字を隠していく段階的練習モード

class ProgressiveLearningLevel {
    constructor(gameManager, audioManager, uiManager) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.name = 'progressive';
        this.displayName = 'Lv1: 反復練習';
    }

    // 単語表示の初期化
    initializeWord(word, playAudio = true, clearInput = true) {
        // 段階的練習モードの初期化
        this.gameManager.progressiveStep = 0;
        this.gameManager.maxProgressiveSteps = word.word.length;

        // 入力フィールドを確実にクリア（clearInputがtrueの場合のみ）
        if (clearInput) {
            this.uiManager.wordInput.value = '';
        }

        // 意味を表示
        this.uiManager.meaningDisplay.textContent = word.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        this.uiManager.wordInput.style.display = 'inline-block';

        // 発音を再生
        if (playAudio) {
            this.audioManager.speakEnglish(word.word);
        }

        // 初期表示を更新
        this.updateDisplay();

        // フィードバック表示
        this.uiManager.feedback.textContent = `ステップ ${this.gameManager.progressiveStep}/${this.gameManager.maxProgressiveSteps}`;
        this.uiManager.feedback.className = 'feedback';
    }

    // 段階的表示の更新
    updateDisplay() {
        const currentWord = this.gameManager.getCurrentWord().word;
        const userInput = this.uiManager.wordInput.value.trim();
        let displayHTML = '';

        // 表示する文字数を計算（全体 - 隠す文字数）
        const visibleCharCount = Math.max(0, currentWord.length - this.gameManager.progressiveStep);

        for (let i = 0; i < currentWord.length; i++) {
            if (i < userInput.length) {
                // 入力済み文字
                if (userInput[i].toLowerCase() === currentWord[i].toLowerCase()) {
                    displayHTML += `<span class="correct-char">${currentWord[i]}</span>`;
                } else {
                    displayHTML += `<span class="incorrect-char">${currentWord[i]}</span>`;
                }
            } else if (i < visibleCharCount) {
                // 未入力だが表示される文字
                displayHTML += `<span class="pending-char">${currentWord[i]}</span>`;
            } else {
                // 隠された文字
                displayHTML += `<span class="hidden-char">●</span>`;
            }
        }

        this.uiManager.wordDisplay.innerHTML = displayHTML;
    }

    // キー入力バリデーション
    validateInput(e, currentWord) {
        // Backspaceキーの処理
        if (e.key === 'Backspace') {
            return true;
        }

        const currentPosition = this.uiManager.wordInput.value.length;
        
        if (currentPosition >= currentWord.length) {
            e.preventDefault();
            return false;
        }

        const expectedChar = currentWord[currentPosition].toLowerCase();
        const inputChar = e.key.toLowerCase();
        const isCorrect = expectedChar === inputChar;

        if (!isCorrect && e.key !== 'Shift') {
            // 段階的練習モードの場合、表示されている文字のミスはカウントしない
            const visibleCharCount = Math.max(0, currentWord.length - this.gameManager.progressiveStep);
            
            // 隠されている文字でのミスのみカウント
            if (currentPosition >= visibleCharCount) {
                this.gameManager.countMistake();
                
                // 3回連続ミスで進捗を戻す
                if (this.gameManager.consecutiveMistakes >= 3) {
                    const mistakeCharPosition = currentPosition;
                    
                    // ミスした文字位置まで進捗を戻す
                    const newProgressiveStep = Math.max(0, currentWord.length - (mistakeCharPosition + 1));
                    this.gameManager.progressiveStep = newProgressiveStep;
                    
                    this.uiManager.feedback.textContent = `3回連続ミス！「${currentWord[mistakeCharPosition]}」の位置まで戻します`;
                    this.uiManager.feedback.className = 'feedback incorrect';
                    
                    setTimeout(() => {
                        this.uiManager.feedback.textContent = `ステップ ${this.gameManager.progressiveStep}/${this.gameManager.maxProgressiveSteps}`;
                        this.uiManager.feedback.className = 'feedback';
                    }, 2000);
                    
                    this.gameManager.resetConsecutiveMistakes();
                    this.updateDisplay();
                }
            }
        } else {
            this.gameManager.resetConsecutiveMistakes();
        }

        return isCorrect;
    }

    // リアルタイム入力チェック
    checkInputRealtime() {
        this.updateDisplay();
    }

    // 単語完了処理
    handleWordComplete() {
        // 段階を進める
        this.gameManager.progressiveStep++;
        
        if (this.gameManager.progressiveStep <= this.gameManager.maxProgressiveSteps) {
            // まだ段階が残っている場合は同じ単語を続行
            this.uiManager.wordInput.value = '';
            this.uiManager.feedback.textContent = `ステップ ${this.gameManager.progressiveStep}/${this.gameManager.maxProgressiveSteps} クリア！`;
            this.uiManager.feedback.className = 'feedback correct';
            
            setTimeout(() => {
                this.updateDisplay();
                this.uiManager.feedback.textContent = `ステップ ${this.gameManager.progressiveStep}/${this.gameManager.maxProgressiveSteps}`;
                this.uiManager.feedback.className = 'feedback';
            }, 1000);
            
            return 'continue_word';
        } else {
            // 全段階完了、次の単語へ
            this.gameManager.resetForNewWord();
            return 'next_word';
        }
    }
}

// グローバルアクセス用
window.ProgressiveLearningLevel = ProgressiveLearningLevel;