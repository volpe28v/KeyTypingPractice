import { type WordData, type LevelData, type XPRecord, MODE_TO_LEVEL, calculateXP, getWeekKey, FavoriteLesson, MyLesson } from '../types';
import type { GameManager } from '../managers/GameManager';
import type { AudioManager } from '../managers/AudioManager';
import type { UIManager } from '../managers/UIManager';
import type { KeyboardManager } from '../managers/KeyboardManager';
import type { RecordManager } from '../managers/RecordManager';
import type { StorageManager } from '../managers/StorageManager';
import type { InputHandler } from '../InputHandler';
import { LevelManager } from '../levels/level-manager';

// LessonFlowController型の循環依存を避けるためのインターフェース
interface ILessonFlowController {
    customLessons: import('../types').LessonData[];
    userFavorites: import('../types').UserFavorite[];
    selectedLessonSource: import('../types').LessonSource | null;
    customWords: WordData[];
    storageManager: StorageManager;
    showLessonModeSelection(): void;
    selectLesson(lessonSource: import('../types').LessonSource): void;
    showCustomLessonSetup(): void;
    loadCustomLessons(): Promise<void>;
    showPublicLessonBrowser(): Promise<void>;
    addToFavorites(lessonId: string, lessonName: string, ownerDisplayName: string): Promise<void>;
    removeFromFavorites(favoriteId: string): Promise<void>;
    updateSelectedCardHighlight(): void;
}

/**
 * GameController - ゲーム制御クラス
 * ゲームの初期化、単語表示、タイマー、イベントリスナー、画面遷移を処理
 */
export class GameController {
    // State
    public displayWordTimer: NodeJS.Timeout | null = null;
    private clearScreenKeyHandler: ((event: KeyboardEvent) => void) | null = null;
    private levelManager: LevelManager | null = null;
    private levelLists: LevelData[];

    // Dependencies
    private gameManager: GameManager;
    private audioManager: AudioManager;
    private uiManager: UIManager;
    private keyboardManager: KeyboardManager;
    private inputHandler: InputHandler;
    private recordManager: RecordManager;
    private storageManager: StorageManager;

    // Cross-reference (set after construction)
    private lessonFlowController: ILessonFlowController | null = null;

    constructor(
        gameManager: GameManager,
        audioManager: AudioManager,
        uiManager: UIManager,
        keyboardManager: KeyboardManager,
        inputHandler: InputHandler,
        recordManager: RecordManager,
        storageManager: StorageManager,
    ) {
        this.gameManager = gameManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.keyboardManager = keyboardManager;
        this.inputHandler = inputHandler;
        this.recordManager = recordManager;
        this.storageManager = storageManager;

        this.levelLists = [
            {
                level: 10,
                description: "カスタムレッスン",
                words: []
            }
        ];
    }

    setLessonFlowController(lfc: ILessonFlowController): void {
        this.lessonFlowController = lfc;
    }

    private initializeLevelManager(): void {
        if (!this.levelManager) {
            this.levelManager = new LevelManager(this.gameManager, this.audioManager, this.uiManager);
        }
        this.inputHandler.setLevelManager(this.levelManager);
    }

    clearDisplayWordTimer(): void {
        if (this.displayWordTimer) {
            clearTimeout(this.displayWordTimer);
            this.displayWordTimer = null;
        }
    }

    private scheduleNextWord(delay: number): void {
        this.clearDisplayWordTimer();
        this.displayWordTimer = setTimeout(() => {
            window.currentWordIndex++;
            this.gameManager.correctCount++;

            this.uiManager.updateProgressBar(
                this.gameManager.currentWordIndex,
                this.gameManager.words.length
            );
            if (!window.isShowingClearScreen && this.gameManager.gameActive) {
                this.displayWord();
            }
        }, delay);
    }

    initGame(): void {
        window.isShowingClearScreen = false;

        if (this.uiManager.meaningDisplay) {
            this.uiManager.meaningDisplay.innerHTML = '';
            this.uiManager.meaningDisplay.style.display = 'none';
        }
        if (this.uiManager.wordDisplay) {
            this.uiManager.wordDisplay.innerHTML = '';
        }
        if (this.uiManager.feedback) {
            this.uiManager.feedback.textContent = '';
            this.uiManager.feedback.className = 'feedback';
        }

        this.clearDisplayWordTimer();
        this.initializeLevelManager();

        // GameManagerのプロパティはLessonFlowControllerで設定済み
        const customWords = this.lessonFlowController?.customWords || [];

        if (!this.gameManager.isCustomLesson) {
            this.gameManager.initGame(this.levelLists);
        } else {
            this.gameManager.initGame(this.levelLists, customWords);
        }

        // InputHandlerのコールバックを設定
        this.inputHandler.setScheduleNextWord((delay) => this.scheduleNextWord(delay));

        this.displayWordTimer = setTimeout(() => {
            if (!window.isShowingClearScreen && this.gameManager.gameActive) {
                this.displayWord(false, false);
            }
        }, 400);

        this.uiManager.updateProgressBar(this.gameManager.currentWordIndex, this.gameManager.words.length);
        if (this.uiManager.scoreDisplay) this.uiManager.scoreDisplay.style.display = 'none';
        if (this.uiManager.wordInput) {
            this.uiManager.wordInput.value = '';
            this.uiManager.wordInput.focus();
        }

        this.uiManager.forceAlphabetInput();

        this.gameManager.gameActive = true;
        this.gameManager.timerStarted = false;

        document.getElementById('back-to-title-btn')!.style.display = 'block';

        setTimeout(() => {
            if (this.gameManager.gameActive && this.uiManager.wordInput && !this.uiManager.wordInput.disabled) {
                this.uiManager.wordInput.focus();
            }
        }, 100);

        if (this.uiManager.timerDisplay) this.uiManager.timerDisplay.textContent = "00.00";

        if (this.gameManager.timerInterval) {
            clearInterval(this.gameManager.timerInterval);
            this.gameManager.timerInterval = null;
        }

        this.recordManager.hideRecords();
        this.keyboardManager.initAnimation();

        setTimeout(() => {
            if (this.gameManager.words.length > 0 && !window.isShowingClearScreen && this.gameManager.gameActive) {
                this.displayWord();
            }
        }, 100);
    }

    private startTimer(): void {
        if (this.gameManager.isCustomLesson && this.gameManager.lessonMode === 'vocabulary-learning') {
            return;
        }

        this.gameManager.startTime = Date.now();
        this.gameManager.timerStarted = true;
        this.gameManager.timerInterval = setInterval(() => {
            // タイマー表示は非表示
        }, 10);

        if (this.uiManager.timerDisplay) this.uiManager.timerDisplay.style.display = 'none';

        this.recordManager.hideRecords();
        document.getElementById('back-to-title-btn')!.style.display = 'block';
    }

    async displayWord(playAudio: boolean = true, clearInput: boolean = true): Promise<void> {
        if (this.gameManager.currentWordIndex < this.gameManager.words.length) {
            const currentWord = this.gameManager.words[this.gameManager.currentWordIndex];

            this.gameManager.resetForNewWord();

            if (this.uiManager.replayAudioBtn) {
                this.uiManager.replayAudioBtn.style.display = 'block';
            }

            if (currentWord && currentWord.word) {
                if (this.gameManager.isCustomLesson) {
                    if (this.levelManager && this.levelManager.setLevel(this.gameManager.lessonMode)) {
                        this.levelManager.initializeWord(currentWord, playAudio, clearInput);
                    } else {
                        console.warn('LevelManager not available, using fallback');
                        this.uiManager.wordDisplay!.innerHTML = currentWord.word.split('').map(char => `<span>${char}</span>`).join('');
                        this.uiManager.updateMeaningDisplay(currentWord.meaning);
                        if (this.uiManager.wordInput) {
                            this.uiManager.wordInput.style.display = 'inline-block';
                            if (clearInput) this.uiManager.wordInput.value = '';
                        }
                        if (playAudio) this.audioManager.speakWord(currentWord.word);
                    }
                } else {
                    this.uiManager.wordDisplay!.innerHTML = currentWord.word.split('').map(char => `<span>${char}</span>`).join('');
                    this.uiManager.updateMeaningDisplay(currentWord.meaning);
                    if (this.uiManager.wordInput) {
                        this.uiManager.wordInput.style.display = 'inline-block';
                        if (clearInput) this.uiManager.wordInput.value = '';
                        this.uiManager.wordInput.focus();
                    }
                    if (playAudio) this.audioManager.speakWord(currentWord.word);
                }

                if (this.uiManager.feedback) {
                    this.uiManager.feedback.textContent = '';
                    this.uiManager.feedback.className = 'feedback';
                }

                this.keyboardManager.highlightNextKey();
                window.currentWordMistake = false;

                if (this.gameManager.isCustomLesson && this.gameManager.lessonMode === 'progressive') {
                    this.gameManager.consecutiveMistakes = 0;
                    this.gameManager.currentCharPosition = 0;
                }
            } else {
                console.error('単語データが不正です:', currentWord);
                if (this.uiManager.wordDisplay) {
                    this.uiManager.wordDisplay.innerHTML = '<span>エラー</span>';
                }
                this.uiManager.updateMeaningDisplay('単語データの読み込みに問題があります');
            }

        } else {
            // ゲーム完了
            if (this.gameManager.isCustomLesson && this.gameManager.lessonMode === 'vocabulary-learning') {
                // Lv0: 単語学習モードの完了処理
                this.clearDisplayWordTimer();

                if (this.gameManager.timerInterval) {
                    clearInterval(this.gameManager.timerInterval);
                    this.gameManager.timerInterval = null;
                }

                // Lv0のXP計算・保存
                const lv0WordCount = this.gameManager.words.length;
                const lv0XP = calculateXP(0, lv0WordCount, 100);
                await this.saveXPRecord(0, lv0WordCount, 100, lv0XP);

                if (this.uiManager.wordDisplay) {
                    this.uiManager.wordDisplay.innerHTML = '<span style="color: #00ff41; font-size: 1.5em;">🎉 単語学習完了！</span>';
                }
                this.uiManager.updateMeaningDisplay('全ての単語を学習しました。お疲れさまでした！');
                this.uiManager.showFeedback('Escapeキーでレッスン選択画面に戻ります');
                this.uiManager.showXPGain(lv0XP);

                this.audioManager.playCorrectSound("congratulations");
                this.gameManager.gameActive = false;

                if (this.uiManager.replayAudioBtn) this.uiManager.replayAudioBtn.style.display = 'none';
                if (this.uiManager.wordInput) this.uiManager.wordInput.value = '';

                // リーダーボード更新
                this.updateLeaderboard();

                this.setupVocabularyLearningCompleteKeyEvents();
                return;
            } else {
                // 通常モードの完了処理
                this.gameManager.endTime = Date.now();
                const elapsedTime = this.gameManager.endTime - (this.gameManager.startTime || 0);

                this.clearDisplayWordTimer();

                if (this.gameManager.timerInterval) {
                    clearInterval(this.gameManager.timerInterval);
                    this.gameManager.timerInterval = null;
                }

                let totalTypesCount = 0;
                this.gameManager.words.forEach(word => {
                    totalTypesCount += word.word.length;
                });

                const accuracyRate = this.gameManager.mistakeCount === 0
                    ? 100
                    : Math.round((totalTypesCount / (totalTypesCount + this.gameManager.mistakeCount)) * 100);

                if (this.gameManager.isCustomLesson) {
                    const lessonSource = this.lessonFlowController?.selectedLessonSource;
                    if (lessonSource) {
                        const levelIndex = MODE_TO_LEVEL[this.gameManager.lessonMode] ?? 0;

                        // ポリモーフィズムで記録キーを取得（条件分岐なし）
                        const recordKey = lessonSource.getRecordKey(levelIndex);

                        await this.recordManager.addRecord(recordKey, elapsedTime, this.gameManager.mistakeCount, totalTypesCount);
                    }
                } else {
                    await this.recordManager.addRecord(`level${this.gameManager.currentLevel}`, elapsedTime, this.gameManager.mistakeCount, totalTypesCount);
                }

                const isPerfect = this.gameManager.mistakeCount === 0;

                // XP計算・保存
                const levelIndex = MODE_TO_LEVEL[this.gameManager.lessonMode] ?? 0;
                const xp = calculateXP(levelIndex, this.gameManager.words.length, accuracyRate);
                await this.saveXPRecord(levelIndex, this.gameManager.words.length, accuracyRate, xp);

                // 共有レッスンの場合、共有レッスン記録も保存
                await this.saveSharedLessonRecordIfNeeded(levelIndex, accuracyRate, elapsedTime, this.gameManager.words.length);

                if (this.levelManager && this.levelManager.cleanup) {
                    this.levelManager.cleanup();
                }

                this.uiManager.showGameComplete(isPerfect, this.gameManager.mistakeCount, elapsedTime, accuracyRate, xp);

                if (isPerfect) {
                    this.audioManager.playCorrectSound("congratulations");
                } else {
                    this.audioManager.playCorrectSound("complete");
                }

                // リーダーボード更新
                this.updateLeaderboard();
            }

            this.recordManager.hideRecords();
            this.gameManager.gameActive = false;
            window.isShowingClearScreen = true;

            this.clearDisplayWordTimer();

            if (this.uiManager.wordInput) {
                this.uiManager.wordInput.value = '';
                this.uiManager.wordInput.focus();
            }

            this.setupClearScreenKeyEvents();
        }
    }

    private setupClearScreenKeyEvents(): void {
        if (this.clearScreenKeyHandler) {
            document.removeEventListener('keydown', this.clearScreenKeyHandler);
        }

        this.clearScreenKeyHandler = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.restartCurrentLesson();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                this.backToTitle();
            }
        };

        document.addEventListener('keydown', this.clearScreenKeyHandler);
    }

    private setupVocabularyLearningCompleteKeyEvents(): void {
        if (this.clearScreenKeyHandler) {
            document.removeEventListener('keydown', this.clearScreenKeyHandler);
        }

        this.clearScreenKeyHandler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.backToTitle();
            }
        };

        document.addEventListener('keydown', this.clearScreenKeyHandler);
    }

    restartCurrentLesson(): void {
        window.isShowingClearScreen = false;

        if (this.clearScreenKeyHandler) {
            document.removeEventListener('keydown', this.clearScreenKeyHandler);
            this.clearScreenKeyHandler = null;
        }

        const lfc = this.lessonFlowController;
        if (lfc?.selectedLessonSource) {
            const lesson = lfc.selectedLessonSource.getLesson();
            
            // MyLesson の場合のみ index を設定
            if (lfc.selectedLessonSource instanceof MyLesson) {
                this.gameManager.currentLessonIndex = lfc.selectedLessonSource.getIndex();
            } else {
                this.gameManager.currentLessonIndex = -1;
            }
            
            lfc.customWords = lesson.words;
            this.gameManager.isCustomLesson = true;

            this.uiManager.hideModal('lesson-mode-selection');

            (document.querySelector('.typing-area') as HTMLElement).style.display = 'block';
            (document.querySelector('.keyboard-display-container') as HTMLElement).style.display = 'block';
            document.getElementById('back-to-title-btn')!.style.display = 'block';

            this.initGame();
        }
    }

    backToTitle(): void {
        if (this.gameManager.gameActive && this.gameManager.timerStarted) {
            if (!confirm('現在のゲームを中断してレッスン選択に戻りますか？')) {
                return;
            }
        }

        if (this.clearScreenKeyHandler) {
            document.removeEventListener('keydown', this.clearScreenKeyHandler);
            this.clearScreenKeyHandler = null;
        }

        if (this.gameManager.timerInterval) {
            clearInterval(this.gameManager.timerInterval);
            this.gameManager.timerInterval = null;
        }

        this.gameManager.gameActive = false;
        this.gameManager.timerStarted = false;

        document.getElementById('back-to-title-btn')!.style.display = 'none';

        (document.querySelector('.typing-area') as HTMLElement).style.display = 'block';
        (document.querySelector('.keyboard-display-container') as HTMLElement).style.display = 'block';
        document.getElementById('word-input')!.style.display = 'inline-block';
        document.getElementById('meaning')!.style.display = 'block';

        const customLessons = this.lessonFlowController?.customLessons || [];
        const userFavorites = this.lessonFlowController?.userFavorites || [];
        this.recordManager.showRecords(customLessons);
        this.recordManager.displayFavoriteBestTimes(userFavorites);
        this.keyboardManager.initAnimation();
        this.updateLeaderboard();

        const lfc = this.lessonFlowController;
        if (lfc?.selectedLessonSource) {
            lfc.showLessonModeSelection();
        } else {
            if (customLessons.length > 0) {
                const firstLesson = customLessons[0];
                const lessonSource = new MyLesson(firstLesson, 0);
                lfc?.selectLesson(lessonSource);
            } else {
                lfc?.showCustomLessonSetup();
            }
        }
    }

    updateLessonList(): void {
        const recordsSidebar = document.querySelector('.records-sidebar');
        if (!recordsSidebar) return;

        const clearButton = recordsSidebar.querySelector('.clear-records-btn');

        // 既存のセクション・レガシー要素を削除
        const existingElements = recordsSidebar.querySelectorAll('.lesson-section, .level-record, .sidebar-section-header');
        existingElements.forEach(el => el.remove());

        const customLessons = this.lessonFlowController?.customLessons || [];
        const userFavorites = this.lessonFlowController?.userFavorites || [];
        const user = (window as any).authManager?.getCurrentUser();
        const currentUserId = user?.uid;

        if (!Array.isArray(customLessons)) {
            return;
        }

        // マイレッスンセクション
        const myLessons = customLessons.filter(l => (l.ownerId || l.userId) === currentUserId);
        const createBtn = document.createElement('button');
        createBtn.textContent = '+ 新規作成';
        createBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.lessonFlowController?.showCustomLessonSetup();
        });

        const mySection = this.createSectionElement('マイレッスン', myLessons.length, createBtn, 'myLessons');
        const myGrid = mySection.querySelector('.lesson-grid')!;

        const sortedMyLessons = [...myLessons].sort((a, b) => Number(b.id) - Number(a.id));
        sortedMyLessons.forEach((lesson) => {
            const originalIndex = customLessons.findIndex(l => l.id === lesson.id);
            myGrid.appendChild(this.createLessonCard(lesson, originalIndex));
        });

        recordsSidebar.insertBefore(mySection, clearButton);

        // お気に入りセクション
        const browseBtn = document.createElement('button');
        browseBtn.textContent = '🔗 探す';
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.lessonFlowController?.showPublicLessonBrowser();
        });

        const favSection = this.createSectionElement('お気に入り', userFavorites.length, browseBtn, 'favorites');
        const favGrid = favSection.querySelector('.lesson-grid')!;

        userFavorites.forEach((favorite) => {
            favGrid.appendChild(this.createFavoriteLessonCard(favorite));
        });

        recordsSidebar.insertBefore(favSection, clearButton);

        this.recordManager.displayBestTimes(customLessons);
        this.recordManager.displayFavoriteBestTimes(userFavorites);

        // 再描画後にハイライトを復元
        this.lessonFlowController?.updateSelectedCardHighlight();
    }

    private createSectionElement(title: string, count: number, actionBtn: HTMLElement, sectionKey: string): HTMLElement {
        const section = document.createElement('div');
        section.className = 'lesson-section';

        // ヘッダー
        const toggle = document.createElement('div');
        toggle.className = 'sidebar-section-toggle';

        const icon = document.createElement('span');
        icon.className = 'toggle-icon';
        icon.textContent = '▼';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'section-title';
        titleSpan.textContent = title;

        const countSpan = document.createElement('span');
        countSpan.className = 'section-count';
        countSpan.textContent = `(${count})`;

        const actionWrap = document.createElement('span');
        actionWrap.className = 'section-action';
        actionWrap.appendChild(actionBtn);

        toggle.appendChild(icon);
        toggle.appendChild(titleSpan);
        toggle.appendChild(countSpan);
        toggle.appendChild(actionWrap);

        // グリッド
        const grid = document.createElement('div');
        grid.className = 'lesson-grid';

        // 折りたたみ状態の復元
        const collapsed = localStorage.getItem(`section-collapsed-${sectionKey}`) === 'true';
        if (collapsed) {
            toggle.classList.add('collapsed');
            grid.classList.add('collapsed');
        }

        // トグルクリック
        toggle.addEventListener('click', () => {
            this.toggleSection(toggle, grid, sectionKey);
        });

        section.appendChild(toggle);
        section.appendChild(grid);

        return section;
    }

    private toggleSection(toggle: HTMLElement, grid: HTMLElement, sectionKey: string): void {
        const isCollapsed = toggle.classList.toggle('collapsed');
        grid.classList.toggle('collapsed');
        localStorage.setItem(`section-collapsed-${sectionKey}`, String(isCollapsed));
    }

    private createLessonCard(lesson: import('../types').LessonData, originalIndex: number): HTMLElement {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.setAttribute('data-lesson-id', lesson.id);

        const name = document.createElement('div');
        name.className = 'card-name';
        name.title = lesson.name;
        name.textContent = lesson.name;

        const record = document.createElement('div');
        record.className = 'card-record';
        record.id = `lesson${lesson.id}-records`;

        card.appendChild(name);
        card.appendChild(record);

        card.addEventListener('click', () => {
            if (this.gameManager.gameActive && this.gameManager.timerStarted) {
                if (!confirm(`現在のゲームを中断して「${lesson.name}」を開始しますか？`)) {
                    return;
                }
            }
            const lessonSource = new MyLesson(lesson, originalIndex);
            this.lessonFlowController?.selectLesson(lessonSource);
        });

        return card;
    }

    private createFavoriteLessonCard(favorite: import('../types').UserFavorite): HTMLElement {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.setAttribute('data-lesson-id', favorite.lessonId);

        const name = document.createElement('div');
        name.className = 'card-name';
        name.title = favorite.lessonName;
        name.textContent = favorite.lessonName;

        const author = document.createElement('div');
        author.className = 'card-author';
        author.textContent = `by ${favorite.ownerDisplayName}`;

        const record = document.createElement('div');
        record.className = 'card-record';
        record.id = `favLesson${favorite.lessonId}-records`;

        card.appendChild(name);
        card.appendChild(author);
        card.appendChild(record);

        card.addEventListener('click', async () => {
            if (this.gameManager.gameActive && this.gameManager.timerStarted) {
                if (!confirm(`現在のゲームを中断して「${favorite.lessonName}」を開始しますか？`)) {
                    return;
                }
            }

            const lesson = await this.lessonFlowController!.storageManager.loadLessonById(favorite.lessonId);

            if (!lesson) {
                alert('レッスンデータの取得に失敗しました。');
                return;
            }

            const lessonSource = new FavoriteLesson(lesson, favorite);
            this.lessonFlowController?.selectLesson(lessonSource);
        });

        return card;
    }

    private async saveXPRecord(levelIndex: number, wordCount: number, accuracy: number, xp: number): Promise<void> {
        const user = (window as any).authManager?.getCurrentUser();
        if (!user) return;

        const lessonSource = this.lessonFlowController?.selectedLessonSource;
        let lessonId = '';
        if (this.gameManager.isCustomLesson && lessonSource) {
            const lesson = lessonSource.getLesson();
            lessonId = lesson.firestoreId || lesson.id;
        }

        const record: XPRecord = {
            lessonId,
            levelIndex,
            userId: user.uid,
            displayName: user.displayName || 'Unknown',
            xp,
            accuracy,
            wordCount,
            weekKey: getWeekKey(),
        };

        await this.storageManager.saveXPRecord(record);
    }

    private async saveSharedLessonRecordIfNeeded(levelIndex: number, accuracy: number, elapsedTime: number, wordCount: number): Promise<void> {
        const user = (window as any).authManager?.getCurrentUser();
        if (!user) return;

        const lessonSource = this.lessonFlowController?.selectedLessonSource;
        if (!this.gameManager.isCustomLesson || !lessonSource) {
            return;
        }

        // ポリモーフィズムで判定（条件分岐なし）
        if (!lessonSource.shouldSaveLessonRecord()) {
            return;
        }

        const lesson = lessonSource.getLesson();
        if (!lesson.firestoreId) {
            return;
        }

        const record = {
            userId: user.uid,
            displayName: user.displayName || 'Unknown',
            lessonId: lesson.firestoreId,
            levelIndex,
            accuracy,
            elapsedTime,
            wordCount
        };

        await this.storageManager.saveLessonRecord(record);
    }

    async updateLeaderboard(): Promise<void> {
        const user = (window as any).authManager?.getCurrentUser();
        if (!user) return;

        const rankings = await this.storageManager.loadWeeklyRanking();
        this.uiManager.updateLeaderboard(rankings, user.uid);
    }

    replayCurrentWord(): void {
        if (this.gameManager.words && this.gameManager.words.length > 0) {
            const currentWord = this.gameManager.words[this.gameManager.currentWordIndex];
            if (currentWord && currentWord.word) {
                this.audioManager.speakWord(currentWord.word);
            }
        }
    }

    setupEventListeners(): void {
        const wordInput = this.uiManager.wordInput!;

        // キーダウンイベント
        wordInput.addEventListener('keydown', (e) => {
            if (!this.gameManager.timerStarted && this.gameManager.gameActive) {
                this.startTimer();
                this.audioManager.initAudioContext();
            }

            if (e.key === 'Enter') {
                if (this.gameManager.gameActive && this.gameManager.isCustomLesson && this.gameManager.lessonMode === 'vocabulary-learning') {
                    // Lv0: 単語学習モード専用の処理
                    if (this.levelManager && this.levelManager.getCurrentLevel() && this.levelManager.getCurrentLevel().handleKeyInput) {
                        const currentWord = this.gameManager.words[this.gameManager.currentWordIndex];
                        const result = this.levelManager.handleKeyInput(e, currentWord);
                        if (result === 'next_word') {
                            this.gameManager.currentWordIndex++;
                            if (!window.isShowingClearScreen && this.gameManager.gameActive) {
                                this.displayWord();
                            }
                        }
                    } else {
                        // フォールバック
                        e.preventDefault();
                        const currentWord = this.gameManager.words[this.gameManager.currentWordIndex];
                        if (currentWord && currentWord.word) {
                            if (!this.gameManager.vocabularyLearningIsJapanese) {
                                this.audioManager.speakJapanese(currentWord.meaning);
                                this.gameManager.vocabularyLearningIsJapanese = true;
                                this.uiManager.showFeedback(`Enter/Spaceで英語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`);
                            } else {
                                this.audioManager.speakWord(currentWord.word);
                                this.gameManager.vocabularyLearningIsJapanese = false;
                                this.gameManager.vocabularyLearningCount++;
                                if (this.gameManager.vocabularyLearningCount >= this.gameManager.vocabularyLearningMaxCount) {
                                    this.gameManager.currentWordIndex++;
                                    if (!window.isShowingClearScreen && this.gameManager.gameActive) {
                                        this.displayWord();
                                    }
                                } else {
                                    this.uiManager.showFeedback(`Enter/Spaceで日本語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`);
                                }
                            }
                        }
                    }
                    return;
                } else if (this.gameManager.gameActive) {
                    // Lv1〜Lv5: Enterキーで音声リプレイ
                    e.preventDefault();
                    this.replayCurrentWord();
                    return;
                }

                if (!this.gameManager.gameActive) {
                    if (this.gameManager.currentWordIndex >= this.gameManager.words.length) {
                        this.initGame();
                    }
                }
            } else if (e.key === ' ') {
                // Lv0: Spaceキーの処理
                if (this.gameManager.gameActive && this.gameManager.isCustomLesson && this.gameManager.lessonMode === 'vocabulary-learning') {
                    if (this.levelManager && this.levelManager.getCurrentLevel() && this.levelManager.getCurrentLevel().handleKeyInput) {
                        const currentWord = this.gameManager.words[this.gameManager.currentWordIndex];
                        const result = this.levelManager.handleKeyInput(e, currentWord);
                        if (result === 'next_word') {
                            this.gameManager.currentWordIndex++;
                            if (!window.isShowingClearScreen && this.gameManager.gameActive) {
                                this.displayWord();
                            }
                        }
                    } else {
                        // フォールバック
                        e.preventDefault();
                        const currentWord = this.gameManager.words[this.gameManager.currentWordIndex];
                        if (currentWord && currentWord.word) {
                            if (!this.gameManager.vocabularyLearningIsJapanese) {
                                this.audioManager.speakJapanese(currentWord.meaning);
                                this.gameManager.vocabularyLearningIsJapanese = true;
                                this.uiManager.showFeedback(`Enter/Spaceで英語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`);
                            } else {
                                this.audioManager.speakWord(currentWord.word);
                                this.gameManager.vocabularyLearningIsJapanese = false;
                                this.gameManager.vocabularyLearningCount++;
                                if (this.gameManager.vocabularyLearningCount >= this.gameManager.vocabularyLearningMaxCount) {
                                    this.gameManager.currentWordIndex++;
                                    if (!window.isShowingClearScreen && this.gameManager.gameActive) {
                                        this.displayWord();
                                    }
                                } else {
                                    this.uiManager.showFeedback(`Enter/Spaceで日本語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`);
                                }
                            }
                        }
                    }
                    return;
                }

                if (!this.gameManager.gameActive) {
                    if (this.gameManager.currentWordIndex >= this.gameManager.words.length) {
                        this.initGame();
                    }
                }
            } else if (this.gameManager.gameActive) {
                if (e.key === 'Backspace') {
                    this.audioManager.playTypingSound();
                    return;
                }

                if (this.inputHandler.validateKeyInput(e)) {
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        this.audioManager.playTypingSound();
                    }
                    this.keyboardManager.showKeyPress(e.key, true);
                    setTimeout(() => this.keyboardManager.highlightNextKey(), 50);
                } else {
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        this.audioManager.playMistypeSound();
                    }
                    this.keyboardManager.showKeyPress(e.key, false);
                }
            }
        });

        // インプットイベント
        wordInput.addEventListener('input', () => {
            if (this.gameManager.gameActive && !wordInput.disabled) {
                this.inputHandler.checkInputRealtime();
            }
        });

        // キーアップイベント
        wordInput.addEventListener('keyup', (e) => {
            if (this.gameManager.gameActive && (e.key.length === 1 || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                this.keyboardManager.highlightNextKey();
            }
        });

        // Lv0: 単語学習モード用のdocumentレベルキーハンドラ
        document.addEventListener('keydown', (e) => {
            if (this.gameManager.gameActive && this.gameManager.isCustomLesson && this.gameManager.lessonMode === 'vocabulary-learning' &&
                wordInput.style.display === 'none' && (e.key === 'Enter' || e.key === ' ')) {

                if (this.levelManager && this.levelManager.getCurrentLevel() && this.levelManager.getCurrentLevel().handleKeyInput) {
                    const currentWord = this.gameManager.words[this.gameManager.currentWordIndex];
                    const result = this.levelManager.handleKeyInput(e, currentWord);

                    if (result === 'next_word') {
                        this.gameManager.currentWordIndex++;
                        if (!window.isShowingClearScreen && this.gameManager.gameActive) {
                            this.displayWord();
                        }
                    }
                } else {
                    // フォールバック
                    e.preventDefault();
                    const currentWord = this.gameManager.words[this.gameManager.currentWordIndex];
                    if (currentWord && currentWord.word) {
                        if (!this.gameManager.vocabularyLearningIsJapanese) {
                            this.audioManager.speakJapanese(currentWord.meaning);
                            this.gameManager.vocabularyLearningIsJapanese = true;
                            this.uiManager.showFeedback(`Enter/Spaceで英語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`);
                        } else {
                            this.audioManager.speakWord(currentWord.word);
                            this.gameManager.vocabularyLearningIsJapanese = false;
                            this.gameManager.vocabularyLearningCount++;
                            if (this.gameManager.vocabularyLearningCount >= this.gameManager.vocabularyLearningMaxCount) {
                                this.gameManager.currentWordIndex++;
                                this.displayWord();
                            } else {
                                this.uiManager.showFeedback(`Enter/Spaceで日本語を聞く (${this.gameManager.vocabularyLearningCount}/${this.gameManager.vocabularyLearningMaxCount})`);
                            }
                        }
                    }
                }
            }
        });

        // 戻るボタン
        document.getElementById('back-to-title-btn')?.addEventListener('click', () => this.backToTitle());
    }
}
