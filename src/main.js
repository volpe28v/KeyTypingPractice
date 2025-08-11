// Firebase imports
import { auth, db } from './firebase.ts';
import { AuthManager } from './auth.js';
import { FirestoreManager } from './firestore.js';

// Import level modules
import { VocabularyLearningLevel } from './levels/level0-vocabulary.js';
import { ProgressiveLearningLevel } from './levels/level1-progressive.js';
import { PronunciationMeaningLevel } from './levels/level2-pronunciation-meaning.js';
import { PronunciationOnlyLevel } from './levels/level3-pronunciation-only.js';
import { JapaneseReadingLevel } from './levels/level4-japanese-reading.js';
import { LevelManager } from './levels/level-manager.js';

// Level data - temporary inline definition
const levelLists = [
    {
        level: 10,
        description: "カスタムレッスン",
        words: []  // カスタム単語はユーザーが入力時に設定
    }
];

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
        console.log('playCorrectSound called with:', word);
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 1.2;
            utterance.pitch = 2.0;
            utterance.volume = 1.0;
            
            console.log('Speaking:', word);
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('speechSynthesis not available');
        }
    }

    // 単語を発音する関数（英語）
    speakWord(word) {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // 日本語を音声で読み上げる
    speakJapanese(text) {
        if (!text || text.trim() === '') return;
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // speak関数（speakWordのエイリアス - 互換性のため）
    speak(word) {
        this.speakWord(word);
    }
}

// AudioManagerのインスタンスを作成
const audioManager = new AudioManager();
// StorageManager: LocalStorage操作を管理するクラス（ハイブリッドストレージ対応）
class StorageManager {
    constructor() {
        this.firestoreManager = null;
        this.isOnline = navigator.onLine;
        
        // ネットワーク状態を監視
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Online - Hybrid storage available');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📱 Offline - LocalStorage only');
        });
    }

    // Firestoreマネージャーを設定
    setFirestoreManager(firestoreManager) {
        this.firestoreManager = firestoreManager;
        console.log('🔗 Firestore manager connected');
    }

    // カスタム単語をlocalStorageから読み込み（後方互換性のため維持）
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

    // カスタム単語をlocalStorageに保存（後方互換性のため維持）
    saveCustomWords(wordsText) {
        try {
            localStorage.setItem('customWords', wordsText);
        } catch (e) {
            console.error('カスタム単語の保存に失敗:', e);
        }
    }

    // 複数のカスタムレッスンを保存（ハイブリッド）
    async saveCustomLessons(lessons) {
        console.log('🔍 DEBUG - saveCustomLessons:');
        console.log('  isOnline:', this.isOnline);
        console.log('  firestoreManager:', !!this.firestoreManager);
        
        // ローカルストレージに保存（オフライン対応）
        try {
            localStorage.setItem('customLessons', JSON.stringify(lessons));
            console.log('💾 Lessons saved to LocalStorage');
        } catch (e) {
            console.error('❌ Error saving to LocalStorage:', e);
        }

        // オンライン時はFirestoreにも保存
        if (this.firestoreManager && this.isOnline) {
            try {
                // 各レッスンをFirestoreに保存
                for (const lesson of lessons) {
                    if (!lesson.firestoreId) {
                        // 新しいレッスンの場合
                        const firestoreId = await this.firestoreManager.saveCustomLesson(lesson);
                        if (firestoreId) {
                            lesson.firestoreId = firestoreId;
                        }
                    } else {
                        // 既存のレッスンの場合
                        await this.firestoreManager.updateCustomLesson(lesson.firestoreId, lesson);
                    }
                }
                
                // Firestore IDが更新された場合、LocalStorageも更新
                localStorage.setItem('customLessons', JSON.stringify(lessons));
                console.log('☁️ Lessons synced to Firestore');
            } catch (error) {
                console.error('❌ Error syncing to Firestore:', error);
            }
        }
    }

    // 複数のカスタムレッスンを読み込み（ハイブリッド）
    async loadCustomLessons() {
        let localLessons = [];
        
        // ローカルストレージから読み込み
        try {
            const saved = localStorage.getItem('customLessons');
            if (saved) {
                localLessons = JSON.parse(saved);
            }
            console.log(`💾 Loaded ${localLessons.length} lessons from LocalStorage`);
        } catch (e) {
            console.error('❌ Error loading from LocalStorage:', e);
        }

        // オンライン時はFirestoreからも読み込んで同期
        if (this.firestoreManager && this.isOnline) {
            try {
                const firestoreLessons = await this.firestoreManager.loadCustomLessons();
                
                // Firestoreのデータでローカルを更新（マージ）
                const mergedLessons = this.mergeLessons(localLessons, firestoreLessons);
                
                if (mergedLessons.length !== localLessons.length) {
                    localStorage.setItem('customLessons', JSON.stringify(mergedLessons));
                    console.log('🔄 Lessons synced from Firestore');
                }
                
                return mergedLessons;
            } catch (error) {
                console.error('❌ Error loading from Firestore:', error);
            }
        }

        return localLessons;
    }

    // レッスンのマージ処理
    mergeLessons(localLessons, firestoreLessons) {
        const merged = [...localLessons];
        
        for (const firestoreLesson of firestoreLessons) {
            const existingIndex = merged.findIndex(lesson => 
                lesson.firestoreId === firestoreLesson.id || 
                lesson.name === firestoreLesson.name
            );
            
            if (existingIndex >= 0) {
                // 既存のレッスンを更新
                merged[existingIndex] = {
                    ...firestoreLesson,
                    firestoreId: firestoreLesson.id
                };
            } else {
                // 新しいレッスンを追加
                merged.push({
                    ...firestoreLesson,
                    firestoreId: firestoreLesson.id
                });
            }
        }
        
        return merged;
    }

    // タイピング記録を保存（ハイブリッド）
    async saveRecords(records) {
        // ローカルストレージに保存
        try {
            localStorage.setItem('typingRecords', JSON.stringify(records));
            console.log('💾 Records saved to LocalStorage');
        } catch (e) {
            console.error('❌ Error saving records to LocalStorage:', e);
        }

        // オンライン時はFirestoreにも保存
        if (this.firestoreManager && this.isOnline) {
            try {
                // 各記録をFirestoreに保存（新しい記録のみ）
                for (const [levelName, levelRecords] of Object.entries(records)) {
                    if (Array.isArray(levelRecords)) {
                        for (const record of levelRecords) {
                            if (!record.firestoreId) {
                                const firestoreId = await this.firestoreManager.saveGameRecord({
                                    ...record,
                                    levelName
                                });
                                if (firestoreId) {
                                    record.firestoreId = firestoreId;
                                }
                            }
                        }
                    }
                }
                
                // Firestore IDが更新された場合、LocalStorageも更新
                localStorage.setItem('typingRecords', JSON.stringify(records));
                console.log('☁️ Records synced to Firestore');
            } catch (error) {
                console.error('❌ Error syncing records to Firestore:', error);
            }
        }
    }

    // タイピング記録を読み込み（ハイブリッド）
    async loadRecords() {
        let localRecords = {};
        
        // ローカルストレージから読み込み
        try {
            const savedRecords = localStorage.getItem('typingRecords');
            if (savedRecords) {
                localRecords = JSON.parse(savedRecords);
                
                // 古い形式のデータをクリーンアップ
                if (localRecords.total) {
                    delete localRecords.total;
                }
            }
            console.log('💾 Records loaded from LocalStorage');
        } catch (e) {
            console.error('❌ Error loading records from LocalStorage:', e);
        }

        // オンライン時はFirestoreからも読み込んで同期
        if (this.firestoreManager && this.isOnline) {
            try {
                const firestoreRecords = await this.firestoreManager.loadGameRecords();
                
                // Firestoreのデータをローカル形式にマージ
                const mergedRecords = this.mergeRecords(localRecords, firestoreRecords);
                
                if (Object.keys(mergedRecords).length !== Object.keys(localRecords).length) {
                    localStorage.setItem('typingRecords', JSON.stringify(mergedRecords));
                    console.log('🔄 Records synced from Firestore');
                }
                
                return mergedRecords;
            } catch (error) {
                console.error('❌ Error loading records from Firestore:', error);
            }
        }

        return localRecords;
    }

    // 記録のマージ処理
    mergeRecords(localRecords, firestoreRecords) {
        const merged = { ...localRecords };
        
        for (const firestoreRecord of firestoreRecords) {
            const levelName = firestoreRecord.levelName;
            
            if (!merged[levelName]) {
                merged[levelName] = [];
            }
            
            // 既存の記録をチェック
            const existingIndex = merged[levelName].findIndex(record => 
                record.firestoreId === firestoreRecord.id ||
                (record.date === firestoreRecord.date && 
                 record.elapsedTime === firestoreRecord.elapsedTime)
            );
            
            if (existingIndex >= 0) {
                // 既存の記録を更新
                merged[levelName][existingIndex] = {
                    ...firestoreRecord,
                    firestoreId: firestoreRecord.id
                };
            } else {
                // 新しい記録を追加
                merged[levelName].push({
                    ...firestoreRecord,
                    firestoreId: firestoreRecord.id
                });
            }
        }
        
        return merged;
    }

    // ネットワーク状態の取得
    getNetworkStatus() {
        return {
            isOnline: this.isOnline,
            hasFirestore: !!this.firestoreManager,
            canSync: this.isOnline && !!this.firestoreManager
        };
    }
}

// StorageManagerのインスタンスを作成（後でwindow.storageManagerで置き換え）
let storageManager = null; // DOMContentLoaded時に初期化
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

// LessonManagerのインスタンスを作成（後でwindow.lessonManagerで置き換え）
let lessonManager = null; // DOMContentLoaded時に初期化

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
        
        // Lv0: 単語学習モード関連
        this.vocabularyLearningCount = 0;
        this.vocabularyLearningMaxCount = 5;
        this.vocabularyLearningIsJapanese = false;
        
        // 隠れた文字選択機能関連
        this.hiddenLetters = [];
        this.shuffledChoices = [];
        this.playerSequence = [];
        this.currentChoiceIndex = 0;
        this.lastShuffledStep = -1; // 最後にシャッフルした段階を記録
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

    // 現在の単語を取得
    getCurrentWord() {
        if (this.currentWordIndex < this.words.length) {
            return this.words[this.currentWordIndex];
        }
        return null;
    }
    
    // 次の単語へ進む
    nextWord() {
        this.currentWordIndex++;
    }
    
    // ゲームが終了したかチェック
    isGameComplete() {
        return this.currentWordIndex >= this.words.length;
    }
    
    // タイマーを開始
    startTimer() {
        this.startTime = Date.now();
        this.timerStarted = true;
        return this.startTime;
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
    initProgressiveMode() {
        this.progressiveStep = 0;
    }
    
    // 段階的練習モードを進める
    advanceProgressiveStep() {
        this.progressiveStep++;
        // 文字選択状態をリセット
        this.resetLetterSelection();
    }
    
    // ミスをカウント（段階的練習モードの特別処理を含む）
    countMistake(visibleCharCount) {
        if (this.isCustomLesson && this.lessonMode === 'progressive' && visibleCharCount !== null) {
            // 段階的練習モードの場合、表示されている文字のミスはカウントしない
            // 実際には隠れた部分のミス処理を既存のロジックに任せる
        }
        
        this.mistakeCount++;
        this.currentWordMistake = true;  // ミス状態フラグを設定
        
        if (this.isCustomLesson && this.lessonMode === 'progressive') {
            this.consecutiveMistakes++;
            
            // 3回連続ミスで進捗を戻す
            if (this.consecutiveMistakes >= 3) {
                this.handleConsecutiveMistake();
            }
        }
    }
    
    // 連続ミスの処理
    handleConsecutiveMistake() {
        // 進捗を戻す処理
        const newProgressiveStep = Math.min(this.progressiveStep + 2, this.getCurrentWord().length);
        this.revertProgress(newProgressiveStep);
    }
    
    // 進捗を戻す（段階的練習モード）
    revertProgress(newProgressiveStep) {
        this.progressiveStep = newProgressiveStep;
    }
    
    // 連続ミスをリセット
    resetConsecutiveMistakes() {
        this.consecutiveMistakes = 0;
    }
    
    // 新しい単語用のリセット
    resetForNewWord() {
        this.currentWordMistake = false;
        if (this.isCustomLesson && this.lessonMode === 'progressive') {
            this.consecutiveMistakes = 0;
            this.currentCharPosition = 0;
            // 隠れた文字選択もリセット
            this.resetLetterSelection();
            this.lastShuffledStep = -1;
        }
    }
    
    // Lv0: 単語学習モード用のリセット
    resetVocabularyLearning() {
        this.vocabularyLearningCount = 0;
        this.vocabularyLearningIsJapanese = false;
    }

    // 隠れた文字選択機能の初期化
    initHiddenLetterChoices(word, visibleLength) {
        this.hiddenLetters = word.slice(visibleLength).split('');
        this.shuffledChoices = [...this.hiddenLetters];
        this.shuffleArray(this.shuffledChoices);
        this.playerSequence = [];
        this.currentChoiceIndex = 0;
    }
    
    // 文字選択の処理
    selectLetter(letter) {
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
    resetLetterSelection() {
        this.playerSequence = [];
        this.currentChoiceIndex = 0;
    }
    
    // 全ての文字が正しく選択されたかチェック
    isLetterSelectionComplete() {
        return this.currentChoiceIndex >= this.hiddenLetters.length;
    }
}

// 隠れた文字選択の表示を更新する関数
function displayHiddenLetterChoices() {
    const container = document.getElementById('hidden-letters-container');
    const lettersDiv = document.getElementById('hidden-letters');
    
    if (!gameManager.isCustomLesson || gameManager.lessonMode !== 'progressive') {
        container.style.display = 'none';
        return;
    }
    
    const currentWord = gameManager.getCurrentWord();
    const visibleCharCount = Math.max(0, currentWord.word.length - gameManager.progressiveStep);
    
    // 1文字以上隠れている場合に表示
    const hiddenCharCount = gameManager.progressiveStep;
    if (hiddenCharCount < 1) {
        container.style.display = 'none';
        return;
    }
    
    // 段階が変わった場合のみ選択肢を初期化
    if (gameManager.lastShuffledStep !== gameManager.progressiveStep) {
        gameManager.initHiddenLetterChoices(currentWord.word, visibleCharCount);
        gameManager.lastShuffledStep = gameManager.progressiveStep;
    }
    
    container.style.display = 'block';
    lettersDiv.innerHTML = '';
    
    // シャッフルされた文字ボタンを作成
    gameManager.shuffledChoices.forEach((letter, index) => {
        const button = document.createElement('button');
        button.className = 'letter-choice';
        button.textContent = letter;
        button.dataset.letter = letter;
        
        // 既にプレイヤーが選択済みの文字かチェック（同じ文字の選択回数を考慮）
        const selectedCount = gameManager.playerSequence.filter(selectedLetter => selectedLetter === letter).length;
        const totalCount = gameManager.shuffledChoices.filter(choiceLetter => choiceLetter === letter).length;
        const currentInstanceIndex = gameManager.shuffledChoices.slice(0, index).filter(choiceLetter => choiceLetter === letter).length;
        
        if (currentInstanceIndex < selectedCount) {
            button.classList.add('selected');
            button.disabled = true;
            button.classList.add('disabled');
        }
        
        lettersDiv.appendChild(button);
    });
}


// キーボード入力時に対応する選択肢ボタンの状態を更新する関数
function updateLetterChoiceButtons(userInput, currentWord) {
    if (!gameManager.isCustomLesson || gameManager.lessonMode !== 'progressive') {
        return;
    }
    
    const visibleCharCount = Math.max(0, currentWord.length - gameManager.progressiveStep);
    const hiddenStartIndex = visibleCharCount;
    
    // 隠れた部分の入力文字をチェック
    const hiddenInputPart = userInput.slice(hiddenStartIndex);
    
    // 選択肢ボタンを取得
    const letterButtons = document.querySelectorAll('.letter-choice');
    
    // hiddenLettersが初期化されていない場合は処理しない
    if (!gameManager.hiddenLetters || gameManager.hiddenLetters.length === 0) {
        return;
    }
    
    // 入力された隠れた文字に対応するボタンを緑色にする
    hiddenInputPart.split('').forEach((inputChar, index) => {
        const expectedChar = gameManager.hiddenLetters[index];
        
        // expectedCharが存在し、かつ文字列である場合のみ処理
        if (expectedChar && inputChar && inputChar.toLowerCase() === expectedChar.toLowerCase()) {
            // 対応するボタンを一つだけ見つけて緑色にする
            const availableButton = Array.from(letterButtons).find(button => 
                button.dataset.letter === expectedChar && 
                !button.classList.contains('selected') && 
                !button.disabled
            );
            
            if (availableButton) {
                availableButton.classList.add('selected');
                availableButton.disabled = true;
                availableButton.classList.add('disabled');
            }
        }
    });
}
    
// タイマーを開始


// GameManagerのインスタンスを作成
const gameManager = new GameManager(audioManager, storageManager);

// Level 0 (vocabulary-learning) のインスタンス
// 個別レベルインスタンス変数は削除済み（LevelManagerで統一管理）
// LevelManagerインスタンス（多態性によるレベル管理）
let levelManager = null;

// Level インスタンスを初期化する関数
function initializeLevelInstances() {
    // 個別レベルインスタンスは削除済み
    // LevelManagerで統一管理されているため、この関数は不要
    console.log('initializeLevelInstances: 個別インスタンス初期化は不要（LevelManager使用）');
}

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
        this.timerDisplay = document.getElementById('timer-display');
        this.replayAudioBtn = document.getElementById('replay-audio-btn');
    }
    
    // タイマー表示を更新
    updateTimerDisplay(timeMs) {
        this.timerDisplay.textContent = this.uiManager.formatTime(timeMs);
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
        
            // 日本語入力制御用の状態管理
        this.isComposing = false;
        
        // 日本語入力開始時の制御
        this.wordInput.addEventListener('compositionstart', (e) => {
            this.isComposing = true;
            this.showInputModeWarning();
            // 入力チェックを一時停止（グローバル変数を直接制御）
            const originalGameActive = gameActive;
            gameActive = false;
            // compositionend後にゲーム状態を復元
            this.pendingGameActive = originalGameActive;
        });
        
        // 日本語入力終了時の制御
        this.wordInput.addEventListener('compositionend', (e) => {
            this.isComposing = false;
            // 日本語入力された内容を完全にクリア
            this.wordInput.value = '';
            // ゲーム状態を復元
            if (this.pendingGameActive !== undefined) {
                gameActive = this.pendingGameActive;
                this.pendingGameActive = undefined;
            }
            // 警告を継続表示
            this.showInputModeWarning();
        });
        
        // 全角文字の入力を即座に除去
        this.wordInput.addEventListener('input', (e) => {
            // 日本語入力中は処理しない（compositionendで処理）
            if (this.isComposing) {
                return;
            }
            
            const value = e.target.value;
            // 全角文字（ひらがな、カタカナ、漢字、全角英数字）を検出
            if (/[^\x00-\x7F]/.test(value)) {
                this.showInputModeWarning();
                // 全角文字を即座に削除
                e.target.value = value.replace(/[^\x00-\x7F]/g, '');
            }
        });
        
        // キーボードイベントでIME関連キーをブロック
        this.wordInput.addEventListener('keydown', (e) => {
            // 半角/全角キー、変換キーなどをブロック
            if (e.key === 'Convert' || e.key === 'NonConvert' || 
                e.key === 'Zenkaku' || e.key === 'Hankaku' ||
                e.key === 'KanaMode' || e.key === 'Alphanumeric') {
                e.preventDefault();
                this.showInputModeWarning();
            }
        });
    }
    
    // 入力モード警告を表示
    showInputModeWarning() {
        this.showFeedback('❌ 日本語モードが検出されました。半角英数字モードに切り替えてください', 'incorrect');
        
        // 音声フィードバック（ミスタイプ音を再生）
        audioManager.playMistypeSound();
        
        // 入力フィールドの背景を一時的に赤くする
        this.wordInput.style.backgroundColor = '#ffebee';
        setTimeout(() => {
            this.wordInput.style.backgroundColor = '';
        }, 500);
        
        setTimeout(() => {
            if (this.feedback.textContent.includes('日本語モード')) {
                this.feedback.textContent = '';
                this.feedback.className = 'feedback';
            }
        }, 4000); // 表示時間を延長
    }
    
    // 入力フィールドを無効化/有効化
    setInputEnabled(enabled) {
        this.wordInput.disabled = !enabled;
        if (enabled) {
            this.wordInput.focus();
        }
    }
    
    // 時間をフォーマット（UIManager用）
    formatTime(timeMs) {
        const seconds = Math.floor(timeMs / 1000);
        const milliseconds = Math.floor((timeMs % 1000) / 10);
        return `${seconds}.${milliseconds.toString().padStart(2, '0')}秒`;
    }
    
    // スコア文字列を生成（共通メソッド）
    generateScoreText(elapsedTime, accuracyRate, mistakeCount) {
        return `正確率: ${accuracyRate}% | ミス: ${mistakeCount}回 | クリアタイム: ${this.formatTime(elapsedTime)}`;
    }
    
    // スコア表示を更新
    updateScoreDisplay(elapsedTime, accuracyRate, mistakeCount) {
        this.scoreDisplay.innerHTML = `
            <div>${this.generateScoreText(elapsedTime, accuracyRate, mistakeCount)}</div>
        `;
        this.scoreDisplay.style.display = 'block';
    }
    
    // スコア表示を隠す
    hideScoreDisplay() {
        this.scoreDisplay.style.display = 'none';
    }
    
    // ゲーム完了時の表示
    showGameComplete(isPerfect, mistakeCount, elapsedTime, accuracyRate) {
        if (isPerfect) {
            this.wordDisplay.innerHTML = '<span style="color: #ffcc00; font-size: 1.2em;">パーフェクト！</span>';
            this.showFeedback('おめでとうございます！', 'correct');
        } else {
            this.wordDisplay.innerHTML = '<span style="color: #66bb6a; font-size: 1.2em;">クリア！</span>';
        }
        this.meaningDisplay.innerHTML = `
            <div>${this.generateScoreText(elapsedTime, accuracyRate, mistakeCount)}</div>
            <div style="margin-top: 10px; font-size: 0.8em; color: #90a4ae;">Enter: もう一度 | Escape: レッスン選択に戻る</div>
        `;
        // クリア時はmeaningDisplayを強制的に表示する
        this.meaningDisplay.style.display = 'block';
        this.wordInput.placeholder = "";
        // スコア表示エリアは非表示にする
        this.scoreDisplay.style.display = 'none';
        // 発音ボタンを非表示にする
        this.replayAudioBtn.style.display = 'none';
    }
    
    // タイトル画面の表示
    showTitle() {
        this.wordDisplay.innerHTML = '';
        this.meaningDisplay.textContent = '左のサイドバーからレッスンを選択してください';
        this.timerDisplay.textContent = "00.00";
        this.timerDisplay.style.display = 'none';
        this.replayAudioBtn.style.display = 'none';
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

// レベルインスタンスを初期化
initializeLevelInstances();



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

// カスタムレッスン関連の変数 → GameManagerに移行済み
let customWords = []; // LessonManagerで管理される単語データ
let customLessons = []; // 複数のカスタムレッスンを保存
let selectedLessonForMode = null; // モード選択画面で選択されたレッスン
let autoProgressTimer = null; // 自動進行タイマー（UI制御用）

// 段階的練習モード関連の変数 → GameManagerに移行済み

// AudioManagerクラスの関数を直接使用するため、レガシーラッパー関数を削除



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

// 複数のカスタムレッスンを読み込み（非同期対応）
async function loadCustomLessons() {
    try {
        customLessons = await storageManager.loadCustomLessons();
        // 配列でない場合の安全チェック
        if (!Array.isArray(customLessons)) {
            console.warn('⚠️ customLessons is not an array, initializing as empty array');
            customLessons = [];
        }
        console.log(`📚 Loaded ${customLessons.length} custom lessons`);
    } catch (error) {
        console.error('❌ Error loading custom lessons:', error);
        customLessons = [];
    }
}

// 新しいレッスンを保存
function saveNewLesson() {
    return lessonManager.saveNewLesson(customLessons, updateLessonList);
}

// 新しいレッスンを保存のみ（学習開始なし）
function saveNewLessonOnly() {
    const success = lessonManager.saveNewLesson(customLessons, updateLessonList);
    if (success) {
        // 入力フィールドをクリア
        document.getElementById('lesson-name-input').value = '';
        document.getElementById('custom-words-input').value = '';
        
        // モーダルを閉じてタイトル画面に戻る
        hideModal('custom-lesson-setup');
        backToTitle();
    }
}

// 新しいレッスンを保存して指定モードで開始
function saveAndStartLesson(mode) {
    const input = document.getElementById('custom-words-input').value;
    
    // 入力値をバリデーション
    if (!input.trim()) {
        alert('単語を入力してください。');
        return;
    }
    
    // まずレッスンを保存
    const success = lessonManager.saveNewLesson(customLessons, updateLessonList);
    if (!success) {
        return; // 保存に失敗した場合は終了
    }
    
    // 保存されたレッスンの中から最新のものを取得
    const newestLesson = customLessons.reduce((max, lesson, index, array) => 
        lesson.id > array[max].id ? index : max, 0
    );
    
    // カスタム単語を解析
    customWords = parseCustomWords(input);
    
    if (customWords.length === 0) {
        alert('有効な単語が入力されていません。正しい形式で入力してください。');
        return;
    }
    
    // レッスンモードを設定
    lessonMode = mode;
    isCustomLesson = true;
    currentLessonIndex = newestLesson;
    
    // 入力フィールドをクリア
    document.getElementById('lesson-name-input').value = '';
    document.getElementById('custom-words-input').value = '';
    
    // UIをゲームモードに変更
    hideModal('custom-lesson-setup');
    
    // ゲーム画面の要素を表示
    document.querySelector('.typing-area').style.display = 'block';
    document.querySelector('.keyboard-display-container').style.display = 'block';
    document.getElementById('back-to-title-btn').style.display = 'block';
    
    // レベル10でゲームを開始（カスタムレッスン用）
    currentLevel = 10;
    
    // レベルリストのカスタムレッスンに単語を設定
    const customLevel = levelLists.find(level => level.level === 10);
    if (customLevel) {
        customLevel.words = customWords;
    }
    
    // サイドバーを非表示にする
    hideRecords();
    
    // ゲーム初期化と開始
    initGame();
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
    // デフォルトでprogressiveモードを選択状態にする
    const progressiveButton = document.querySelector('[data-mode="progressive"]');
    if (progressiveButton) {
        progressiveButton.classList.add('selected');
    }
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
    
    // モードボタンの選択状態をリセット
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('selected'));
    
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
        editToggle.textContent = 'キャンセル';
        
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
    editToggle.textContent = '編集';
    
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
// モードボタンクリックでレッスンを開始
function startLessonWithMode(mode) {
    if (!selectedLessonForMode) {
        alert('レッスンが選択されていません。');
        return;
    }
    
    const { lesson, index } = selectedLessonForMode;
    
    currentLessonIndex = index;
    
    // カスタム単語を設定
    customWords = lesson.words;
    
    // モードを設定
    lessonMode = mode;
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

// カスタムレッスン用の選択モード変数
let selectedCustomMode = 'progressive';

// カスタムモードを選択
function selectCustomMode(mode) {
    selectedCustomMode = mode;
    
    // 全てのボタンの選択状態をリセット
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 選択されたボタンに選択状態を適用
    document.querySelector(`[data-mode="${mode}"]`).classList.add('selected');
}

// カスタムレッスンを開始
function startCustomLesson() {
    const input = document.getElementById('custom-words-input').value;
    
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
    lessonMode = selectedCustomMode;
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
    
    initGame();
}

// 正解時に効果音を再生する関数


// LevelManagerの初期化（レベルクラスが利用可能になった後）
function initializeLevelManager() {
    if (!levelManager) {
        levelManager = new LevelManager(gameManager, audioManager, uiManager);
    }
}

function initGame() {
    // LevelManagerを初期化
    initializeLevelManager();
    
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
    
    // レッスン開始時の音声再生に1秒のタイムラグを追加（初回は音声なし、入力もクリアしない）
    setTimeout(() => {
        displayWord(false, false); // 初回は音声を鳴らさず、入力もクリアしない
    }, 1000);
    
    uiManager.updateProgressBar(currentWordIndex, words.length);
    scoreDisplay.style.display = 'none';
    wordInput.value = '';
    wordInput.focus();
    
    // IMEを無効化してアルファベット入力を強制
    uiManager.forceAlphabetInput();
    
    gameActive = true;
    timerStarted = false;
    
    // レッスン開始直後から戻るボタンを表示
    document.getElementById('back-to-title-btn').style.display = 'block';
    
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
    

    
    keyboardManager.initAnimation();
    
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

// Lv0: 単語学習モード用のアクセサー
Object.defineProperty(window, 'vocabularyLearningCount', {
    get: () => gameManager.vocabularyLearningCount,
    set: (value) => { gameManager.vocabularyLearningCount = value; }
});

Object.defineProperty(window, 'vocabularyLearningMaxCount', {
    get: () => gameManager.vocabularyLearningMaxCount,
    set: (value) => { gameManager.vocabularyLearningMaxCount = value; }
});

Object.defineProperty(window, 'vocabularyLearningIsJapanese', {
    get: () => gameManager.vocabularyLearningIsJapanese,
    set: (value) => { gameManager.vocabularyLearningIsJapanese = value; }
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
    
    // 既存の最良記録を取得
    let shouldSaveNewRecord = false;
    
    if (records[levelKey].length === 0) {
        // 記録がない場合は新記録として保存
        shouldSaveNewRecord = true;
    } else {
        // 既存記録から最良記録を取得（正確率優先、同じ場合は時間優先）
        const currentBestRecord = records[levelKey].reduce((best, current) => {
            const currentAccuracy = current.accuracy !== undefined ? current.accuracy : 100;
            const bestAccuracy = best.accuracy !== undefined ? best.accuracy : 100;
            const currentTime = current.time || current;
            const bestTime = best.time || best;
            
            if (currentAccuracy > bestAccuracy) {
                return current;
            } else if (currentAccuracy === bestAccuracy && currentTime < bestTime) {
                return current;
            }
            return best;
        });
        
        const currentBestAccuracy = currentBestRecord.accuracy !== undefined ? currentBestRecord.accuracy : 100;
        const currentBestTime = currentBestRecord.time || currentBestRecord;
        
        // 新記録の判定：正確率が高い、または正確率が同じで時間が短い場合
        if (accuracy > currentBestAccuracy || (accuracy === currentBestAccuracy && time < currentBestTime)) {
            shouldSaveNewRecord = true;
        }
    }
    
    if (shouldSaveNewRecord) {
        records[levelKey] = [newRecord];
        saveRecords();
        
        showNewRecordMessage();
    }
}

// レガシー関数: 時間をフォーマット


function displayBestTimes() {
    // すべてのカスタムレッスンの記録を表示
    customLessons.forEach(lesson => {
        const lessonRecords = records[`lesson${lesson.id}`] || [];
        const lessonRecordsList = document.getElementById(`lesson${lesson.id}-records`);
        
        if (lessonRecordsList) {
            lessonRecordsList.innerHTML = '';
            
            if (lessonRecords.length > 0) {
                // 新しい記録形式と古い記録形式を統一的に処理（正確率優先、同じ場合は時間優先）
                const bestRecord = lessonRecords.reduce((best, current) => {
                    const currentAccuracy = current.accuracy !== undefined ? current.accuracy : 100;
                    const bestAccuracy = best.accuracy !== undefined ? best.accuracy : 100;
                    const currentTime = current.time || current;
                    const bestTime = best.time || best;
                    
                    if (currentAccuracy > bestAccuracy) {
                        return current;
                    } else if (currentAccuracy === bestAccuracy && currentTime < bestTime) {
                        return current;
                    }
                    return best;
                });
                
                const li = document.createElement('li');
                const recordTime = bestRecord.time || bestRecord;
                const recordAccuracy = bestRecord.accuracy !== undefined ? bestRecord.accuracy : 100;
                
                li.innerHTML = `<span style="color: var(--color-success); font-size: 1.2rem; font-weight: bold;">${recordAccuracy}%</span><br><small style="color: var(--text-muted);">${uiManager.formatTime(recordTime)}</small>`;
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
const timerDisplay = uiManager.timerDisplay;



function startTimer() {
    // Lv0: 単語学習モードではタイマーを開始しない
    if (isCustomLesson && lessonMode === 'vocabulary-learning') {
        return;
    }
    
    startTime = Date.now();
    timerStarted = true;
    timerInterval = setInterval(() => {
        // ゲーム中はタイマー表示を更新しない（表示は非表示のまま）
        // const elapsedTime = Date.now() - startTime;
        // timerDisplay.textContent = uiManager.formatTime(elapsedTime);
    }, 10);
    
    // タイマー表示を非表示にする
    timerDisplay.style.display = 'none';
    
    hideRecords();
    
    // レッスン開始直後から戻るボタンを表示
    document.getElementById('back-to-title-btn').style.display = 'block';
}


// レガシー関数: 配列をシャッフル


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
    
    // 隠れた文字選択の表示を更新
    displayHiddenLetterChoices();
    
    // キーボード入力に対応する選択肢ボタンの状態を更新
    updateLetterChoiceButtons(userInput, currentWord);
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

function displayWord(playAudio = true, clearInput = true) {
    if (currentWordIndex < words.length) {
        const currentWord = words[currentWordIndex];
        
        // 音声再生ボタンを表示
        uiManager.replayAudioBtn.style.display = 'block';
        
        if (currentWord && currentWord.word) {
            // レベルマネージャーでのレベル設定と多態性による初期化
            if (isCustomLesson) {
                // LevelManagerでレベルを設定
                if (levelManager && levelManager.setLevel(lessonMode)) {
                    // 多態性による単語初期化（フォールバックなし）
                    levelManager.initializeWord(currentWord, playAudio, clearInput);
                } else {
                    // LevelManagerが利用できない場合の最小限フォールバック
                    console.warn('LevelManager not available, using fallback');
                    wordDisplay.innerHTML = currentWord.word.split('').map(char => `<span>${char}</span>`).join('');
                    meaningDisplay.textContent = currentWord.meaning;
                    meaningDisplay.style.display = 'block';
                    wordInput.style.display = 'inline-block';
                    if (clearInput) {
                        wordInput.value = '';
                    }
                    if (playAudio) {
                        audioManager.speakWord(currentWord.word);
                    }
                }
            } else {
                // 通常モード：単語を表示
                wordDisplay.innerHTML = currentWord.word.split('').map(char => `<span>${char}</span>`).join('');
                meaningDisplay.textContent = currentWord.meaning;
                meaningDisplay.style.display = 'block';
                wordInput.style.display = 'inline-block';
                if (clearInput) {
                    wordInput.value = '';
                }
                wordInput.focus();
                
                // 通常モードでの音声再生
                if (playAudio) {
                    audioManager.speakWord(currentWord.word);
                }
            }
            
            feedback.textContent = '';
            feedback.className = 'feedback';
            
            // キーボードハイライトを表示
            keyboardManager.highlightNextKey();
            
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
        // Lv0: 単語学習モードの完了処理
        if (isCustomLesson && lessonMode === 'vocabulary-learning') {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            
            // Lv0モード用の完了メッセージを表示
            wordDisplay.innerHTML = '<span style="color: #00ff41; font-size: 1.5em;">🎉 単語学習完了！</span>';
            meaningDisplay.textContent = '全ての単語を学習しました。お疲れさまでした！';
            feedback.textContent = 'Escapeキーでレッスン選択画面に戻ります';
            
            // 効果音を再生
            audioManager.playCorrectSound("congratulations");
            
            // ゲームを非アクティブにして自動再開を防ぐ
            gameActive = false;
            
            // 音声再生ボタンを非表示
            uiManager.replayAudioBtn.style.display = 'none';
            
            // 入力フィールドの値をクリア
            wordInput.value = '';
            
            // レッスン選択用のキーイベントのみ設定
            setupVocabularyLearningCompleteKeyEvents();
            
            // Lv0モード専用処理のため、後続の共通処理をスキップ
            return;
        } else {
            // 通常モードの完了処理
            endTime = Date.now();
            const elapsedTime = endTime - startTime;
            
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            
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
            
            const isPerfect = mistakeCount === 0;
            
            // UIManagerを使用してゲーム完了時の表示
            uiManager.showGameComplete(isPerfect, mistakeCount, elapsedTime, accuracyRate);
            
            // 効果音を再生
            if (isPerfect) {
                audioManager.playCorrectSound("congratulations");
            } else {
                audioManager.playCorrectSound("complete");
            }
        }
        
        // クリア後はレッスンリストを非表示にする
        hideRecords();
        
        gameActive = false;
        
        wordInput.value = '';
        wordInput.focus();
        
        // クリア後のキーボードイベントを設定
        setupClearScreenKeyEvents();
    }
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
        // カスタムレッスンの場合、LevelManagerを使用した多態性バリデーション
        if (isCustomLesson && levelManager && levelManager.getCurrentLevel()) {
            // LevelManagerで設定済みレベルのバリデーション処理を呼び出し
            if (!levelManager.validateInput(e, currentWord)) {
                highlightWrongChar(currentPosition);
                e.preventDefault();
                return false;
            }
        } else {
            // 通常モードまたはLevelManagerが利用できない場合
            mistakeCount++;
            currentWordMistake = true;
        }
        
        highlightWrongChar(currentPosition);
        e.preventDefault();
        return false;
    }
    
    // 正解の場合は連続ミス数をリセット（段階的練習モード用）
    if (isCorrect && isCustomLesson && lessonMode === 'progressive') {
        consecutiveMistakes = 0;
        currentCharPosition = currentPosition;
    }
    
    return true;
}

function highlightWrongChar(position) {
    // スペル隠しモードと段階的練習モードでは何もしない（各モードの表示関数で処理する）
    if (isCustomLesson && (lessonMode === 'vocabulary-learning' || lessonMode === 'pronunciation-only' || lessonMode === 'pronunciation-meaning' || lessonMode === 'progressive' || lessonMode === 'japanese-reading')) {
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
    // 日本語入力中は処理を無視
    if (uiManager.isComposing) {
        return;
    }
    
    const currentWord = words[currentWordIndex].word;
    const userInput = wordInput.value.trim();
    
    // カスタムレッスンの非表示モードでの部分表示更新
    updatePartialWordDisplay();
    
    if (userInput.toLowerCase() === currentWord.toLowerCase()) {
        // 単語完了処理
        if (isCustomLesson && levelManager && levelManager.getCurrentLevel()) {
            // LevelManagerを使用した多態性による完了処理
            const result = levelManager.handleWordComplete();
            
            if (result === 'next_word') {
                // 次の単語へ進む（遅延処理はレベル側で実装済み）
                setTimeout(() => {
                    currentWordIndex++;
                    correctCount++;
                    
                    uiManager.updateProgressBar(currentWordIndex, words.length);
                    displayWord();
                }, 1500);
            }
            // 'continue_word'の場合は何もしない（レベル側で処理済み）
            
        } else {
            // 通常モードまたはフォールバック処理
            let correctHTML = '';
            for (let i = 0; i < currentWord.length; i++) {
                correctHTML += `<span class="correct-char">${currentWord[i]}</span>`;
            }
            wordDisplay.innerHTML = correctHTML;
            
            // ミスがなかった場合は"excellent"、ミスがあった場合は"good"と表示
            if (!currentWordMistake) {
                feedback.textContent = 'Excellent!';
                audioManager.playCorrectSound("excellent");
            } else {
                feedback.textContent = 'Good!';
                audioManager.playCorrectSound("good");
            }
            feedback.className = 'feedback correct';
            
            // 遅延を追加して、緑色の状態を見えるようにする
            setTimeout(() => {
                currentWordIndex++;
                correctCount++;
                
                uiManager.updateProgressBar(currentWordIndex, words.length);
                displayWord();
            }, 500);
            
            // 入力フィールドを一時的に無効化
            wordInput.disabled = true;
            setTimeout(() => {
                wordInput.disabled = false;
                wordInput.focus();
            }, 500);
        }
        
        return;
    }
    
    // リアルタイム入力チェック（未完了状態）
    if (isCustomLesson && levelManager && levelManager.getCurrentLevel()) {
        // LevelManagerを使用した多態性によるリアルタイムチェック
        levelManager.checkInputRealtime();
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
    
    keyboardManager.highlightNextKey();
}

wordInput.addEventListener('keydown', (e) => {
    if (!timerStarted && gameActive) {
        startTimer();
        // 最初のキー入力時にAudioContextを初期化
        audioManager.initAudioContext();
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
        // Lv0: 単語学習モード専用の処理
        if (gameActive && isCustomLesson && lessonMode === 'vocabulary-learning') {
            if (level0Instance) {
                const currentWord = words[currentWordIndex];
                const result = level0Instance.handleKeyInput(e, currentWord);
                
                if (result === 'next_word') {
                    currentWordIndex++;
                    displayWord();
                }
                return;
            } else {
                // フォールバック: 従来のロジック
                e.preventDefault();
                const currentWord = words[currentWordIndex];
                
                if (currentWord && currentWord.word) {
                    if (!vocabularyLearningIsJapanese) {
                        // 日本語を読み上げ
                        audioManager.speakJapanese(currentWord.meaning);
                        vocabularyLearningIsJapanese = true;
                        feedback.textContent = `Enter/Spaceで英語を聞く (${vocabularyLearningCount}/${vocabularyLearningMaxCount})`;
                    } else {
                        // 英語を読み上げてカウントアップ
                        audioManager.speakWord(currentWord.word);
                        vocabularyLearningIsJapanese = false;
                        vocabularyLearningCount++;
                        
                        // 規定回数に達したら次の単語へ
                        if (vocabularyLearningCount >= vocabularyLearningMaxCount) {
                            currentWordIndex++;
                            displayWord();
                        } else {
                            feedback.textContent = `Enter/Spaceで日本語を聞く (${vocabularyLearningCount}/${vocabularyLearningMaxCount})`;
                        }
                    }
                }
                return;
            }
        }
        
        if (!gameActive) {
            if (currentWordIndex >= words.length) {
                initGame();
            }
        }
    } else if (gameActive) {
        // Backspaceの特別な処理
        if (e.key === 'Backspace') {
            // Backspace音を再生
            audioManager.playTypingSound();
            return; // 以下の処理をスキップ（updatePartialWordDisplayはinputイベントで処理される）
        }
        
        if (validateKeyInput(e)) {
            // 正しいキー入力の場合
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                audioManager.playTypingSound();
            }
            
            // KeyboardManagerを使用してキープレスを表示
            keyboardManager.showKeyPress(e.key, true);
            
            setTimeout(() => keyboardManager.highlightNextKey(), 50);
        } else {
            // 間違ったキー入力の場合
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                audioManager.playMistypeSound();
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
        keyboardManager.highlightNextKey();
    }
});

// Lv0: 単語学習モード用のdocumentレベルキーハンドラ
document.addEventListener('keydown', (e) => {
    // Lv0モードで入力フィールドが非表示の場合のキーハンドラ
    if (gameActive && isCustomLesson && lessonMode === 'vocabulary-learning' && 
        wordInput.style.display === 'none' && (e.key === 'Enter' || e.key === ' ')) {
        
        if (levelManager && levelManager.getCurrentLevel() && levelManager.getCurrentLevel().handleKeyInput) {
                const currentWord = words[currentWordIndex];
                const result = levelManager.handleKeyInput(e, currentWord);
                
                if (result === 'next_word') {
                    currentWordIndex++;
                    displayWord();
                }
            } else {
            // フォールバック: 従来のロジック
            e.preventDefault();
            const currentWord = words[currentWordIndex];
            
            if (currentWord && currentWord.word) {
                if (!vocabularyLearningIsJapanese) {
                    // 日本語を読み上げ
                    audioManager.speakJapanese(currentWord.meaning);
                    vocabularyLearningIsJapanese = true;
                    feedback.textContent = `Enter/Spaceで英語を聞く (${vocabularyLearningCount}/${vocabularyLearningMaxCount})`;
                } else {
                    // 英語を読み上げてカウントアップ
                    audioManager.speakWord(currentWord.word);
                    vocabularyLearningIsJapanese = false;
                    vocabularyLearningCount++;
                    
                    // 規定回数に達したら次の単語へ
                    if (vocabularyLearningCount >= vocabularyLearningMaxCount) {
                        currentWordIndex++;
                        displayWord();
                    } else {
                        feedback.textContent = `Enter/Spaceで日本語を聞く (${vocabularyLearningCount}/${vocabularyLearningMaxCount})`;
                    }
                }
            }
        }
    }
});

window.addEventListener('load', async () => {
    loadRecords();
    await loadCustomLessons(); // カスタムレッスンを読み込み（非同期）
    
    // レッスン記録を動的に生成
    updateLessonList();
    

    
    // カスタムレッスンがある場合は一番新しいレッスンを自動選択、ない場合はタイトル表示
    if (customLessons.length > 0) {
        // 一番新しいレッスン（最大ID）のインデックスを取得
        const newestLesson = customLessons.reduce((max, lesson, index, array) => 
            lesson.id > array[max].id ? index : max, 0
        );
        // 一番新しいレッスンを自動選択してモード選択画面を表示
        setTimeout(() => {
            showLessonModeSelection(newestLesson);
        }, 100);
    } else {
        // カスタムレッスンがない場合は新しいレッスンを追加画面を表示
        showCustomLessonSetup();
    }
    
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



// レッスン一覧を更新
function updateLessonList() {
    const recordsSidebar = document.querySelector('.records-sidebar');
    const clearButton = recordsSidebar.querySelector('.clear-records-btn');
    
    // 既存のレッスン記録を削除
    const existingRecords = recordsSidebar.querySelectorAll('.level-record');
    existingRecords.forEach(record => record.remove());
    
    // 新規作成ボタンを最上位に追加
    const newLessonRecord = document.createElement('div');
    newLessonRecord.className = 'level-record';
    
    const newLessonTitle = document.createElement('h3');
    newLessonTitle.className = 'level-selector create-lesson-btn';
    newLessonTitle.textContent = '+ 新しいレッスンを作成';
    newLessonTitle.addEventListener('click', showCustomLessonSetup);
    
    newLessonRecord.appendChild(newLessonTitle);
    recordsSidebar.insertBefore(newLessonRecord, clearButton);
    
    // 配列の安全チェック
    if (!Array.isArray(customLessons) || customLessons.length === 0) {
        console.log('📚 No custom lessons to display');
        return;
    }
    
    // カスタムレッスンを新しい順（ID降順）で表示
    const sortedLessons = [...customLessons].sort((a, b) => b.id - a.id);
    
    sortedLessons.forEach((lesson) => {
        // 元のインデックスを取得（showLessonModeSelectionで使用するため）
        const originalIndex = customLessons.findIndex(l => l.id === lesson.id);
        
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
            showLessonModeSelection(originalIndex);
        });
        
        const recordsList = document.createElement('ol');
        recordsList.id = `lesson${lesson.id}-records`;
        recordsList.className = 'best-time-display';
        
        levelRecord.appendChild(levelTitle);
        levelRecord.appendChild(recordsList);
        
        // クリアボタンの前に挿入
        recordsSidebar.insertBefore(levelRecord, clearButton);
    });
    
    // 記録を表示
    displayBestTimes();
}



// タイトルに戻る機能
function backToTitle() {
    if (gameActive && timerStarted) {
        if (!confirm('現在のゲームを中断してレッスン選択に戻りますか？')) {
            return;
        }
    }
    
    // クリア画面のキーイベントを削除
    if (clearScreenKeyHandler) {
        document.removeEventListener('keydown', clearScreenKeyHandler);
        clearScreenKeyHandler = null;
    }
    
    // タイマーをリセット
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // ゲーム状態をリセット
    gameActive = false;
    timerStarted = false;
    
    // 戻るボタンを非表示
    document.getElementById('back-to-title-btn').style.display = 'none';
    
    // UIをリセット
    document.querySelector('.typing-area').style.display = 'block';
    document.querySelector('.keyboard-display-container').style.display = 'block';
    document.getElementById('word-input').style.display = 'inline-block';
    document.getElementById('meaning').style.display = 'block';
    
    // 記録を表示
    showRecords();
    
    // キーボードをリセット
    keyboardManager.initAnimation();
    
    // 現在のレッスンが選択されている場合は、そのレッスンのモード選択画面を表示
    if (selectedLessonForMode && selectedLessonForMode.index !== undefined) {
        showLessonModeSelection(selectedLessonForMode.index);
    } else {
        // レッスンが選択されていない場合は、最初のレッスンを選択
        if (customLessons.length > 0) {
            showLessonModeSelection(0);
        } else {
            // カスタムレッスンがない場合は新しいレッスンを追加画面を表示
            showCustomLessonSetup();
        }
    }
}

// 戻るボタンにイベントリスナーを追加
document.getElementById('back-to-title-btn').addEventListener('click', backToTitle);

// クリア後のキーボードイベント管理
let clearScreenKeyHandler = null;

function setupClearScreenKeyEvents() {
    // 既存のイベントリスナーを削除
    if (clearScreenKeyHandler) {
        document.removeEventListener('keydown', clearScreenKeyHandler);
    }
    
    clearScreenKeyHandler = function(event) {
        if (event.key === 'Enter') {
            // エンターキーで同じレッスンをリスタート
            event.preventDefault();
            restartCurrentLesson();
        } else if (event.key === 'Escape') {
            // エスケープキーでレッスン選択画面に戻る
            event.preventDefault();
            backToTitle();
        }
    };
    
    document.addEventListener('keydown', clearScreenKeyHandler);
}

// Lv0: 単語学習モード完了時専用のキーイベント処理
function setupVocabularyLearningCompleteKeyEvents() {
    // 既存のイベントリスナーを削除
    if (clearScreenKeyHandler) {
        document.removeEventListener('keydown', clearScreenKeyHandler);
    }
    
    clearScreenKeyHandler = function(event) {
        if (event.key === 'Escape') {
            // エスケープキーでレッスン選択画面に戻る
            event.preventDefault();
            backToTitle();
        }
        // Enterキーでの再開は無効（何も処理しない）
    };
    
    document.addEventListener('keydown', clearScreenKeyHandler);
}

function restartCurrentLesson() {
    // クリア画面のキーイベントを削除
    if (clearScreenKeyHandler) {
        document.removeEventListener('keydown', clearScreenKeyHandler);
        clearScreenKeyHandler = null;
    }
    
    // 同じレッスンを再開
    if (selectedLessonForMode && selectedLessonForMode.lesson) {
        // カスタムレッスンの場合
        const { lesson, index } = selectedLessonForMode;
        currentLessonIndex = index;
        customWords = lesson.words;
        isCustomLesson = true;
        
        // 現在のモードでゲーム開始
        hideModal('lesson-mode-selection');
        
        // ゲーム画面の要素を表示
        document.querySelector('.typing-area').style.display = 'block';
        document.querySelector('.keyboard-display-container').style.display = 'block';
        document.getElementById('back-to-title-btn').style.display = 'block';
        
        initGame();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase Authentication first
    window.authManager = new AuthManager();
    
    // Setup login event handler
    const googleSignInBtn = document.getElementById('google-sign-in-btn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            window.authManager.signInWithGoogle();
        });
    }
    
    // Temporary fix: create global instances for compatibility
    window.audioManager = new AudioManager();
    window.storageManager = new StorageManager();
    storageManager = window.storageManager; // グローバル変数も更新
    window.lessonManager = new LessonManager(window.storageManager);
    lessonManager = window.lessonManager; // グローバル変数も更新
    window.gameManager = new GameManager(window.audioManager, window.storageManager);
    window.uiManager = new UIManager();
    window.keyboardManager = new KeyboardManager();
    
    // Setup Firestore integration after authentication
    window.authManager.auth.onAuthStateChanged((user) => {
        if (user) {
            // Initialize Firestore manager with user ID
            const firestoreManager = new FirestoreManager(user.uid);
            window.storageManager.setFirestoreManager(firestoreManager);
            console.log('🔗 Firestore connected for user:', user.displayName);
        } else {
            // User logged out, remove Firestore connection
            window.storageManager.setFirestoreManager(null);
            console.log('🔌 Firestore disconnected');
        }
    });
    
    // Make level classes available globally
    window.LevelManager = LevelManager;
    window.VocabularyLearningLevel = VocabularyLearningLevel;
    window.ProgressiveLearningLevel = ProgressiveLearningLevel;
    window.PronunciationMeaningLevel = PronunciationMeaningLevel;
    window.PronunciationOnlyLevel = PronunciationOnlyLevel;
    window.JapaneseReadingLevel = JapaneseReadingLevel;
    
    // Initialize the app like the original script.js
    if (typeof initApp === 'function') {
        initApp();
    } else {
        // Call the original initialization code (非同期対応)
        loadCustomLessons().then(() => {
            console.log('📚 Custom lessons initialized');
        });
    }
});

// Define replayCurrentWord function (for audio replay button)
function replayCurrentWord() {
    // This function will be implemented when audio features are restored
    console.log('replayCurrentWord: Audio replay not yet implemented in Vite version');
    // TODO: Implement audio replay functionality
    if (window.audioManager && window.gameManager) {
        // Get current word and replay audio
        const currentWord = window.gameManager.getCurrentWord ? window.gameManager.getCurrentWord() : null;
        if (currentWord && window.audioManager.speak) {
            window.audioManager.speak(currentWord.word);
        }
    }
}

// Export functions to global scope for HTML onclick events
window.saveNewLessonOnly = saveNewLessonOnly;
window.cancelCustomLesson = cancelCustomLesson;
window.saveAndStartLesson = saveAndStartLesson;
window.startLessonWithMode = startLessonWithMode;
window.toggleWordsEdit = toggleWordsEdit;
window.saveWordsEdit = saveWordsEdit;
window.deleteSelectedLesson = deleteSelectedLesson;
window.clearRecords = clearRecords;
window.replayCurrentWord = replayCurrentWord;
