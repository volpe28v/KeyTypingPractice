// Lv4: 日本語のみモード
// 日本語の意味だけを見て英単語のスペルを入力するモード

class JapaneseReadingLevel {
    constructor(gameManager, audioManager, uiManager) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.name = 'japanese-reading';
        this.displayName = 'Lv4: 日本語のみ';
    }

    // 単語表示の初期化
    initializeWord(word, playAudio = true, clearInput = true) {
        if (clearInput) {
            this.uiManager.wordInput.value = '';
        }

        // 英単語を隠し、日本語の意味のみ表示
        this.uiManager.wordDisplay.textContent = '●'.repeat(word.word.length);
        this.uiManager.meaningDisplay.textContent = word.meaning;
        this.uiManager.meaningDisplay.style.display = 'block';
        this.uiManager.wordInput.style.display = 'inline-block';

        // Lv1の選択肢表示を非表示にする
        const hiddenLettersContainer = document.getElementById('hidden-letters-container');
        if (hiddenLettersContainer) {
            hiddenLettersContainer.style.display = 'none';
        }

        // 日本語を読み上げ
        if (playAudio) {
            this.audioManager.speakJapanese(word.meaning);
        }

        // フィードバック表示
        this.uiManager.feedback.textContent = '日本語の意味から英単語を入力してください';
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
            
            // 日本語のみモードではヒント表示しない（難易度維持のため）
        }

        return isCorrect;
    }

    // ヒント表示（ミス時の正解文字表示）
    showHint(word, position) {
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
        
        // 1.5秒後に元に戻す
        setTimeout(() => {
            this.updateDisplay();
        }, 1500);
    }

    // リアルタイム入力チェック
    checkInputRealtime() {
        this.updateDisplay();
    }

    // 単語完了処理
    handleWordComplete() {
        // 効果音を再生
        if (!this.gameManager.currentWordMistake) {
            this.audioManager.playCorrectSound("excellent");
        } else {
            this.audioManager.playCorrectSound("good");
        }
        
        // 完了時に英語の発音も再生
        const currentWord = this.gameManager.getCurrentWord();
        this.audioManager.speakWord(currentWord.word);
        
        return 'next_word';
    }

    // 音声再生機能（日本語読み上げ）
    replayAudio() {
        const currentWord = this.gameManager.getCurrentWord();
        if (currentWord && currentWord.meaning) {
            this.audioManager.speakJapanese(currentWord.meaning);
        }
    }
}

// Export for ES modules
export { JapaneseReadingLevel };

// グローバルアクセス用
if (typeof window !== 'undefined') {
    window.JapaneseReadingLevel = JapaneseReadingLevel;
}