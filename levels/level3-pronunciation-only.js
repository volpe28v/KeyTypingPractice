// Lv3: 発音のみモード
// 発音だけを聞いてスペルを入力する最も難しいモード

class PronunciationOnlyLevel {
    constructor(gameManager, audioManager, uiManager) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.name = 'pronunciation-only';
        this.displayName = 'Lv3: 発音のみ';
    }

    // 単語表示の初期化
    initializeWord(word, playAudio = true, clearInput = true) {
        if (clearInput) {
            this.uiManager.wordInput.value = '';
        }

        // 文字と意味を完全に隠す
        this.uiManager.wordDisplay.textContent = '●'.repeat(word.word.length);
        this.uiManager.meaningDisplay.textContent = '';
        this.uiManager.meaningDisplay.style.display = 'none';
        this.uiManager.wordInput.style.display = 'inline-block';

        // 発音を再生
        if (playAudio) {
            this.audioManager.speakWord(word.word);
        }

        // フィードバック表示
        this.uiManager.feedback.textContent = '発音だけを頼りにスペルを入力してください';
        this.uiManager.feedback.className = 'feedback';
    }

    // リアルタイム表示更新
    updateDisplay() {
        const currentWord = this.gameManager.getCurrentWord().word;
        const userInput = this.uiManager.wordInput.value.trim();
        let displayHTML = '';

        for (let i = 0; i < currentWord.length; i++) {
            if (i < userInput.length) {
                // 入力済み文字のみ表示
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
            
            // ミス時は正しい文字をヒントとして短時間表示
            this.showHint(currentWord, currentPosition);
        }

        return isCorrect;
    }

    // ヒント表示（ミス時の正解文字表示）
    showHint(word, position) {
        const hintHTML = this.uiManager.wordDisplay.innerHTML;
        let tempHTML = '';
        
        for (let i = 0; i < word.length; i++) {
            if (i === position) {
                tempHTML += `<span class="hint-char">${word[i]}</span>`;
            } else if (i < this.uiManager.wordInput.value.length) {
                const userChar = this.uiManager.wordInput.value[i];
                if (userChar.toLowerCase() === word[i].toLowerCase()) {
                    tempHTML += `<span class="correct-char">${word[i]}</span>`;
                } else {
                    tempHTML += `<span class="incorrect-char">${word[i]}</span>`;
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

    // リアルタイム入力チェック
    checkInputRealtime() {
        this.updateDisplay();
    }

    // 単語完了処理
    handleWordComplete() {
        // 完了時に正解を表示
        const currentWord = this.gameManager.getCurrentWord();
        this.uiManager.meaningDisplay.textContent = currentWord.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        
        setTimeout(() => {
            this.uiManager.meaningDisplay.style.display = 'none';
        }, 2000);
        
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
window.PronunciationOnlyLevel = PronunciationOnlyLevel;