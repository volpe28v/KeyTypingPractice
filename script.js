// Web Audio API関連の変数
// AudioManager: 音声関連機能を管理するクラス
class AudioManager {
    constructor() {
        this.audioContext = null;
    }

    // AudioContextの初期化（ユーザー操作後に実行）
    initAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('AudioContext initialized');
            } catch (e) {
                console.error('Failed to create AudioContext:', e);
            }
        }
        return this.audioContext;
    }

    // キータイピング音を再生する関数
    playTypingSound() {
        const ctx = this.initAudioContext();
        if (!ctx) return;
        
        try {
            const currentTime = ctx.currentTime;
            
            // メインのクリック音
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // 高音の短いクリック音（カシャという音）
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(4000, currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, currentTime + 0.005);
            
            // 音量の設定（短く鋭い音）
            gainNode.gain.setValueAtTime(0.15, currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.015);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.015);
            
            // 追加の低音成分
            const oscillator2 = ctx.createOscillator();
            const gainNode2 = ctx.createGain();
            
            oscillator2.connect(gainNode2);
            gainNode2.connect(ctx.destination);
            
            oscillator2.type = 'sine';
            oscillator2.frequency.setValueAtTime(200, currentTime);
            
            gainNode2.gain.setValueAtTime(0.05, currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.01);
            
            oscillator2.start(currentTime);
            oscillator2.stop(currentTime + 0.01);
        } catch (e) {
            console.error('Error playing typing sound:', e);
        }
    }

    // ミスタイプ音を再生する関数
    playMistypeSound() {
        const ctx = this.initAudioContext();
        if (!ctx) return;
        
        try {
            const currentTime = ctx.currentTime;
            
            // よりわかりやすい「ポン」という音
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // 中音域の「ポン」という音
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, currentTime + 0.08);
            
            // フィルターで音を丸くする
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, currentTime);
            
            // 音量設定（正解音より少し大きめでわかりやすく）
            gainNode.gain.setValueAtTime(0.2, currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.1);
            
            // 2つ目の音を追加（二重音でより特徴的に）
            const oscillator2 = ctx.createOscillator();
            const gainNode2 = ctx.createGain();
            
            oscillator2.connect(gainNode2);
            gainNode2.connect(ctx.destination);
            
            oscillator2.type = 'triangle';
            oscillator2.frequency.setValueAtTime(300, currentTime);
            oscillator2.frequency.exponentialRampToValueAtTime(150, currentTime + 0.08);
            
            gainNode2.gain.setValueAtTime(0.1, currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);
            
            oscillator2.start(currentTime);
            oscillator2.stop(currentTime + 0.08);
        } catch (e) {
            console.error('Error playing mistype sound:', e);
        }
    }

    // 正解時に効果音を再生する関数
    playCorrectSound(word = "good") {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 1.2;
            utterance.pitch = 2.0;
            utterance.volume = 1.0;
            
            window.speechSynthesis.speak(utterance);
        }
    }

    // 単語を発音する関数
    speakWord(word) {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            
            window.speechSynthesis.speak(utterance);
        }
    }
}

// AudioManagerのインスタンスを作成
const audioManager = new AudioManager();
// StorageManager: LocalStorage操作を管理するクラス
class StorageManager {
    // カスタム単語をlocalStorageから読み込み
    loadCustomWords() {
        const saved = localStorage.getItem('customWords');
        if (saved) {
            try {
                return saved;
            } catch (e) {
                console.error('カスタム単語の読み込みに失敗:', e);
                return '';
            }
        }
        return '';
    }

    // カスタム単語をlocalStorageに保存
    saveCustomWords(wordsText) {
        try {
            localStorage.setItem('customWords', wordsText);
        } catch (e) {
            console.error('カスタム単語の保存に失敗:', e);
        }
    }

    // 複数のカスタムレッスンを保存
    saveCustomLessons(lessons) {
        try {
            localStorage.setItem('customLessons', JSON.stringify(lessons));
        } catch (e) {
            console.error('カスタムレッスンの保存に失敗:', e);
        }
    }

    // 複数のカスタムレッスンを読み込み
    loadCustomLessons() {
        try {
            const saved = localStorage.getItem('customLessons');
            if (saved) {
                return JSON.parse(saved);
            } else {
                return [];
            }
        } catch (e) {
            console.error('カスタムレッスンの読み込みに失敗:', e);
            return [];
        }
    }

    // タイピング記録を保存
    saveRecords(records) {
        try {
            localStorage.setItem('typingRecords', JSON.stringify(records));
        } catch (e) {
            console.error('記録の保存に失敗:', e);
        }
    }

    // タイピング記録を読み込み
    loadRecords() {
        try {
            const savedRecords = localStorage.getItem('typingRecords');
            if (savedRecords) {
                const records = JSON.parse(savedRecords);
                
                // 古い形式のデータをクリーンアップ
                if (records.total) {
                    delete records.total;
                    this.saveRecords(records);
                }
                
                return records;
            }
            return {};
        } catch (e) {
            console.error('記録の読み込みに失敗:', e);
            return {};
        }
    }
}

// StorageManagerのインスタンスを作成
const storageManager = new StorageManager();
// LessonManager: レッスン管理機能を管理するクラス
class LessonManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
    }

    // 入力された単語を解析
    parseCustomWords(input) {
        const lines = input.trim().split('\n');
        const words = [];
        
        for (let line of lines) {
            line = line.trim();
            if (line === '') continue;
            
            const parts = line.split(',');
            if (parts.length >= 2) {
                const word = parts[0].trim();
                const meaning = parts.slice(1).join(',').trim();
                
                if (word && meaning) {
                    words.push({ word, meaning });
                }
            }
        }
        
        return words;
    }

    // 新しいレッスンを保存
    saveNewLesson(customLessons, updateLessonListCallback) {
        const lessonName = document.getElementById('lesson-name-input').value.trim();
        const wordsText = document.getElementById('custom-words-input').value.trim();
        
        if (!wordsText) {
            alert('単語を入力してください。');
            return null;
        }
        
        // 単語を解析
        const words = this.parseCustomWords(wordsText);
        if (words.length === 0) {
            alert('有効な単語が見つかりません。形式を確認してください。');
            return null;
        }
        
        // レッスン名が空の場合は最初の単語から自動生成
        let finalLessonName = lessonName;
        if (!finalLessonName) {
            finalLessonName = `${words[0].word} - ${words[0].meaning}`;
        }
        
        // 新しいレッスンオブジェクトを作成
        const newLesson = {
            id: Date.now(), // 一意のID
            name: finalLessonName,
            words: words,
            createdAt: new Date().toLocaleString()
        };
        
        // レッスンリストに追加
        customLessons.push(newLesson);
        
        // ローカルストレージに保存
        this.storageManager.saveCustomLessons(customLessons);
        
        // サイドバーのレッスン一覧を更新
        if (updateLessonListCallback) {
            updateLessonListCallback();
        }
        
        // 入力フィールドをクリア
        document.getElementById('lesson-name-input').value = '';
        document.getElementById('custom-words-input').value = '';
        
        alert(`レッスン「${finalLessonName}」を保存しました！`);
        return newLesson;
    }

    // 単語リストを表示
    displayWordsInSelection(lesson) {
        const wordsDisplay = document.getElementById('words-display');
        let displayHTML = '';
        
        lesson.words.forEach((wordObj, index) => {
            displayHTML += `<div class="word-item">${index + 1}. ${wordObj.word} - ${wordObj.meaning}</div>`;
        });
        
        if (lesson.words.length === 0) {
            displayHTML = '<div class="word-item">単語がありません</div>';
        }
        
        wordsDisplay.innerHTML = displayHTML;
    }

    // 単語編集を保存
    saveWordsEdit(selectedLessonForMode, customLessons, updateLessonListCallback) {
        const wordsEditArea = document.getElementById('words-edit-area');
        const wordsText = wordsEditArea.value.trim();
        
        if (!wordsText) {
            alert('単語を入力してください。');
            return false;
        }
        
        // 単語を解析
        const newWords = this.parseCustomWords(wordsText);
        if (newWords.length === 0) {
            alert('有効な単語が見つかりません。形式を確認してください。');
            return false;
        }
        
        // レッスンの単語リストを更新
        const lessonIndex = selectedLessonForMode.index;
        customLessons[lessonIndex].words = newWords;
        selectedLessonForMode.lesson.words = newWords;
        
        // ローカルストレージに保存
        this.storageManager.saveCustomLessons(customLessons);
        
        // 表示を更新
        this.displayWordsInSelection(selectedLessonForMode.lesson);
        if (updateLessonListCallback) {
            updateLessonListCallback();
        }
        
        alert('単語リストを更新しました！');
        return true;
    }

    // レッスンを削除
    deleteLesson(lessonId, customLessons, updateLessonListCallback) {
        const lessonIndex = customLessons.findIndex(lesson => lesson.id === lessonId);
        if (lessonIndex === -1) {
            alert('削除対象のレッスンが見つかりません。');
            return false;
        }
        
        const lessonName = customLessons[lessonIndex].name;
        
        // 確認ダイアログを表示
        if (!confirm(`「${lessonName}」を削除しますか？\nこの操作は取り消せません。`)) {
            return false;
        }
        
        // レッスンを配列から削除
        customLessons.splice(lessonIndex, 1);
        
        // ローカルストレージに保存
        this.storageManager.saveCustomLessons(customLessons);
        
        // 記録も削除
        const records = this.storageManager.loadRecords();
        delete records[`lesson${lessonId}`];
        this.storageManager.saveRecords(records);
        
        // レッスン一覧を更新
        if (updateLessonListCallback) {
            updateLessonListCallback();
        }
        
        alert(`レッスン「${lessonName}」を削除しました。`);
        return true;
    }
}

// LessonManagerのインスタンスを作成
const lessonManager = new LessonManager(storageManager);

// GameManager: ゲーム状態とロジックを管理するクラス
class GameManager {
    constructor(audioManager, storageManager) {
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
        
        // カスタムレッスン関連
        this.isCustomLesson = false;
        this.lessonMode = 'full';
        this.currentLessonIndex = 0;
    }
    
    // ゲームを初期化
    initGame(levelLists, customWords = null) {
        if (!this.isCustomLesson) {
            const levelData = levelLists.find(level => level.level === this.currentLevel);
            if (levelData) {
                const fullWordList = [...levelData.words];
                this.shuffleArray(fullWordList);
                this.words = fullWordList.slice(0, 10);
            }
        } else {
            this.words = customWords;
            this.shuffleArray(this.words);
        }
        
        this.currentWordIndex = 0;
        this.correctCount = 0;
        this.mistakeCount = 0;
        this.gameActive = true;
        this.timerStarted = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // 配列をシャッフル
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // タイマーを開始
    startTimer() {
        this.startTime = Date.now();
        this.timerStarted = true;
        return this.startTime;
    }
    
    // 現在の単語を取得
    getCurrentWord() {
        return this.words[this.currentWordIndex];
    }
    
    // 次の単語へ進む
    nextWord() {
        this.currentWordIndex++;
        this.correctCount++;
    }
    
    // ゲームが終了したかチェック
    isGameComplete() {
        return this.currentWordIndex >= this.words.length;
    }
    
    // ゲームを終了
    endGame() {
        this.endTime = Date.now();
        this.gameActive = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        return this.endTime - this.startTime;
    }
    
    // 段階的練習モードの初期化
    initProgressiveMode(word) {
        this.progressiveStep = 0;
        this.maxProgressiveSteps = word.length;
        this.consecutiveMistakes = 0;
        this.currentCharPosition = 0;
    }
    
    // 段階的練習モードを進める
    advanceProgressiveStep() {
        this.progressiveStep++;
    }
    
    // ミスをカウント（段階的練習モードの特別処理を含む）
    countMistake(currentPosition, visibleCharCount = null) {
        if (this.isCustomLesson && this.lessonMode === 'progressive' && visibleCharCount !== null) {
            // 隠されている文字でのミスのみカウント
            if (currentPosition >= visibleCharCount) {
                this.mistakeCount++;
                this.currentWordMistake = true;
                return true;
            }
            return false;
        } else {
            // 通常モードでは全てのミスをカウント
            this.mistakeCount++;
            this.currentWordMistake = true;
            return true;
        }
    }
    
    // 連続ミスを処理
    handleConsecutiveMistake(currentPosition) {
        if (currentPosition === this.currentCharPosition) {
            this.consecutiveMistakes++;
        } else {
            this.consecutiveMistakes = 1;
            this.currentCharPosition = currentPosition;
        }
        return this.consecutiveMistakes;
    }
    
    // 連続ミスをリセット
    resetConsecutiveMistakes() {
        this.consecutiveMistakes = 0;
    }
    
    // 進捗を戻す（段階的練習モード）
    revertProgress(mistakeCharPosition) {
        const currentWord = this.getCurrentWord().word;
        const newProgressiveStep = Math.max(0, currentWord.length - (mistakeCharPosition + 1));
        this.progressiveStep = newProgressiveStep;
    }
    
    // 新しい単語の開始時にリセット
    resetForNewWord() {
        this.currentWordMistake = false;
        if (this.isCustomLesson && this.lessonMode === 'progressive') {
            this.consecutiveMistakes = 0;
            this.currentCharPosition = 0;
        }
    }
}

// GameManagerのインスタンスを作成
const gameManager = new GameManager(audioManager, storageManager);

// UIManager: UI操作を管理するクラス
class UIManager {
    constructor() {
        // DOM要素のキャッシュ
        this.wordDisplay = document.getElementById('word-display');
        this.meaningDisplay = document.getElementById('meaning');
        this.wordInput = document.getElementById('word-input');
        this.feedback = document.getElementById('feedback');
        this.progressBar = document.getElementById('progress-bar');
        this.scoreDisplay = document.getElementById('score-display');
        this.levelDisplay = document.getElementById('level');
        this.levelDescDisplay = document.getElementById('level-desc');
        this.timerDisplay = document.getElementById('timer-display');
        this.replayAudioBtn = document.getElementById('replay-audio-btn');
    }
    
    // タイマー表示を更新
    updateTimerDisplay(timeMs) {
        this.timerDisplay.textContent = this.formatTime(timeMs);
    }
    
    // 時間をフォーマット
    formatTime(timeMs) {
        const seconds = Math.floor(timeMs / 1000);
        const milliseconds = Math.floor((timeMs % 1000) / 10);
        return `${seconds}.${milliseconds.toString().padStart(2, '0')}秒`;
    }
    
    // プログレスバーを更新
    updateProgressBar(currentIndex, totalCount) {
        const progress = (currentIndex / totalCount) * 100;
        this.progressBar.style.width = `${progress}%`;
    }
    
    // レベル表示を更新
    updateLevelDisplay(level, description) {
        this.levelDisplay.textContent = level;
        this.levelDescDisplay.textContent = description;
    }
    
    // フィードバックを表示
    showFeedback(message, className = '') {
        this.feedback.textContent = message;
        this.feedback.className = 'feedback ' + className;
    }
    
    // 単語表示をクリア
    clearWordDisplay() {
        this.wordDisplay.innerHTML = '';
    }
    
    // 意味表示を更新
    updateMeaningDisplay(meaning, visible = true) {
        this.meaningDisplay.textContent = meaning;
        this.meaningDisplay.style.display = visible ? 'block' : 'none';
    }
    
    // 入力フィールドをリセット
    resetInput() {
        this.wordInput.value = '';
        this.wordInput.focus();
    }

    // IMEを無効化してアルファベット入力を強制
    forceAlphabetInput() {
        // IME関連の属性を設定
        this.wordInput.setAttribute('inputmode', 'none');
        this.wordInput.setAttribute('lang', 'en');
        this.wordInput.style.imeMode = 'disabled';
        
        // 既にイベントリスナーが設定されている場合はスキップ
        if (this.wordInput.hasAttribute('data-ime-disabled')) {
            return;
        }
        this.wordInput.setAttribute('data-ime-disabled', 'true');
        
        // フォーカス時にIMEを確実に無効化
        this.wordInput.addEventListener('focus', () => {
            this.wordInput.style.imeMode = 'disabled';
        });
        
        // 日本語入力を検出して警告
        this.wordInput.addEventListener('compositionstart', (e) => {
            this.showInputModeWarning();
        });
        
        // 全角文字の入力を検出
        this.wordInput.addEventListener('input', (e) => {
            const value = e.target.value;
            // 全角文字（ひらがな、カタカナ、漢字、全角英数字）を検出
            if (/[^\x00-\x7F]/.test(value)) {
                this.showInputModeWarning();
                // 全角文字を削除
                e.target.value = value.replace(/[^\x00-\x7F]/g, '');
            }
        });
    }
    
    // 入力モード警告を表示
    showInputModeWarning() {
        this.showFeedback('日本語モードになっています。英数字モードに切り替えてください', 'incorrect');
        setTimeout(() => {
            if (this.feedback.textContent.includes('日本語モード')) {
                this.feedback.textContent = '';
                this.feedback.className = 'feedback';
            }
        }, 3000);
    }
    
    // 入力フィールドを無効化/有効化
    setInputEnabled(enabled) {
        this.wordInput.disabled = !enabled;
        if (enabled) {
            this.wordInput.focus();
        }
    }
    
    // スコア表示を更新
    updateScoreDisplay(elapsedTime, accuracyRate, mistakeCount) {
        this.scoreDisplay.textContent = `クリアタイム: ${this.formatTime(elapsedTime)} | 正確率: ${accuracyRate}% | ミス: ${mistakeCount}回`;
        this.scoreDisplay.style.display = 'block';
    }
    
    // スコア表示を隠す
    hideScoreDisplay() {
        this.scoreDisplay.style.display = 'none';
    }
    
    // ゲーム完了時の表示
    showGameComplete(isPerfect, mistakeCount) {
        if (isPerfect) {
            this.wordDisplay.innerHTML = '<span style="color: #ffcc00; font-size: 1.2em;">パーフェクト！</span>';
            this.showFeedback('おめでとうございます！', 'correct');
        } else {
            this.wordDisplay.innerHTML = 'クリア！';
            this.showFeedback(`${mistakeCount}回のミスがありました。`);
        }
        this.meaningDisplay.textContent = 'Enterキーを押して再挑戦';
        this.wordInput.placeholder = "";
        // タイマー表示は結果表示（スコア表示）のみで表示するため、ここでは表示しない
    }
    
    // タイトル画面の表示
    showTitle() {
        this.wordDisplay.innerHTML = '<span class="game-title">タイピングマスター</span>';
        this.meaningDisplay.textContent = 'レッスンを選んでゲームスタート！';
        this.timerDisplay.textContent = "00.00";
        this.timerDisplay.style.display = 'none'; // タイトル画面ではタイマー表示を非表示
        this.replayAudioBtn.style.display = 'none'; // タイトル画面では音声再生ボタンを非表示
        this.wordInput.value = '';
        this.wordInput.placeholder = "";
        this.feedback.textContent = '';
        this.feedback.className = 'feedback';
        this.progressBar.style.width = '0%';
        this.scoreDisplay.style.display = 'none';
    }
    
    // エラー表示
    showError(message) {
        this.wordDisplay.innerHTML = '<span>エラー</span>';
        this.meaningDisplay.textContent = message;
    }
    
    // 画面要素の表示/非表示
    setElementVisibility(elementId, visible) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = visible ? 'block' : 'none';
        }
    }
    
    // 複数の画面要素の表示/非表示
    setMultipleElementsVisibility(elementSelectors, visible) {
        elementSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = visible ? (element.tagName === 'SPAN' || element.tagName === 'INPUT' ? 'inline-block' : 'block') : 'none';
            }
        });
    }
}

// UIManagerのインスタンスを作成
const uiManager = new UIManager();

// KeyboardManager: キーボード表示と操作を管理するクラス
class KeyboardManager {
    constructor() {
        this.keyboardDisplay = document.querySelector('.keyboard-display');
        this.highlightedKeys = [];
    }
    
    // キーボードアニメーションを初期化
    initAnimation() {
        const keys = document.querySelectorAll('.key');
        
        keys.forEach(key => {
            key.style.opacity = '0';
            key.style.transform = 'translateY(20px)';
        });
        
        keys.forEach((key, index) => {
            setTimeout(() => {
                key.style.opacity = '1';
                key.style.transform = 'translateY(0)';
                key.style.transition = 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.2)';
            }, index * 20);
        });
    }
    
    // 次のキーをハイライト
    highlightNextKey() {
        // 前回のハイライトをクリアするだけで、新しいハイライトは行わない（スペル学習のため）
        this.clearHighlights();
    }
    
    // ハイライトをクリア
    clearHighlights() {
        const highlightedKeys = document.querySelectorAll('.key.highlight');
        highlightedKeys.forEach(key => {
            key.classList.remove('highlight');
            
            // シフト文字のスタイルをリセット
            const shiftChar = key.querySelector('.shift-char');
            if (shiftChar) {
                shiftChar.style.color = '#ff00ff';
                shiftChar.style.textShadow = 'none';
            }
        });
    }
    
    // キーを押した時のエフェクト
    showKeyPress(key, isCorrect = true) {
        const keyElement = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
        if (!keyElement) return;
        
        const className = isCorrect ? 'correct' : 'incorrect';
        keyElement.classList.remove(className);
        void keyElement.offsetWidth; // リフローを強制
        
        keyElement.classList.add(className);
        
        this.createRippleEffect(keyElement, !isCorrect);
        
        setTimeout(() => {
            keyElement.classList.remove(className);
        }, 1000);
    }
    
    // キーボードリップルエフェクト
    createRippleEffect(keyElement, isError = false) {
        // 既存のリップルを削除
        const existingRipples = document.querySelectorAll('.keyboard-ripple');
        existingRipples.forEach(ripple => ripple.remove());
        
        const ripple = document.createElement('div');
        ripple.className = 'keyboard-ripple';
        
        const keyRect = keyElement.getBoundingClientRect();
        const keyboardRect = this.keyboardDisplay.getBoundingClientRect();
        
        const keyX = keyRect.left + keyRect.width / 2 - keyboardRect.left;
        const keyY = keyRect.top + keyRect.height / 2 - keyboardRect.top;
        
        ripple.style.background = isError 
            ? `radial-gradient(circle at ${keyX}px ${keyY}px, transparent 0%, transparent 70%, rgba(255, 0, 0, 0.5) 100%)`
            : `radial-gradient(circle at ${keyX}px ${keyY}px, transparent 0%, transparent 70%, rgba(0, 255, 0, 0.5) 100%)`;
        
        this.keyboardDisplay.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.opacity = '0.7';
            ripple.style.transform = 'scale(3)';
            ripple.style.transition = 'all 1s cubic-bezier(0, 0.5, 0.5, 1)';
            
            setTimeout(() => {
                ripple.style.opacity = '0';
                setTimeout(() => {
                    ripple.remove();
                }, 300);
            }, 700);
        }, 10);
    }
}

// KeyboardManagerのインスタンスを作成
const keyboardManager = new KeyboardManager();
let audioContext = null;

// カスタムレッスン関連の変数
let customWords = [];
let lessonMode = 'full'; // 'full', 'pronunciation-meaning', 'pronunciation-only', 'progressive'
let customLessons = []; // 複数のカスタムレッスンを保存
let currentLessonIndex = 0; // 現在選択されているレッスンのインデックス
let selectedLessonForMode = null; // モード選択画面で選択されたレッスン
let isCustomLesson = false;
let autoProgressTimer = null;

// 段階的練習モード関連の変数
let progressiveStep = 0; // 現在の段階（0: 全表示, 1: 最後1文字隠す, 2: 最後2文字隠す, ...）
let maxProgressiveSteps = 0; // 最大段階数（単語の文字数）

// レガシー関数: AudioManagerクラスへのリダイレクト
function initAudioContext() {
    return audioManager.initAudioContext();
}

function playTypingSound() {
    return audioManager.playTypingSound();
}

function playMistypeSound() {
    return audioManager.playMistypeSound();
}

function speakWord(word) {
    return audioManager.speakWord(word);
}

// 現在の単語の発音を再生する関数
function replayCurrentWord() {
    if (gameActive && currentWordIndex < words.length) {
        const currentWord = words[currentWordIndex];
        if (currentWord && currentWord.word) {
            speakWord(currentWord.word);
        }
    }
}

// カスタム単語をlocalStorageから読み込み
function loadCustomWords() {
    return storageManager.loadCustomWords();
}

// カスタム単語をlocalStorageに保存
function saveCustomWords(wordsText) {
    return storageManager.saveCustomWords(wordsText);
}

// 複数のカスタムレッスンを保存
function saveCustomLessons() {
    return storageManager.saveCustomLessons(customLessons);
}

// 複数のカスタムレッスンを読み込み
function loadCustomLessons() {
    customLessons = storageManager.loadCustomLessons();
}

// 新しいレッスンを保存
function saveNewLesson() {
    return lessonManager.saveNewLesson(customLessons, updateLessonList);
}

// カスタムレッスン設定を表示
function showCustomLessonSetup() {
    // 既に開いているレッスンモード選択画面を閉じる
    hideModal('lesson-mode-selection');
    selectedLessonForMode = null;
    
    document.querySelector('.typing-area').style.display = 'none';
    document.querySelector('.keyboard-display-container').style.display = 'none';
    document.querySelector('.score-display').style.display = 'none';
    showModal('custom-lesson-setup');
    
    document.getElementById('back-to-title-btn').style.display = 'none';
    
    // 入力フィールドをクリア（新規作成モード）
    document.getElementById('lesson-name-input').value = '';
    document.getElementById('custom-words-input').value = 'apple, りんご\nbanana, バナナ\norange, オレンジ\nbook, 本\nwater, 水';
    document.getElementById('mode-progressive').checked = true;
}

// レッスンモード選択画面を表示
function showLessonModeSelection(lessonIndex) {
    if (lessonIndex < 0 || lessonIndex >= customLessons.length) {
        alert('レッスンが見つかりません。');
        return;
    }
    
    const lesson = customLessons[lessonIndex];
    selectedLessonForMode = { lesson, index: lessonIndex };
    
    // 他の画面を隠す
    document.querySelector('.typing-area').style.display = 'none';
    document.querySelector('.keyboard-display-container').style.display = 'none';
    document.querySelector('.score-display').style.display = 'none';
    hideModal('custom-lesson-setup');
    
    // レッスンモード選択画面を表示
    showModal('lesson-mode-selection');
    
    document.getElementById('selected-lesson-name').textContent = lesson.name;
    document.getElementById('back-to-title-btn').style.display = 'none';
    
    // デフォルトで段階的練習を選択
    document.getElementById('lesson-mode-progressive').checked = true;
    
    // 単語リストを表示
    displayWordsInSelection(lesson);
    
    // 編集モードをリセット
    resetWordsEditMode();
}

// 単語リストを表示
function displayWordsInSelection(lesson) {
    return lessonManager.displayWordsInSelection(lesson);
}

// 単語編集モードを切り替え
function toggleWordsEdit() {
    const wordsDisplay = document.getElementById('words-display');
    const wordsEditArea = document.getElementById('words-edit-area');
    const wordsEditControls = document.getElementById('words-edit-controls');
    const editToggle = document.querySelector('.edit-toggle');
    const lessonNameH2 = document.getElementById('selected-lesson-name');
    const lessonNameInput = document.getElementById('lesson-name-edit-input');
    
    if (wordsEditArea.style.display === 'none') {
        // 編集モードに切り替え
        wordsDisplay.style.display = 'none';
        wordsEditArea.style.display = 'block';
        wordsEditControls.style.display = 'flex';
        editToggle.textContent = '[キャンセル]';
        
        // タイトル編集も有効化
        lessonNameH2.style.display = 'none';
        lessonNameInput.style.display = 'block';
        lessonNameInput.value = selectedLessonForMode.lesson.name;
        
        // 現在の単語リストをテキストエリアに設定
        const lesson = selectedLessonForMode.lesson;
        const wordsText = lesson.words.map(word => `${word.word}, ${word.meaning}`).join('\n');
        wordsEditArea.value = wordsText;
        wordsEditArea.focus();
    } else {
        // 編集モードをキャンセル
        cancelWordsEdit();
    }
}

// 単語編集をキャンセル
function cancelWordsEdit() {
    resetWordsEditMode();
}

// 単語編集モードをリセット
function resetWordsEditMode() {
    const wordsDisplay = document.getElementById('words-display');
    const wordsEditArea = document.getElementById('words-edit-area');
    const wordsEditControls = document.getElementById('words-edit-controls');
    const editToggle = document.querySelector('.edit-toggle');
    const lessonNameH2 = document.getElementById('selected-lesson-name');
    const lessonNameInput = document.getElementById('lesson-name-edit-input');
    
    wordsDisplay.style.display = 'block';
    wordsEditArea.style.display = 'none';
    wordsEditControls.style.display = 'none';
    editToggle.textContent = '[編集]';
    
    // タイトル編集も元に戻す
    lessonNameH2.style.display = 'block';
    lessonNameInput.style.display = 'none';
}

// 単語編集を保存
function saveWordsEdit() {
    // タイトルも一緒に保存
    const newLessonName = document.getElementById('lesson-name-edit-input').value.trim();
    if (!newLessonName) {
        alert('レッスン名を入力してください。');
        return false;
    }
    
    // レッスン名を更新
    selectedLessonForMode.lesson.name = newLessonName;
    
    const success = lessonManager.saveWordsEdit(selectedLessonForMode, customLessons, updateLessonList);
    if (success) {
        // 保存成功時はタイトル表示も更新
        document.getElementById('selected-lesson-name').textContent = newLessonName;
        resetWordsEditMode();
    }
    return success;
}

// 選択されたモードでレッスンを開始
function startSelectedLesson() {
    if (!selectedLessonForMode) {
        alert('レッスンが選択されていません。');
        return;
    }
    
    const selectedMode = document.querySelector('input[name="saved-lesson-mode"]:checked').value;
    const { lesson, index } = selectedLessonForMode;
    
    currentLessonIndex = index;
    
    // カスタム単語を設定
    customWords = lesson.words;
    
    // モードを設定
    lessonMode = selectedMode;
    isCustomLesson = true;
    
    // カスタム単語でゲーム開始
    words = customWords;
    
    // UIをゲームモードに変更
    hideModal('lesson-mode-selection');
    
    // ゲーム画面の要素を表示
    document.querySelector('.typing-area').style.display = 'block';
    document.querySelector('.keyboard-display-container').style.display = 'block';
    document.getElementById('back-to-title-btn').style.display = 'block';
    
    initGame();
}

// レッスンモード選択をキャンセル
function cancelLessonMode() {
    hideModal('lesson-mode-selection');
    selectedLessonForMode = null;
    backToTitle();
}

// 選択されたレッスンを削除
function deleteSelectedLesson() {
    if (!selectedLessonForMode) {
        alert('削除対象のレッスンが選択されていません。');
        return;
    }
    
    const { lesson } = selectedLessonForMode;
    const success = lessonManager.deleteLesson(lesson.id, customLessons, updateLessonList);
    
    if (success) {
        // 削除成功時はレッスンモード選択画面を閉じてタイトルに戻る
        selectedLessonForMode = null;
        hideModal('lesson-mode-selection');
        backToTitle();
    }
}

// カスタムレッスンをキャンセル
function cancelCustomLesson() {
    hideModal('custom-lesson-setup');
    backToTitle();
}

// 入力された単語を解析
function parseCustomWords(input) {
    return lessonManager.parseCustomWords(input);
}

// カスタムレッスンを開始
function startCustomLesson() {
    const input = document.getElementById('custom-words-input').value;
    const selectedMode = document.querySelector('input[name="lesson-mode"]:checked').value;
    
    // 入力値をバリデーション
    if (!input.trim()) {
        alert('単語を入力してください。');
        return;
    }
    
    customWords = parseCustomWords(input);
    
    if (customWords.length === 0) {
        alert('正しい形式で単語を入力してください。\n例: apple, りんご');
        return;
    }
    
    if (customWords.length > 50) {
        alert('単語数は50個以下にしてください。');
        return;
    }
    
    // レッスンとして保存
    const saveSuccess = saveNewLesson();
    if (!saveSuccess) {
        // 保存に失敗した場合でも、ゲームは開始できるようにする
        console.warn('レッスンの保存に失敗しましたが、ゲームを開始します。');
    }
    
    // 単語をlocalStorageに保存
    saveCustomWords(input);
    
    // モードを設定
    lessonMode = selectedMode;
    isCustomLesson = true;
    
    // 保存したレッスンのインデックスを設定
    if (saveSuccess && customLessons.length > 0) {
        currentLessonIndex = customLessons.length - 1;
    }
    
    // レベル10でゲームを開始
    currentLevel = 10;
    
    // レベルリストのカスタムレッスンに単語を設定
    const customLevel = levelLists.find(level => level.level === 10);
    if (customLevel) {
        customLevel.words = customWords;
    }
    
    // UIをゲームモードに変更
    hideModal('custom-lesson-setup');
    
    // ゲーム画面の要素を表示
    document.querySelector('.typing-area').style.display = 'block';
    document.querySelector('.keyboard-display-container').style.display = 'block';
    document.getElementById('back-to-title-btn').style.display = 'block';
    document.querySelector('.level-display').style.display = 'inline-block';
    
    initGame();
}

// 正解時に効果音を再生する関数
function playCorrectSound(word = "good") {
    return audioManager.playCorrectSound(word);
}

function initGame() {
    // GameManagerのプロパティを先に設定
    gameManager.isCustomLesson = isCustomLesson;
    gameManager.lessonMode = lessonMode;
    gameManager.currentLevel = currentLevel;
    
    // GameManagerを使用してゲームを初期化
    if (!isCustomLesson) {
        gameManager.initGame(levelLists);
    } else {
        gameManager.initGame(levelLists, customWords);
    }
    
    displayWord();
    
    updateProgressBar();
    scoreDisplay.style.display = 'none';
    // レベル表示の処理
    if (!isCustomLesson) {
        const levelData = levelLists.find(level => level.level === currentLevel);
        if (levelData) {
            levelDisplay.textContent = currentLevel;
            levelDescDisplay.textContent = levelData.description;
        }
    } else {
        // カスタムレッスンの場合はレベル表示を隠す
        document.querySelector('.level-display').style.display = 'none';
    }
    wordInput.value = '';
    wordInput.focus();
    
    // IMEを無効化してアルファベット入力を強制
    uiManager.forceAlphabetInput();
    
    gameActive = true;
    timerStarted = false;
    
    // フォーカスを確実に設定（少し遅延させて確実性を高める）
    setTimeout(() => {
        if (gameActive && !wordInput.disabled) {
            wordInput.focus();
        }
    }, 100);
    
    timerDisplay.textContent = "00.00";
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    hideRecords();
    
    document.getElementById('back-to-title-btn').style.display = 'none';
    
    // レベル表示を表示（カスタムレッスンでない場合のみ）
    if (!isCustomLesson) {
        document.querySelector('.level-display').style.display = 'inline-block';
    }
    
    initLevelSelectors();
    
    initKeyboardAnimation();
    
    setTimeout(() => {
        if (words.length > 0) {
            displayWord();
        }
    }, 100);
}

// レガシー変数: GameManagerへのアクセサ
// 既存のコードとの互換性を保つため、getter/setterでGameManagerのプロパティを参照
Object.defineProperty(window, 'words', {
    get: () => gameManager.words,
    set: (value) => { gameManager.words = value; }
});

Object.defineProperty(window, 'currentWordIndex', {
    get: () => gameManager.currentWordIndex,
    set: (value) => { gameManager.currentWordIndex = value; }
});

Object.defineProperty(window, 'correctCount', {
    get: () => gameManager.correctCount,
    set: (value) => { gameManager.correctCount = value; }
});

Object.defineProperty(window, 'mistakeCount', {
    get: () => gameManager.mistakeCount,
    set: (value) => { gameManager.mistakeCount = value; }
});

Object.defineProperty(window, 'currentLevel', {
    get: () => gameManager.currentLevel,
    set: (value) => { gameManager.currentLevel = value; }
});

Object.defineProperty(window, 'gameActive', {
    get: () => gameManager.gameActive,
    set: (value) => { gameManager.gameActive = value; }
});

Object.defineProperty(window, 'timerStarted', {
    get: () => gameManager.timerStarted,
    set: (value) => { gameManager.timerStarted = value; }
});

Object.defineProperty(window, 'startTime', {
    get: () => gameManager.startTime,
    set: (value) => { gameManager.startTime = value; }
});

Object.defineProperty(window, 'endTime', {
    get: () => gameManager.endTime,
    set: (value) => { gameManager.endTime = value; }
});

Object.defineProperty(window, 'timerInterval', {
    get: () => gameManager.timerInterval,
    set: (value) => { gameManager.timerInterval = value; }
});

Object.defineProperty(window, 'currentWordMistake', {
    get: () => gameManager.currentWordMistake,
    set: (value) => { gameManager.currentWordMistake = value; }
});

Object.defineProperty(window, 'isCustomLesson', {
    get: () => gameManager.isCustomLesson,
    set: (value) => { gameManager.isCustomLesson = value; }
});

Object.defineProperty(window, 'lessonMode', {
    get: () => gameManager.lessonMode,
    set: (value) => { gameManager.lessonMode = value; }
});

Object.defineProperty(window, 'currentLessonIndex', {
    get: () => gameManager.currentLessonIndex,
    set: (value) => { gameManager.currentLessonIndex = value; }
});

Object.defineProperty(window, 'progressiveStep', {
    get: () => gameManager.progressiveStep,
    set: (value) => { gameManager.progressiveStep = value; }
});

Object.defineProperty(window, 'maxProgressiveSteps', {
    get: () => gameManager.maxProgressiveSteps,
    set: (value) => { gameManager.maxProgressiveSteps = value; }
});

Object.defineProperty(window, 'consecutiveMistakes', {
    get: () => gameManager.consecutiveMistakes,
    set: (value) => { gameManager.consecutiveMistakes = value; }
});

Object.defineProperty(window, 'currentCharPosition', {
    get: () => gameManager.currentCharPosition,
    set: (value) => { gameManager.currentCharPosition = value; }
});

let records = {};

function saveRecords() {
    return storageManager.saveRecords(records);
}

function loadRecords() {
    records = storageManager.loadRecords();
}

function addRecord(levelKey, time, mistakes = 0, totalTypes = 0) {
    if (!records[levelKey]) {
        records[levelKey] = [];
    }
    
    const currentBestTime = records[levelKey].length > 0 ? Math.min(...records[levelKey].map(r => r.time || r)) : Infinity;
    
    // 正確率を計算（正解タイプ数 ÷ (正解タイプ数 + ミスタイプ数) × 100）
    const accuracy = mistakes === 0 ? 100 : Math.round((totalTypes / (totalTypes + mistakes)) * 100);
    
    // 新しい記録オブジェクトを作成（後方互換性のため時間のみの古い形式もサポート）
    const newRecord = {
        time: time,
        mistakes: mistakes,
        accuracy: accuracy,
        totalTypes: totalTypes,
        date: new Date().toLocaleDateString()
    };
    
    if (time < currentBestTime) {
        records[levelKey] = [newRecord];
        saveRecords();
        
        showNewRecordMessage();
    }
}

// レガシー関数: 時間をフォーマット
function formatTime(timeMs) {
    return uiManager.formatTime(timeMs);
}

function displayBestTimes() {
    // すべてのカスタムレッスンの記録を表示
    customLessons.forEach(lesson => {
        const lessonRecords = records[`lesson${lesson.id}`] || [];
        const lessonRecordsList = document.getElementById(`lesson${lesson.id}-records`);
        
        if (lessonRecordsList) {
            lessonRecordsList.innerHTML = '';
            
            if (lessonRecords.length > 0) {
                // 新しい記録形式と古い記録形式を統一的に処理
                const bestRecord = lessonRecords.reduce((best, current) => {
                    const currentTime = current.time || current; // 新形式または古形式
                    const bestTime = best.time || best;
                    return currentTime < bestTime ? current : best;
                });
                
                const li = document.createElement('li');
                const recordTime = bestRecord.time || bestRecord;
                const recordAccuracy = bestRecord.accuracy !== undefined ? bestRecord.accuracy : 100;
                
                li.innerHTML = `<span style="color: var(--color-success); font-size: 1.2rem; font-weight: bold;">${recordAccuracy}%</span><br><small style="color: var(--text-muted);">${formatTime(recordTime)}</small>`;
                lessonRecordsList.appendChild(li);
            } else {
                const li = document.createElement('li');
                li.textContent = '記録なし';
                li.style.color = '#666666';
                lessonRecordsList.appendChild(li);
            }
        }
    });
}

// レガシー変数: UIManagerのDOM要素への参照
const wordDisplay = uiManager.wordDisplay;
const meaningDisplay = uiManager.meaningDisplay;
const wordInput = uiManager.wordInput;
const feedback = uiManager.feedback;
const progressBar = uiManager.progressBar;
const scoreDisplay = uiManager.scoreDisplay;
const levelDisplay = uiManager.levelDisplay;
const levelDescDisplay = uiManager.levelDescDisplay;
const timerDisplay = uiManager.timerDisplay;

function updateTimer() {
    if (!gameActive) return;
    
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    timerDisplay.textContent = formatTime(elapsedTime);
}

function startTimer() {
    startTime = Date.now();
    timerStarted = true;
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        // ゲーム中はタイマー表示を更新しない（表示は非表示のまま）
        // timerDisplay.textContent = formatTime(elapsedTime);
    }, 10);
    
    // タイマー表示を非表示にする
    timerDisplay.style.display = 'none';
    
    hideRecords();
    
    document.getElementById('back-to-title-btn').style.display = 'block';
}

// レガシー関数: キーボードアニメーションを初期化
function initKeyboardAnimation() {
    keyboardManager.initAnimation();
}

// レガシー関数: 配列をシャッフル
function shuffleArray(array) {
    return gameManager.shuffleArray(array);
}

// 段階的練習モードの表示を更新する関数
function updateProgressiveDisplay() {
    const currentWord = words[currentWordIndex].word;
    const userInput = wordInput.value.trim();
    let displayHTML = '';
    
    // 表示する文字数を計算（全体 - 隠す文字数）
    const visibleCharCount = Math.max(0, currentWord.length - progressiveStep);
    
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
    
    wordDisplay.innerHTML = displayHTML;
}

// 部分的に表示された単語を更新する関数
function updatePartialWordDisplay() {
    if (!isCustomLesson || lessonMode === 'full') {
        return; // 通常モードでは何もしない
    }
    
    // 段階的練習モードの場合は専用関数を使用
    if (lessonMode === 'progressive') {
        updateProgressiveDisplay();
        return;
    }
    
    const currentWord = words[currentWordIndex].word;
    const userInput = wordInput.value.trim();
    
    // 現在の表示を直接更新せず、スパン要素を個別に更新
    const existingSpans = wordDisplay.querySelectorAll('span');
    
    // 既存のスパンがない場合は初期化
    if (existingSpans.length !== currentWord.length) {
        let displayHTML = '';
        for (let i = 0; i < currentWord.length; i++) {
            displayHTML += '<span style="color: #666;">●</span>';
        }
        wordDisplay.innerHTML = displayHTML;
    }
    
    // 入力全体をチェックして最初のエラー位置を特定
    let firstErrorIndex = -1;
    for (let i = 0; i < userInput.length; i++) {
        if (i >= currentWord.length || userInput[i].toLowerCase() !== currentWord[i].toLowerCase()) {
            firstErrorIndex = i;
            break;
        }
    }
    
    // 各文字の表示を個別に更新
    const spans = wordDisplay.querySelectorAll('span');
    
    for (let i = 0; i < currentWord.length && i < spans.length; i++) {
        if (firstErrorIndex !== -1 && i >= firstErrorIndex) {
            // エラー位置以降はすべて黒丸
            if (i === firstErrorIndex) {
                // エラー位置は赤い丸
                spans[i].textContent = '●';
                spans[i].className = 'incorrect-char';
                spans[i].style.color = '#ff4444';
            } else {
                // エラー位置より後は通常の黒丸
                spans[i].textContent = '●';
                spans[i].className = '';
                spans[i].style.color = '#666';
            }
        } else if (i < userInput.length) {
            // 正解の文字を表示
            spans[i].textContent = currentWord[i];
            spans[i].className = 'correct-char';
            spans[i].style.color = '';
        } else {
            // まだ入力されていない文字は黒丸
            spans[i].textContent = '●';
            spans[i].className = '';
            spans[i].style.color = '#666';
        }
    }
}

function displayWord() {
    if (currentWordIndex < words.length) {
        const currentWord = words[currentWordIndex];
        
        // 音声再生ボタンを表示
        uiManager.replayAudioBtn.style.display = 'block';
        
        if (currentWord && currentWord.word) {
            // 段階的練習モードの初期化
            if (isCustomLesson && lessonMode === 'progressive') {
                progressiveStep = 0;
                maxProgressiveSteps = currentWord.word.length;
                
                // 入力フィールドを確実にクリア
                wordInput.value = '';
                
                updateProgressiveDisplay();
                
                // 最初の段階でも発音
                speakWord(currentWord.word);
            }
            // カスタムレッスンのモードに応じて単語表示を制御
            else if (isCustomLesson && (lessonMode === 'pronunciation-only' || lessonMode === 'pronunciation-meaning')) {
                // 発音のみまたは発音+意味モード：黒丸で単語を非表示
                let hiddenHTML = '';
                for (let i = 0; i < currentWord.word.length; i++) {
                    hiddenHTML += '<span style="color: #666;">●</span>';
                }
                wordDisplay.innerHTML = hiddenHTML;
            } else {
                // 通常モード：単語を表示
                wordDisplay.innerHTML = currentWord.word.split('').map(char => `<span>${char}</span>`).join('');
            }
            
            // モードに応じて意味表示を制御
            if (isCustomLesson && lessonMode === 'pronunciation-only') {
                meaningDisplay.style.display = 'none';
            } else {
                meaningDisplay.textContent = currentWord.meaning;
                meaningDisplay.style.display = 'block';
            }
            
            feedback.textContent = '';
            feedback.className = 'feedback';
            
            // 入力フィールドは全モードで表示
            wordInput.style.display = 'inline-block';
            wordInput.value = '';
            wordInput.focus();
            
            // 段階的練習モード以外では発音（段階的練習は上で既に発音済み）
            if (!(isCustomLesson && lessonMode === 'progressive')) {
                speakWord(currentWord.word);
            }
            
            // キーボードハイライトを表示
            highlightNextKey();
            
            // 新しい単語を表示するたびにミス状態をリセット
            currentWordMistake = false;
            
            // 段階的練習モードの連続ミス変数もリセット
            if (isCustomLesson && lessonMode === 'progressive') {
                consecutiveMistakes = 0;
                currentCharPosition = 0;
            }
        } else {
            console.error('単語データが不正です:', currentWord);
            wordDisplay.innerHTML = '<span>エラー</span>';
            meaningDisplay.textContent = '単語データの読み込みに問題があります';
        }
        
    } else {
        endTime = Date.now();
        const elapsedTime = endTime - startTime;
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // タイマー表示は結果表示（スコア表示）のみで行うため、ここでは更新しない
        
        // 総タイプ数を計算
        let totalTypesCount = 0;
        words.forEach(word => {
            totalTypesCount += word.word.length;
        });
        
        // 正確率を計算（正解タイプ数 ÷ (正解タイプ数 + ミスタイプ数) × 100）
        const accuracyRate = mistakeCount === 0 ? 100 : Math.round((totalTypesCount / (totalTypesCount + mistakeCount)) * 100);
        
        // レッスンごとに記録を保存（正確率計算のための総タイプ数も渡す）
        if (isCustomLesson && currentLessonIndex >= 0 && currentLessonIndex < customLessons.length) {
            const lessonId = customLessons[currentLessonIndex].id;
            addRecord(`lesson${lessonId}`, elapsedTime, mistakeCount, totalTypesCount);
        } else {
            addRecord(`level${currentLevel}`, elapsedTime, mistakeCount, totalTypesCount);
        }
        
        // UIManagerを使用してスコア表示を更新
        uiManager.updateScoreDisplay(elapsedTime, accuracyRate, mistakeCount);
        
        const isPerfect = mistakeCount === 0;
        
        // UIManagerを使用してゲーム完了時の表示
        uiManager.showGameComplete(isPerfect, mistakeCount);
        
        // 効果音を再生
        if (isPerfect) {
            playCorrectSound("congratulations");
        } else {
            playCorrectSound("complete");
        }
        
        showRecords();
        
        gameActive = false;
        
        wordInput.value = '';
        wordInput.focus();
    }
}

// レガシー関数: プログレスバーを更新
function updateProgressBar() {
    uiManager.updateProgressBar(currentWordIndex, words.length);
}

function validateKeyInput(e) {
    if (e.key === 'Shift') {
        return true;
    }
    
    // Backspaceキーの処理
    if (e.key === 'Backspace') {
        return true; // Backspaceは常に許可
    }
    
    const currentWord = words[currentWordIndex].word;
    const currentPosition = wordInput.value.length;
    
    if (currentPosition >= currentWord.length) {
        e.preventDefault();
        return false;
    }
    
    const expectedChar = currentWord[currentPosition].toLowerCase();
    const inputChar = e.key.toLowerCase();
    
    const isCorrect = expectedChar === inputChar;
    
    if (!isCorrect && e.key !== 'Shift') {
        // 段階的練習モードの場合、表示されている文字のミスはカウントしない
        if (isCustomLesson && lessonMode === 'progressive') {
            const currentWord = words[currentWordIndex].word;
            const visibleCharCount = Math.max(0, currentWord.length - progressiveStep);
            
            // 隠されている文字でのミスのみカウント
            if (currentPosition >= visibleCharCount) {
                mistakeCount++;
                currentWordMistake = true;
                
                // 連続ミス処理
                // 同じ文字位置でのミスかチェック
                if (currentPosition === currentCharPosition) {
                    consecutiveMistakes++;
                } else {
                    // 新しい文字位置なので連続ミス数をリセット
                    consecutiveMistakes = 1;
                    currentCharPosition = currentPosition;
                }
            }
            
            // 3回連続ミスで進捗を戻す
            if (consecutiveMistakes >= 3) {
                const currentWord = words[currentWordIndex].word;
                const mistakeCharPosition = currentCharPosition; // 3回ミスした文字の位置
                
                // ミスした文字位置まで進捗を戻す
                // progressiveStep = 単語の長さ - 表示する文字数
                // ミスした文字を未入力状態で表示するには: progressiveStep = 単語の長さ - (ミスした位置 + 1)
                // 例: apple(5文字)でl(位置3)をミスした場合 → progressiveStep = 5 - (3 + 1) = 1 → appl●が表示される
                const newProgressiveStep = Math.max(0, currentWord.length - (mistakeCharPosition + 1));
                progressiveStep = newProgressiveStep;
                
                feedback.textContent = `3回連続ミス！「${currentWord[mistakeCharPosition]}」の位置まで戻します`;
                feedback.className = 'feedback incorrect';
                
                setTimeout(() => {
                    // 入力をミスした文字位置まで戻す（ミスした文字は未入力状態）
                    wordInput.value = currentWord.substring(0, mistakeCharPosition);
                    consecutiveMistakes = 0; // 連続ミス数をリセット
                    currentWordMistake = false; // ミス状態をリセット
                    updateProgressiveDisplay();
                    wordInput.focus();
                }, 1000);
            }
        } else {
            // 通常モードでは全てのミスをカウント
            mistakeCount++;
            currentWordMistake = true;
        }
        
        highlightWrongChar(currentPosition);
        
        e.preventDefault();
        return false;
    }
    
    // 正解の場合は連続ミス数をリセット
    if (isCorrect && isCustomLesson && lessonMode === 'progressive') {
        consecutiveMistakes = 0;
        currentCharPosition = currentPosition;
    }
    
    return true;
}

function highlightWrongChar(position) {
    // スペル隠しモードと段階的練習モードでは何もしない（各モードの表示関数で処理する）
    if (isCustomLesson && (lessonMode === 'pronunciation-only' || lessonMode === 'pronunciation-meaning' || lessonMode === 'progressive')) {
        return;
    }
    
    const currentWord = words[currentWordIndex].word;
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
    
    wordDisplay.innerHTML = highlightedHTML;
}

function checkInputRealtime() {
    
    const currentWord = words[currentWordIndex].word;
    const userInput = wordInput.value.trim();
    
    // カスタムレッスンの非表示モードでの部分表示更新
    updatePartialWordDisplay();
    
    if (userInput.toLowerCase() === currentWord.toLowerCase()) {
        // 段階的練習モードの処理
        if (isCustomLesson && lessonMode === 'progressive') {
            // 全文字を緑色で表示
            let correctHTML = '';
            for (let i = 0; i < currentWord.length; i++) {
                correctHTML += `<span class="correct-char">${currentWord[i]}</span>`;
            }
            wordDisplay.innerHTML = correctHTML;
            
            // 入力フィールドを即座に無効化して連打を防ぐ
            wordInput.disabled = true;
            
            // 段階を進める
            progressiveStep++;
            
            if (progressiveStep <= maxProgressiveSteps) {
                // まだ段階が残っている場合
                feedback.textContent = `ステップ ${progressiveStep}/${maxProgressiveSteps} クリア！`;
                feedback.className = 'feedback correct';
                
                // 正解効果音を再生
                if (!currentWordMistake) {
                    playCorrectSound("excellent");
                } else {
                    playCorrectSound("good");
                }
                
                // 遅延後に次の段階へ
                setTimeout(() => {
                    wordInput.value = '';
                    currentWordMistake = false; // ミス状態をリセット
                    updateProgressiveDisplay();
                    
                    // 段階が変わったら発音
                    speakWord(currentWord);
                    
                    // 入力フィールドを再有効化
                    wordInput.disabled = false;
                    wordInput.focus();
                }, 1000);
            } else {
                // 全段階完了（最後の段階は全隠し状態での成功）
                feedback.textContent = 'Complete!';
                feedback.className = 'feedback correct';
                
                // 正解効果音を再生
                if (!currentWordMistake) {
                    playCorrectSound("excellent");
                } else {
                    playCorrectSound("good");
                }
                
                // 遅延後に次の単語へ
                setTimeout(() => {
                    currentWordIndex++;
                    correctCount++;
                    
                    // 入力フィールドをクリア
                    wordInput.value = '';
                    
                    updateProgressBar();
                    displayWord();
                    
                    // 入力フィールドを再有効化
                    wordInput.disabled = false;
                    wordInput.focus();
                }, 1500);
            }
        }
        // その他のモードの処理
        else {
            // 単語全体を緑色にする（全ての文字を正解状態にする）
            // スペル隠しモードでは現在の表示を維持して色だけ変更
            if (isCustomLesson && (lessonMode === 'pronunciation-only' || lessonMode === 'pronunciation-meaning')) {
                const spans = wordDisplay.querySelectorAll('span');
                spans.forEach((span, i) => {
                    span.textContent = currentWord[i];
                    span.className = 'correct-char';
                    span.style.color = '';
                });
            } else {
                let correctHTML = '';
                for (let i = 0; i < currentWord.length; i++) {
                    correctHTML += `<span class="correct-char">${currentWord[i]}</span>`;
                }
                wordDisplay.innerHTML = correctHTML;
            }
            
            // ミスがなかった場合は"excellent"、ミスがあった場合は"good"と表示
            if (!currentWordMistake) {
                feedback.textContent = 'Excellent!';
                // 正解効果音を再生（ミスなし）
                playCorrectSound("excellent");
            } else {
                feedback.textContent = 'Good!';
                // 正解効果音を再生（ミスあり）
                playCorrectSound("good");
            }
            feedback.className = 'feedback correct';
            
            // 遅延を追加して、緑色の状態を見えるようにする
            setTimeout(() => {
                currentWordIndex++;
                correctCount++;
                
                updateProgressBar();
                displayWord();
            }, 500); // 500ミリ秒の遅延
        }
        
        // 段階的練習モード以外では入力フィールドを一時的に無効化
        if (!(isCustomLesson && lessonMode === 'progressive')) {
            wordInput.disabled = true;
            setTimeout(() => {
                wordInput.disabled = false;
                wordInput.focus(); // フォーカスを再設定
            }, 500);
        }
        
        return;
    }
    
    // スペル隠しモードと段階的練習モードでは部分表示更新のみ実行、通常モードでは全文字のハイライト表示
    if (isCustomLesson && (lessonMode === 'pronunciation-only' || lessonMode === 'pronunciation-meaning' || lessonMode === 'progressive')) {
        // スペル隠しモードと段階的練習モードでは何もしない（各モードの表示関数で処理済み）
    } else {
        // 通常モードでは全文字をハイライト表示
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
        
        wordDisplay.innerHTML = highlightedHTML;
    }
    
    highlightNextKey();
}

wordInput.addEventListener('keydown', (e) => {
    if (!timerStarted && gameActive) {
        startTimer();
        // 最初のキー入力時にAudioContextを初期化
        initAudioContext();
    }
    
    if (e.key === 'Enter') {
        if (!gameActive) {
            if (currentWordIndex >= words.length) {
                initGame();
            }
        }
    } else if (gameActive) {
        // Backspaceの特別な処理
        if (e.key === 'Backspace') {
            // Backspace音を再生
            playTypingSound();
            return; // 以下の処理をスキップ（updatePartialWordDisplayはinputイベントで処理される）
        }
        
        if (validateKeyInput(e)) {
            // 正しいキー入力の場合
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                playTypingSound();
            }
            
            // KeyboardManagerを使用してキープレスを表示
            keyboardManager.showKeyPress(e.key, true);
            
            setTimeout(highlightNextKey, 50);
        } else {
            // 間違ったキー入力の場合
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                playMistypeSound();
            }
            
            // KeyboardManagerを使用して間違ったキープレスを表示
            keyboardManager.showKeyPress(e.key, false);
        }
    }
});

wordInput.addEventListener('input', () => {
    if (gameActive && !wordInput.disabled) {
        checkInputRealtime();
    }
});

// キー入力時のハイライト更新のみ（部分表示更新はinputイベントで処理）
wordInput.addEventListener('keyup', (e) => {
    if (gameActive && (e.key.length === 1 || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        highlightNextKey();
    }
});

window.addEventListener('load', () => {
    loadRecords();
    loadCustomLessons(); // カスタムレッスンを読み込み
    
    // レッスン記録を動的に生成
    generateLevelRecords();
    
    initLevelSelectors();
    
    // initGame()の代わりにbackToTitle()を呼び出す
    backToTitle();
    
    showRecords();
    
    // ゲーム中にフォーカスを維持するためのイベントリスナーを追加
    setupFocusManagement();
});

// 画面表示/非表示のヘルパー関数
function showModal(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    setTimeout(() => {
        element.classList.add('show');
    }, 10);
}

function hideModal(elementId) {
    const element = document.getElementById(elementId);
    element.classList.remove('show');
    setTimeout(() => {
        element.style.display = 'none';
    }, 400); // アニメーション完了を待つ
}

// フォーカス管理のセットアップ
function setupFocusManagement() {
    // ゲーム画面クリック時にフォーカスを戻す
    document.addEventListener('click', (e) => {
        if (gameActive && !wordInput.disabled) {
            // 一部の要素（ボタンなど）をクリックした場合は除外
            const clickedElement = e.target;
            const isInteractiveElement = clickedElement.tagName === 'BUTTON' || 
                                       clickedElement.tagName === 'INPUT' || 
                                       clickedElement.tagName === 'SELECT' ||
                                       clickedElement.classList.contains('level-selector') ||
                                       clickedElement.classList.contains('clear-records-btn');
            
            if (!isInteractiveElement) {
                wordInput.focus();
            }
        }
    });
    
    // ウィンドウフォーカス時にも入力フィールドにフォーカスを戻す
    window.addEventListener('focus', () => {
        if (gameActive && !wordInput.disabled) {
            wordInput.focus();
        }
    });
    
    // visibility change時にもフォーカスを戻す（タブ切り替え対応）
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && gameActive && !wordInput.disabled) {
            setTimeout(() => {
                wordInput.focus();
            }, 100);
        }
    });
}

function clearRecords() {
    if (confirm('すべての記録をクリアしますか？')) {
        records = {};
        
        // すべてのカスタムレッスンの記録を初期化
        customLessons.forEach(lesson => {
            records[`lesson${lesson.id}`] = [];
        });
        
        saveRecords();
        displayBestTimes();
    }
}

function hideRecords() {
    const recordsSidebar = document.querySelector('.records-sidebar');
    if (recordsSidebar) {
        recordsSidebar.style.display = 'none';
    }
}

function showRecords() {
    const recordsSidebar = document.querySelector('.records-sidebar');
    if (recordsSidebar) {
        recordsSidebar.style.display = 'block';
        displayBestTimes();
    }
}

function initLevelSelectors() {
    // updateLessonList()で動的に作成されるイベントリスナーを使用するため、
    // ここでは何もする必要がない
}

// レガシー関数: 次のキーをハイライト
function highlightNextKey() {
    keyboardManager.highlightNextKey();
}

// レガシー関数: キーボードリップルエフェクト
function createKeyboardRipple(keyElement, isError = false) {
    keyboardManager.createRippleEffect(keyElement, isError);
}

function initRecords() {
    if (!localStorage.getItem('typingRecords')) {
        records = {};
        
        // カスタムレッスンの記録のみ初期化
        records['level10'] = [];
        
        saveRecords();
    }
}

function showNewRecordMessage() {
    const newRecordMsg = document.createElement('div');
    newRecordMsg.className = 'new-record-message';
    newRecordMsg.textContent = '新記録達成！';
    
    document.body.appendChild(newRecordMsg);
    
    setTimeout(() => {
        newRecordMsg.style.opacity = '1';
        newRecordMsg.style.transform = 'translateY(0) scale(1)';
        
        setTimeout(() => {
            newRecordMsg.style.opacity = '0';
            newRecordMsg.style.transform = 'translateY(-50px) scale(0.8)';
            
            setTimeout(() => {
                newRecordMsg.remove();
            }, 500);
        }, 2000);
    }, 100);
}

function validateInput() {
    const currentWord = words[currentWordIndex].word;
    const userInput = wordInput.value.trim();
    
    return currentWord.toLowerCase() === userInput.toLowerCase();
}

// レッスン一覧を更新
function updateLessonList() {
    const recordsSidebar = document.querySelector('.records-sidebar');
    const clearButton = recordsSidebar.querySelector('.clear-records-btn');
    
    // 既存のレッスン記録を削除
    const existingRecords = recordsSidebar.querySelectorAll('.level-record');
    existingRecords.forEach(record => record.remove());
    
    // 保存されたレッスンがない場合は新規作成ボタンのみ表示
    if (customLessons.length === 0) {
        const newLessonRecord = document.createElement('div');
        newLessonRecord.className = 'level-record';
        
        const newLessonTitle = document.createElement('h3');
        newLessonTitle.className = 'level-selector create-lesson-btn';
        newLessonTitle.textContent = '+ 新しいレッスンを作成';
        // CSSクラスでスタイリングするため、inline styleを削除
        newLessonTitle.addEventListener('click', showCustomLessonSetup);
        
        newLessonRecord.appendChild(newLessonTitle);
        recordsSidebar.insertBefore(newLessonRecord, clearButton);
        return;
    }
    
    // 保存されたレッスンを表示
    customLessons.forEach((lesson, index) => {
        const levelRecord = document.createElement('div');
        levelRecord.className = 'level-record';
        
        const levelTitle = document.createElement('h3');
        levelTitle.className = 'level-selector';
        levelTitle.setAttribute('data-lesson-id', lesson.id);
        levelTitle.textContent = lesson.name;
        levelTitle.style.cursor = 'pointer';
        
        // レッスン選択時のイベントリスナー
        levelTitle.addEventListener('click', () => {
            if (gameActive && timerStarted) {
                if (!confirm(`現在のゲームを中断して「${lesson.name}」を開始しますか？`)) {
                    return;
                }
            }
            showLessonModeSelection(index);
        });
        
        const recordsList = document.createElement('ol');
        recordsList.id = `lesson${lesson.id}-records`;
        recordsList.className = 'best-time-display';
        
        levelRecord.appendChild(levelTitle);
        levelRecord.appendChild(recordsList);
        
        // クリアボタンの前に挿入
        recordsSidebar.insertBefore(levelRecord, clearButton);
    });
    
    // 新規作成ボタンを追加
    const newLessonRecord = document.createElement('div');
    newLessonRecord.className = 'level-record';
    
    const newLessonTitle = document.createElement('h3');
    newLessonTitle.className = 'level-selector create-lesson-btn';
    newLessonTitle.textContent = '+ 新しいレッスンを作成';
    // CSSクラスでスタイリングするため、inline styleを削除
    newLessonTitle.addEventListener('click', showCustomLessonSetup);
    
    newLessonRecord.appendChild(newLessonTitle);
    recordsSidebar.insertBefore(newLessonRecord, clearButton);
    
    // 記録を表示（重要：この行が欠けていた）
    displayBestTimes();
}

function generateLevelRecords() {
    updateLessonList();
}

// タイトルに戻る機能
function backToTitle() {
    if (gameActive && timerStarted) {
        if (!confirm('現在のゲームを中断してタイトル画面に戻りますか？')) {
            return;
        }
    }
    
    // カスタムレッスンのクリーンアップ
    isCustomLesson = false;
    lessonMode = 'full';
    
    // タイマーをリセット
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // ゲーム状態をリセット
    gameActive = false;
    timerStarted = false;
    
    // UIManagerを使用してタイトル画面を表示
    uiManager.showTitle();
    
    // 戻るボタンを非表示
    document.getElementById('back-to-title-btn').style.display = 'none';
    
    // すべてのレベルセレクターから選択状態を解除
    const levelSelectors = document.querySelectorAll('.level-selector');
    levelSelectors.forEach(selector => {
        selector.classList.remove('active');
    });
    
    // レベル表示を非表示
    document.querySelector('.level-display').style.display = 'none';
    
    // カスタムレッスン設定画面を非表示
    hideModal('custom-lesson-setup');
    
    // レッスンモード選択画面を非表示
    hideModal('lesson-mode-selection');
    
    // UIをリセット
    document.querySelector('.typing-area').style.display = 'block';
    document.querySelector('.keyboard-display-container').style.display = 'block';
    document.getElementById('word-input').style.display = 'inline-block';
    document.getElementById('meaning').style.display = 'block';
    
    // 記録を表示
    showRecords();
    
    // キーボードをリセット
    initKeyboardAnimation();
}

// 戻るボタンにイベントリスナーを追加
document.getElementById('back-to-title-btn').addEventListener('click', backToTitle);
