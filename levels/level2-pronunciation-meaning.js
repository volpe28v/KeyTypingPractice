// Lv2: 発音＋日本語モード
// 発音を聞き、日本語の意味を見てスペルを入力するモード

class PronunciationMeaningLevel {
    constructor(gameManager, audioManager, uiManager) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.name = 'pronunciation-meaning';
        this.displayName = 'Lv2: 発音＋日本語';
    }

    // 単語表示の初期化
    initializeWord(word, playAudio = true, clearInput = true) {
        if (clearInput) {
            this.uiManager.wordInput.value = '';
        }

        // 文字を隠して表示（●で隠す）
        this.uiManager.wordDisplay.textContent = '●'.repeat(word.word.length);
        this.uiManager.meaningDisplay.textContent = word.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        this.uiManager.wordInput.style.display = 'inline-block';

        // 発音を再生
        if (playAudio) {
            this.audioManager.speakWord(word.word);
        }

        // フィードバック表示
        this.uiManager.feedback.textContent = '発音と意味からスペルを入力してください';
        this.uiManager.feedback.className = 'feedback';
    }

    // リアルタイム表示更新
    updateDisplay() {
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
            this.gameManager.countMistake();
        }

        return isCorrect;
    }

    // リアルタイム入力チェック
    checkInputRealtime() {
        this.updateDisplay();
    }

    // 単語完了処理
    handleWordComplete() {
        return 'next_word';
    }

    // 発音再生機能
    replayAudio() {
        const currentWord = this.gameManager.getCurrentWord();
        if (currentWord && currentWord.word) {
            this.audioManager.speakWord(currentWord.word);
        }
    }
}

// グローバルアクセス用
window.PronunciationMeaningLevel = PronunciationMeaningLevel;