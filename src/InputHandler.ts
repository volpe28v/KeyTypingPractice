import type { GameManager } from './managers/GameManager';
import type { UIManager } from './managers/UIManager';
import type { AudioManager } from './managers/AudioManager';
import type { KeyboardManager } from './managers/KeyboardManager';
import type { LevelManager } from './levels/level-manager';

/**
 * InputHandler - 入力処理クラス
 * キー入力のバリデーション、リアルタイムチェック、段階的表示更新を処理
 */
export class InputHandler {
    private gameManager: GameManager;
    private uiManager: UIManager;
    private audioManager: AudioManager;
    private keyboardManager: KeyboardManager;
    private levelManager: LevelManager | null = null;
    private scheduleNextWordFn: ((delay: number) => void) | null = null;

    constructor(
        gameManager: GameManager,
        uiManager: UIManager,
        audioManager: AudioManager,
        keyboardManager: KeyboardManager,
    ) {
        this.gameManager = gameManager;
        this.uiManager = uiManager;
        this.audioManager = audioManager;
        this.keyboardManager = keyboardManager;
    }

    setLevelManager(levelManager: LevelManager | null): void {
        this.levelManager = levelManager;
    }

    setScheduleNextWord(fn: (delay: number) => void): void {
        this.scheduleNextWordFn = fn;
    }

    displayHiddenLetterChoices(): void {
        const container = document.getElementById('hidden-letters-container');
        const lettersDiv = document.getElementById('hidden-letters');

        if (!this.gameManager.isCustomLesson || this.gameManager.lessonMode !== 'progressive') {
            if (container) container.style.display = 'none';
            return;
        }

        const currentWord = this.gameManager.getCurrentWord();
        if (!currentWord) return;

        const visibleCharCount = Math.max(0, currentWord.word.length - this.gameManager.progressiveStep);
        const hiddenCharCount = this.gameManager.progressiveStep;

        if (hiddenCharCount < 1) {
            if (container) container.style.display = 'none';
            return;
        }

        if (this.gameManager.lastShuffledStep !== this.gameManager.progressiveStep) {
            this.gameManager.initHiddenLetterChoices(currentWord.word, visibleCharCount);
            this.gameManager.lastShuffledStep = this.gameManager.progressiveStep;
        }

        if (container) container.style.display = 'block';
        if (lettersDiv) lettersDiv.innerHTML = '';

        this.gameManager.shuffledChoices.forEach((letter, index) => {
            const button = document.createElement('button');
            button.className = 'letter-choice';
            button.textContent = letter;
            button.dataset.letter = letter;

            const selectedCount = this.gameManager.playerSequence.filter(s => s === letter).length;
            const currentInstanceIndex = this.gameManager.shuffledChoices.slice(0, index).filter(c => c === letter).length;

            if (currentInstanceIndex < selectedCount) {
                button.classList.add('selected');
                button.disabled = true;
                button.classList.add('disabled');
            }

            if (lettersDiv) lettersDiv.appendChild(button);
        });
    }

    updateLetterChoiceButtons(userInput: string, currentWord: string): void {
        if (!this.gameManager.isCustomLesson || this.gameManager.lessonMode !== 'progressive') {
            return;
        }

        const visibleCharCount = Math.max(0, currentWord.length - this.gameManager.progressiveStep);
        const hiddenStartIndex = visibleCharCount;
        const hiddenInputPart = userInput.slice(hiddenStartIndex);
        const letterButtons = document.querySelectorAll('.letter-choice');

        if (!this.gameManager.hiddenLetters || this.gameManager.hiddenLetters.length === 0) {
            return;
        }

        hiddenInputPart.split('').forEach((inputChar, index) => {
            const expectedChar = this.gameManager.hiddenLetters[index];

            if (expectedChar && inputChar && inputChar.toLowerCase() === expectedChar.toLowerCase()) {
                const availableButton = Array.from(letterButtons).find((button) => {
                    const element = button as HTMLElement;
                    return element.dataset.letter === expectedChar &&
                           !element.classList.contains('selected') &&
                           !(element as HTMLButtonElement).disabled;
                }) as HTMLElement;

                if (availableButton) {
                    availableButton.classList.add('selected');
                    (availableButton as HTMLButtonElement).disabled = true;
                    availableButton.classList.add('disabled');
                }
            }
        });
    }

    updateProgressiveDisplay(): void {
        const currentWord = this.gameManager.words[this.gameManager.currentWordIndex].word;
        const userInput = this.uiManager.wordInput!.value.trim();
        let displayHTML = '';

        const visibleCharCount = Math.max(0, currentWord.length - this.gameManager.progressiveStep);

        let firstErrorIndex = -1;
        for (let i = 0; i < userInput.length; i++) {
            if (i >= currentWord.length || userInput[i].toLowerCase() !== currentWord[i].toLowerCase()) {
                firstErrorIndex = i;
                break;
            }
        }

        for (let i = 0; i < currentWord.length; i++) {
            if (i < visibleCharCount) {
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
                if (i < userInput.length) {
                    if (firstErrorIndex !== -1 && i >= firstErrorIndex) {
                        if (i === firstErrorIndex) {
                            displayHTML += `<span class="incorrect-char">${currentWord[i]}</span>`;
                        } else {
                            displayHTML += '<span style="color: #666;">●</span>';
                        }
                    } else {
                        displayHTML += `<span class="correct-char">${currentWord[i]}</span>`;
                    }
                } else {
                    displayHTML += '<span style="color: #666;">●</span>';
                }
            }
        }

        this.uiManager.wordDisplay!.innerHTML = displayHTML;
        this.displayHiddenLetterChoices();
        this.updateLetterChoiceButtons(userInput, currentWord);
    }

    updatePartialWordDisplay(): void {
        if (!this.gameManager.isCustomLesson || this.gameManager.lessonMode === 'full') {
            return;
        }

        if (this.gameManager.lessonMode === 'progressive') {
            this.updateProgressiveDisplay();
            return;
        }

        const currentWord = this.gameManager.words[this.gameManager.currentWordIndex].word;
        const userInput = this.uiManager.wordInput!.value.trim();

        const existingSpans = this.uiManager.wordDisplay!.querySelectorAll('span');

        if (existingSpans.length !== currentWord.length) {
            let displayHTML = '';
            for (let i = 0; i < currentWord.length; i++) {
                displayHTML += '<span style="color: #666;">●</span>';
            }
            this.uiManager.wordDisplay!.innerHTML = displayHTML;
        }

        let firstErrorIndex = -1;
        for (let i = 0; i < userInput.length; i++) {
            if (i >= currentWord.length || userInput[i].toLowerCase() !== currentWord[i].toLowerCase()) {
                firstErrorIndex = i;
                break;
            }
        }

        const spans = this.uiManager.wordDisplay!.querySelectorAll('span');

        for (let i = 0; i < currentWord.length && i < spans.length; i++) {
            if (firstErrorIndex !== -1 && i >= firstErrorIndex) {
                if (i === firstErrorIndex) {
                    spans[i].textContent = '●';
                    spans[i].className = 'incorrect-char';
                    (spans[i] as HTMLElement).style.color = '#ff4444';
                } else {
                    spans[i].textContent = '●';
                    spans[i].className = '';
                    (spans[i] as HTMLElement).style.color = '#666';
                }
            } else if (i < userInput.length) {
                spans[i].textContent = currentWord[i];
                spans[i].className = 'correct-char';
                (spans[i] as HTMLElement).style.color = '';
            } else {
                spans[i].textContent = '●';
                spans[i].className = '';
                (spans[i] as HTMLElement).style.color = '#666';
            }
        }
    }

    validateKeyInput(e: KeyboardEvent): boolean {
        if (e.key === 'Shift') {
            return true;
        }

        if (e.key === 'Backspace') {
            return true;
        }

        const currentWordData = this.gameManager.words[this.gameManager.currentWordIndex];
        const currentWord = currentWordData.word;
        const currentPosition = this.uiManager.wordInput!.value.length;

        if (currentPosition >= currentWord.length) {
            e.preventDefault();
            return false;
        }

        const expectedChar = currentWord[currentPosition].toLowerCase();
        const inputChar = e.key.toLowerCase();
        const isCorrect = expectedChar === inputChar;

        if (!isCorrect && e.key !== 'Shift') {
            if (this.gameManager.isCustomLesson && this.levelManager && this.levelManager.getCurrentLevel()) {
                if (!this.levelManager.validateInput(e, currentWordData)) {
                    this.highlightWrongChar(currentPosition);
                    e.preventDefault();
                    return false;
                }
            } else {
                window.mistakeCount++;
                window.currentWordMistake = true;
            }

            this.highlightWrongChar(currentPosition);
            e.preventDefault();
            return false;
        }

        if (isCorrect && this.gameManager.isCustomLesson && this.gameManager.lessonMode === 'progressive') {
            this.gameManager.consecutiveMistakes = 0;
            this.gameManager.currentCharPosition = currentPosition;
        }

        return true;
    }

    highlightWrongChar(position: number): void {
        if (this.gameManager.isCustomLesson && (
            this.gameManager.lessonMode === 'vocabulary-learning' ||
            this.gameManager.lessonMode === 'pronunciation-only' ||
            this.gameManager.lessonMode === 'pronunciation-meaning' ||
            this.gameManager.lessonMode === 'progressive' ||
            this.gameManager.lessonMode === 'japanese-reading' ||
            this.gameManager.lessonMode === 'pronunciation-blind'
        )) {
            return;
        }

        const currentWord = this.gameManager.words[this.gameManager.currentWordIndex].word;
        let highlightedHTML = '';

        for (let i = 0; i < currentWord.length; i++) {
            if (i < position) {
                highlightedHTML += `<span class="correct-char">${currentWord[i]}</span>`;
            } else if (i === position) {
                highlightedHTML += `<span class="incorrect-char">${currentWord[i]}</span>`;
            } else {
                highlightedHTML += `<span>${currentWord[i]}</span>`;
            }
        }

        this.uiManager.wordDisplay!.innerHTML = highlightedHTML;
    }

    checkInputRealtime(): void {
        if (this.uiManager.isComposing) {
            return;
        }

        const currentWord = this.gameManager.words[this.gameManager.currentWordIndex].word;
        const userInput = this.uiManager.wordInput!.value.trim();

        this.updatePartialWordDisplay();

        if (userInput.toLowerCase() === currentWord.toLowerCase()) {
            if (this.gameManager.isCustomLesson && this.levelManager && this.levelManager.getCurrentLevel()) {
                const result = this.levelManager.handleWordComplete();

                if (result === 'next_word' && this.scheduleNextWordFn) {
                    this.scheduleNextWordFn(600);
                }
            } else {
                let correctHTML = '';
                for (let i = 0; i < currentWord.length; i++) {
                    correctHTML += `<span class="correct-char">${currentWord[i]}</span>`;
                }
                this.uiManager.wordDisplay!.innerHTML = correctHTML;

                if (!window.currentWordMistake) {
                    this.uiManager.showFeedback('Excellent!', 'correct');
                    this.audioManager.playCorrectSound("excellent");
                } else {
                    this.uiManager.showFeedback('Good!', 'correct');
                    this.audioManager.playCorrectSound("good");
                }

                if (this.scheduleNextWordFn) {
                    this.scheduleNextWordFn(300);
                }

                this.uiManager.wordInput!.disabled = true;
                setTimeout(() => {
                    this.uiManager.wordInput!.disabled = false;
                    this.uiManager.wordInput!.focus();
                }, 500);
            }

            return;
        }

        if (this.gameManager.isCustomLesson && this.levelManager && this.levelManager.getCurrentLevel()) {
            this.levelManager.checkInputRealtime();
        } else {
            let highlightedHTML = '';
            for (let i = 0; i < currentWord.length; i++) {
                if (i < userInput.length) {
                    if (userInput[i].toLowerCase() === currentWord[i].toLowerCase()) {
                        highlightedHTML += `<span class="correct-char">${currentWord[i]}</span>`;
                    } else {
                        highlightedHTML += `<span class="incorrect-char">${currentWord[i]}</span>`;
                    }
                } else {
                    highlightedHTML += `<span>${currentWord[i]}</span>`;
                }
            }

            this.uiManager.wordDisplay!.innerHTML = highlightedHTML;
        }

        this.keyboardManager.highlightNextKey();
    }
}
