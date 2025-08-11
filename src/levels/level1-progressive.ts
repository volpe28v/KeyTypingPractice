// Lv1: 反復練習モード
// 徐々に文字を隠していく段階的練習モード

import type { WordData } from '../types';

class ProgressiveLearningLevel {
    public gameManager: any;
    public audioManager: any;
    public uiManager: any;
    public name: string;
    public displayName: string;

    constructor(gameManager: any, audioManager: any, uiManager: any) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.name = 'progressive';
        this.displayName = 'Lv1: 反復練習';
    }

    // 単語表示の初期化
    initializeWord(word: WordData, playAudio: boolean = true, clearInput: boolean = true): void {
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
            this.audioManager.speakWord(word.word);
        }

        // 初期表示を更新
        this.updateDisplay();

        // フィードバック表示
        this.uiManager.feedback.textContent = `ステップ ${this.gameManager.progressiveStep}/${this.gameManager.maxProgressiveSteps}`;
        this.uiManager.feedback.className = 'feedback';
    }

    // 段階的表示の更新（script.jsのupdateProgressiveDisplay()と統合）
    updateDisplay(): void {
        const currentWord = this.gameManager.getCurrentWord().word;
        const userInput = this.uiManager.wordInput.value.trim();
        let displayHTML = '';
        
        // 表示する文字数を計算（全体 - 隠す文字数）
        const visibleCharCount = Math.max(0, currentWord.length - this.gameManager.progressiveStep);
        
        // 入力でエラーがあるかチェック
        let firstErrorIndex = -1;
        for (let i = 0; i < userInput.length; i++) {
            if (i >= currentWord.length || userInput[i].toLowerCase() !== currentWord[i].toLowerCase()) {
                firstErrorIndex = i;
                break;
            }
        }
        
        for (let i = 0; i < currentWord.length; i++) {
            if (i < visibleCharCount) {
                // 常に表示する部分（入力に応じてスタイル変更）
                if (i < userInput.length) {
                    if (firstErrorIndex !== -1 && i >= firstErrorIndex) {
                        if (i === firstErrorIndex) {
                            displayHTML += `<span class="incorrect-char">${currentWord[i]}</span>`;
                        } else {
                            displayHTML += `<span>${currentWord[i]}</span>`;
                        }
                    } else {
                        displayHTML += `<span class="correct-char">${currentWord[i]}</span>`;
                    }
                } else {
                    displayHTML += `<span>${currentWord[i]}</span>`;
                }
            } else {
                // 隠し部分
                if (i < userInput.length) {
                    // 入力済みの文字は隠し部分でも表示
                    if (firstErrorIndex !== -1 && i >= firstErrorIndex) {
                        if (i === firstErrorIndex) {
                            displayHTML += `<span class="incorrect-char">${currentWord[i]}</span>`;
                        } else {
                            displayHTML += '<span style="color: #666;">●</span>';
                        }
                    } else {
                        // 正解の文字は緑色で表示
                        displayHTML += `<span class="correct-char">${currentWord[i]}</span>`;
                    }
                } else {
                    // 未入力の文字は黒丸
                    displayHTML += '<span style="color: #666;">●</span>';
                }
            }
        }

        this.uiManager.wordDisplay.innerHTML = displayHTML;
        
        // 隠れた文字選択の表示を更新
        this.displayHiddenLetterChoices();
        
        // キーボード入力に対応する選択肢ボタンの状態を更新
        this.updateLetterChoiceButtons(userInput, currentWord);
    }

    // キー入力バリデーション
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
            // 段階的練習モードの場合、表示されている文字のミスはカウントしない
            const visibleCharCount = Math.max(0, currentWord.word.length - this.gameManager.progressiveStep);
            
            // 隠されている文字でのミスのみカウント
            if (currentPosition >= visibleCharCount) {
                this.gameManager.countMistake();
                
                // 3回連続ミスで進捗を戻す
                if (this.gameManager.consecutiveMistakes >= 3) {
                    const mistakeCharPosition = currentPosition;
                    
                    // ミスした文字位置まで進捗を戻す
                    const newProgressiveStep = Math.max(0, currentWord.word.length - (mistakeCharPosition + 1));
                    this.gameManager.progressiveStep = newProgressiveStep;
                    
                    this.uiManager.feedback.textContent = `3回連続ミス！「${currentWord.word[mistakeCharPosition]}」の位置まで戻します`;
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
    checkInputRealtime(): void {
        this.updateDisplay();
    }

    // 単語完了処理
    handleWordComplete(): boolean | string {
        // 段階を進める
        this.gameManager.progressiveStep++;
        
        if (this.gameManager.progressiveStep <= this.gameManager.maxProgressiveSteps) {
            // まだ段階が残っている場合は同じ単語を続行
            this.uiManager.wordInput.value = '';
            this.uiManager.feedback.textContent = `ステップ ${this.gameManager.progressiveStep}/${this.gameManager.maxProgressiveSteps} クリア！`;
            this.uiManager.feedback.className = 'feedback correct';
            
            // 正解効果音を再生
            const currentWord = this.gameManager.getCurrentWord();
            if (!this.gameManager.currentWordMistake) {
                this.audioManager.playCorrectSound("excellent");
            } else {
                this.audioManager.playCorrectSound("good");
            }
            
            setTimeout(() => {
                this.updateDisplay();
                this.uiManager.feedback.textContent = `ステップ ${this.gameManager.progressiveStep}/${this.gameManager.maxProgressiveSteps}`;
                this.uiManager.feedback.className = 'feedback';
                
                // 段階が変わったらミス状態をリセット（新しい段階として扱う）
                this.gameManager.currentWordMistake = false;
                
                // 段階が変わったら発音
                this.audioManager.speakWord(currentWord.word);
            }, 1000);
            
            return 'continue_word';
        } else {
            // 全段階完了、次の単語へ
            this.uiManager.feedback.textContent = 'Complete!';
            this.uiManager.feedback.className = 'feedback correct';
            
            // 正解効果音を再生
            const currentWord = this.gameManager.getCurrentWord();
            if (!this.gameManager.currentWordMistake) {
                this.audioManager.playCorrectSound("excellent");
            } else {
                this.audioManager.playCorrectSound("good");
            }
            
            // 入力フィールドを一時無効化
            this.uiManager.wordInput.disabled = true;
            
            // 遅延後に入力フィールドを再有効化
            setTimeout(() => {
                this.uiManager.wordInput.disabled = false;
                this.uiManager.wordInput.focus();
            }, 1500);
            
            this.gameManager.resetForNewWord();
            return 'next_word';
        }
    }
    
    // 隠れた文字選択の表示（script.jsのdisplayHiddenLetterChoices()と統合）
    displayHiddenLetterChoices(): void {
        const container = document.getElementById('hidden-letters-container');
        const lettersDiv = document.getElementById('hidden-letters');
        
        if (!this.gameManager.isCustomLesson || this.gameManager.lessonMode !== 'progressive') {
            container.style.display = 'none';
            return;
        }
        
        const currentWord = this.gameManager.getCurrentWord();
        const visibleCharCount = Math.max(0, currentWord.word.length - this.gameManager.progressiveStep);
        
        // 1文字以上隠れている場合に表示
        const hiddenCharCount = this.gameManager.progressiveStep;
        if (hiddenCharCount < 1) {
            container.style.display = 'none';
            return;
        }
        
        // 段階が変わった場合のみ選択肢を初期化
        if (this.gameManager.lastShuffledStep !== this.gameManager.progressiveStep) {
            // 確実に文字列を渡すため、型チェックを追加
            const wordString = typeof currentWord === 'string' ? currentWord : currentWord.word;
            this.gameManager.initHiddenLetterChoices(wordString, visibleCharCount);
            this.gameManager.lastShuffledStep = this.gameManager.progressiveStep;
        }
        
        container.style.display = 'block';
        lettersDiv.innerHTML = '';
        
        // シャッフルされた文字ボタンを作成
        this.gameManager.shuffledChoices.forEach((letter, index) => {
            const button = document.createElement('button');
            button.className = 'letter-choice';
            button.textContent = letter;
            button.dataset.letter = letter;
            
            // 既にプレイヤーが選択済みの文字かチェック（同じ文字の選択回数を考慮）
            const selectedCount = this.gameManager.playerSequence.filter(selectedLetter => selectedLetter === letter).length;
            const totalCount = this.gameManager.shuffledChoices.filter(choiceLetter => choiceLetter === letter).length;
            const currentInstanceIndex = this.gameManager.shuffledChoices.slice(0, index).filter(choiceLetter => choiceLetter === letter).length;
            
            if (currentInstanceIndex < selectedCount) {
                button.classList.add('selected');
                button.disabled = true;
                button.classList.add('disabled');
            }
            
            lettersDiv.appendChild(button);
        });
    }
    
    // 選択肢ボタンの状態を更新（script.jsのupdateLetterChoiceButtons()と統合）
    updateLetterChoiceButtons(userInput: string, currentWord: string): void {
        if (!this.gameManager.isCustomLesson || this.gameManager.lessonMode !== 'progressive') {
            return;
        }
        
        const visibleCharCount = Math.max(0, currentWord.length - this.gameManager.progressiveStep);
        const hiddenStartIndex = visibleCharCount;
        
        // 隠れた部分の入力文字をチェック
        const hiddenInputPart = userInput.slice(hiddenStartIndex);
        
        // 選択肢ボタンを取得
        const letterButtons = document.querySelectorAll('.letter-choice');
        
        // hiddenLettersが初期化されていない場合は処理しない
        if (!this.gameManager.hiddenLetters || this.gameManager.hiddenLetters.length === 0) {
            return;
        }
        
        // 入力された隠れた文字に対応するボタンを緑色にする
        hiddenInputPart.split('').forEach((inputChar, index) => {
            const expectedChar = this.gameManager.hiddenLetters[index];
            
            // expectedCharが存在し、かつ文字列である場合のみ処理
            if (expectedChar && inputChar && inputChar.toLowerCase() === expectedChar.toLowerCase()) {
                // 対応するボタンを一つだけ見つけて緑色にする
                const availableButton = Array.from(letterButtons).find(button => 
                    (button as HTMLButtonElement).dataset.letter === expectedChar && 
                    !button.classList.contains('selected') && 
                    !(button as HTMLButtonElement).disabled
                );
                
                if (availableButton) {
                    availableButton.classList.add('selected');
                    (availableButton as HTMLButtonElement).disabled = true;
                    availableButton.classList.add('disabled');
                }
            }
        });
    }
}

// Export for ES modules
export { ProgressiveLearningLevel };

// グローバルアクセス用
if (typeof window !== 'undefined') {
    (window as any).ProgressiveLearningLevel = ProgressiveLearningLevel;
}