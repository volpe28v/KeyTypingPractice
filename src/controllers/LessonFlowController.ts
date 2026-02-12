import type { WordData, LessonData, UserFavorite, LessonRankingEntry } from '../types';
import { LessonSource, MyLesson, FavoriteLesson } from '../types';
import type { LessonManager } from '../managers/LessonManager';
import type { StorageManager } from '../managers/StorageManager';
import type { UIManager } from '../managers/UIManager';
import type { GameManager } from '../managers/GameManager';

// GameController型の循環依存を避けるためのインターフェース
interface IGameController {
    initGame(): void;
    updateLessonList(): void;
    backToTitle(): void;
}

// RecordManager型の循環依存を避けるためのインターフェース
interface IRecordManager {
    hideRecords(): void;
    getRecordForKey(key: string): { accuracy: number; elapsedTime: number } | null;
}

/**
 * LessonFlowController - レッスン管理フロークラス
 * レッスンの作成、編集、削除、モード選択、開始を処理
 */
export class LessonFlowController {
    // State
    public customLessons: LessonData[] = [];
    public userFavorites: UserFavorite[] = [];
    public selectedLessonSource: LessonSource | null = null;
    public selectedCustomMode: string = 'progressive';
    public customWords: WordData[] = [];

    // Dependencies
    private lessonManager: LessonManager;
    public storageManager: StorageManager;
    private uiManager: UIManager;
    private gameManager: GameManager;

    // Cross-references (set after construction)
    private gameController: IGameController | null = null;
    private recordManager: IRecordManager | null = null;

    constructor(
        lessonManager: LessonManager,
        storageManager: StorageManager,
        uiManager: UIManager,
        gameManager: GameManager,
    ) {
        this.lessonManager = lessonManager;
        this.storageManager = storageManager;
        this.uiManager = uiManager;
        this.gameManager = gameManager;
    }

    setGameController(gc: IGameController): void {
        this.gameController = gc;
    }

    setRecordManager(rm: IRecordManager): void {
        this.recordManager = rm;
    }

    showCustomLessonSetup(): void {
        this.uiManager.hideModal('lesson-mode-selection');
        this.selectedLessonSource = null;

        (document.querySelector('.typing-area') as HTMLElement).style.display = 'none';
        (document.querySelector('.keyboard-display-container') as HTMLElement).style.display = 'none';
        (document.querySelector('.score-display') as HTMLElement).style.display = 'none';
        this.uiManager.showModal('custom-lesson-setup');

        document.getElementById('back-to-title-btn')!.style.display = 'none';

        (document.getElementById('lesson-name-input') as HTMLInputElement).value = '';
        (document.getElementById('custom-words-input') as HTMLTextAreaElement).value = 'apple, りんご\nbanana, バナナ\norange, オレンジ\nbook, 本\nwater, 水';

        const progressiveButton = document.querySelector('[data-mode="progressive"]');
        if (progressiveButton) {
            progressiveButton.classList.add('selected');
        }
    }


    /**
     * レッスンを選択してモード選択画面を表示（マイレッスン・お気に入り共通）
     */
    selectLesson(lessonSource: LessonSource): void {
        this.selectedLessonSource = lessonSource;
        this.showLessonModeSelection();
    }

    showLessonModeSelection(): void {
        if (!this.selectedLessonSource) {
            alert('レッスンが選択されていません。');
            return;
        }

        const lesson = this.selectedLessonSource.getLesson();

        // UI初期化
        (document.querySelector('.typing-area') as HTMLElement).style.display = 'none';
        (document.querySelector('.keyboard-display-container') as HTMLElement).style.display = 'none';
        (document.querySelector('.score-display') as HTMLElement).style.display = 'none';
        this.uiManager.hideModal('custom-lesson-setup');
        this.uiManager.showModal('lesson-mode-selection');

        document.getElementById('selected-lesson-name')!.textContent = lesson.name;
        document.getElementById('back-to-title-btn')!.style.display = 'none';
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('selected'));

        this.lessonManager.displayWordsInSelection(lesson);
        this.resetWordsEditMode();

        // ポリモーフィズムで記録を更新
        this.updateModeButtonRecordsForLesson();

        // ポリモーフィズムで編集ボタンの表示/非表示を制御
        const editToggle = document.querySelector('.edit-toggle') as HTMLElement;
        if (editToggle) {
            editToggle.style.display = this.selectedLessonSource.canEdit() ? 'block' : 'none';
        }

        // ポリモーフィズムで削除ボタンの表示とラベルを制御
        const displayInfo = this.selectedLessonSource.getDisplayInfo();
        const lessonDeleteBtn = document.getElementById('lesson-delete-btn') as HTMLButtonElement;
        if (lessonDeleteBtn) {
            if (displayInfo.showRemoveFavoriteButton) {
                // お気に入りレッスン: 「お気に入りから削除」として表示
                lessonDeleteBtn.textContent = 'お気に入りから削除';
                lessonDeleteBtn.onclick = () => this.removeFavoriteFromModal();
                lessonDeleteBtn.style.display = '';
            } else if (this.selectedLessonSource.canEdit()) {
                // マイレッスン: 通常の「削除」として表示
                lessonDeleteBtn.textContent = '削除';
                lessonDeleteBtn.onclick = () => this.deleteSelectedLesson();
                lessonDeleteBtn.style.display = '';
            } else {
                // 公開レッスン等: 削除ボタン非表示
                lessonDeleteBtn.style.display = 'none';
            }
        }

        // ポリモーフィズムでランキングの表示/非表示を制御
        const lessonRankingSection = document.getElementById('lesson-ranking-section');
        if (lessonRankingSection) {
            if (this.selectedLessonSource.showRanking() && lesson.firestoreId) {
                lessonRankingSection.style.display = 'block';
                this.setupLessonRankingTabs(lesson.firestoreId);
            } else {
                lessonRankingSection.style.display = 'none';
            }
        }
    }

    // レッスン別ランキングのタブセットアップ
    private async setupLessonRankingTabs(lessonId: string): Promise<void> {
        const tabsEl = document.getElementById('lesson-ranking-tabs');
        if (!tabsEl) return;

        tabsEl.innerHTML = '';
        const modes = ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5'];

        // タブを先に作成して表示
        const tabs: HTMLButtonElement[] = [];
        modes.forEach((modeName, index) => {
            const levelIndex = index + 1; // 1-5
            const tab = document.createElement('button');
            tab.className = `lesson-ranking-tab${levelIndex === 1 ? ' active' : ''}`;
            tab.textContent = modeName;
            tab.onclick = () => {
                document.querySelectorAll('.lesson-ranking-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadLessonRanking(lessonId, levelIndex);
            };
            tabsEl.appendChild(tab);
            tabs.push(tab);
        });

        // 初期表示: Lv1
        this.loadLessonRanking(lessonId, 1);

        // 全Lvのランキングを並列取得してメダル色を付与
        const user = (window as any).authManager?.getCurrentUser();
        if (!user) return;

        const rankingPromises = modes.map((_, index) =>
            this.storageManager.loadLessonRanking(lessonId, index + 1)
        );
        const allRankings = await Promise.all(rankingPromises);

        allRankings.forEach((rankings, index) => {
            const myRank = rankings.findIndex(r => r.userId === user.uid);
            if (myRank === -1) return; // 記録なし

            if (myRank === 0) {
                tabs[index].classList.add('medal-gold');
            } else if (myRank === 1) {
                tabs[index].classList.add('medal-silver');
            } else if (myRank === 2) {
                tabs[index].classList.add('medal-bronze');
            } else {
                tabs[index].classList.add('medal-participated');
            }
        });
    }

    toggleWordsEdit(): void {
        const wordsDisplay = document.getElementById('words-display');
        const wordsEditArea = document.getElementById('words-edit-area');
        const wordsEditControls = document.getElementById('words-edit-controls');
        const editToggle = document.querySelector('.edit-toggle');
        const lessonNameH2 = document.getElementById('selected-lesson-name');
        const lessonNameInput = document.getElementById('lesson-name-edit-input');

        if (wordsEditArea!.style.display === 'none') {
            wordsDisplay!.style.display = 'none';
            wordsEditArea!.style.display = 'block';
            wordsEditControls!.style.display = 'flex';
            editToggle!.textContent = 'キャンセル';

            lessonNameH2!.style.display = 'none';
            lessonNameInput!.style.display = 'block';
            const lesson = this.selectedLessonSource!.getLesson();
            (lessonNameInput as HTMLInputElement).value = lesson.name;
            const wordsText = lesson.words.map(word => `${word.word}, ${word.meaning}`).join('\n');
            (wordsEditArea as HTMLTextAreaElement).value = wordsText;
            wordsEditArea!.focus();
        } else {
            this.cancelWordsEdit();
        }
    }

    cancelWordsEdit(): void {
        this.resetWordsEditMode();
    }

    resetWordsEditMode(): void {
        const wordsDisplay = document.getElementById('words-display');
        const wordsEditArea = document.getElementById('words-edit-area');
        const wordsEditControls = document.getElementById('words-edit-controls');
        const editToggle = document.querySelector('.edit-toggle');
        const lessonNameH2 = document.getElementById('selected-lesson-name');
        const lessonNameInput = document.getElementById('lesson-name-edit-input');

        if (wordsDisplay) wordsDisplay.style.display = 'block';
        if (wordsEditArea) wordsEditArea.style.display = 'none';
        if (wordsEditControls) wordsEditControls.style.display = 'none';
        if (editToggle) editToggle.textContent = '編集';
        if (lessonNameH2) lessonNameH2.style.display = 'block';
        if (lessonNameInput) lessonNameInput.style.display = 'none';
    }

    private updateModeButtonRecords(lessonId: string): void {
        const modes = [
            'vocabulary-learning', 'progressive', 'pronunciation-meaning',
            'pronunciation-only', 'japanese-reading', 'pronunciation-blind'
        ];

        // lesson-mode-selection 内のモードボタンのみ対象
        const modeSelection = document.getElementById('lesson-mode-selection');
        if (!modeSelection) return;

        modes.forEach((mode, levelIndex) => {
            const btn = modeSelection.querySelector(`.mode-btn[data-mode="${mode}"]`) as HTMLElement;
            if (!btn) return;

            // 既存の記録表示をクリア
            const existing = btn.querySelector('.mode-record');
            if (existing) existing.remove();
            btn.classList.remove('mode-btn-perfect');

            const record = this.recordManager?.getRecordForKey(`lesson${lessonId}_${levelIndex}`);
            if (record) {
                const recordDiv = document.createElement('div');
                recordDiv.className = 'mode-record';
                recordDiv.textContent = `${record.accuracy}% / ${this.uiManager.formatTime(record.elapsedTime)}`;
                btn.appendChild(recordDiv);

                if (record.accuracy === 100) {
                    btn.classList.add('mode-btn-perfect');
                }
            }
        });
    }

    /**
     * 選択されたレッスンの各モードの記録を表示（ポリモーフィズム対応）
     */
    private updateModeButtonRecordsForLesson(): void {
        if (!this.selectedLessonSource) return;

        const modes = [
            'vocabulary-learning', 'progressive', 'pronunciation-meaning',
            'pronunciation-only', 'japanese-reading', 'pronunciation-blind'
        ];

        const modeSelection = document.getElementById('lesson-mode-selection');
        if (!modeSelection) return;

        modes.forEach((mode, levelIndex) => {
            const btn = modeSelection.querySelector(`.mode-btn[data-mode="${mode}"]`) as HTMLElement;
            if (!btn) return;

            const existing = btn.querySelector('.mode-record');
            if (existing) existing.remove();
            btn.classList.remove('mode-btn-perfect');

            // ポリモーフィズムで記録キーを取得（条件分岐なし）
            const recordKey = this.selectedLessonSource!.getRecordKey(levelIndex);
            const record = this.recordManager?.getRecordForKey(recordKey);

            if (record) {
                const recordDiv = document.createElement('div');
                recordDiv.className = 'mode-record';
                recordDiv.textContent = `${record.accuracy}% / ${this.uiManager.formatTime(record.elapsedTime)}`;
                btn.appendChild(recordDiv);

                if (record.accuracy === 100) {
                    btn.classList.add('mode-btn-perfect');
                }
            }
        });
    }

    async saveWordsEdit(): Promise<boolean> {
        const newLessonName = (document.getElementById('lesson-name-edit-input') as HTMLInputElement).value.trim();
        if (!newLessonName) {
            alert('レッスン名を入力してください。');
            return false;
        }

        const lesson = this.selectedLessonSource!.getLesson();
        lesson.name = newLessonName;

        // MyLesson の場合のみ編集可能なので、型チェック
        let success = false;
        if (this.selectedLessonSource instanceof MyLesson) {
            success = this.lessonManager.saveWordsEdit(
                { lesson, index: this.selectedLessonSource.getIndex() },
                this.customLessons,
                () => this.gameController?.updateLessonList()
            );
        }

        if (success) {
            document.getElementById('selected-lesson-name')!.textContent = newLessonName;
            this.resetWordsEditMode();

            // 編集後の処理（特になし）
        }
        return success;
    }

    startLessonWithMode(mode: string): void {
        if (!this.selectedLessonSource) {
            alert('レッスンが選択されていません。');
            return;
        }

        const lesson = this.selectedLessonSource.getLesson();

        // MyLesson の場合は index を設定、FavoriteLesson の場合は -1
        if (this.selectedLessonSource instanceof MyLesson) {
            this.gameManager.currentLessonIndex = this.selectedLessonSource.getIndex();
        } else {
            this.gameManager.currentLessonIndex = -1;
        }

        this.customWords = lesson.words;
        this.gameManager.lessonMode = mode;
        this.gameManager.isCustomLesson = true;

        this.uiManager.hideModal('lesson-mode-selection');

        (document.querySelector('.typing-area') as HTMLElement).style.display = 'block';
        (document.querySelector('.keyboard-display-container') as HTMLElement).style.display = 'block';
        document.getElementById('back-to-title-btn')!.style.display = 'block';

        if (this.recordManager) this.recordManager.hideRecords();
        this.gameController?.initGame();
    }

    startSelectedLesson(): void {
        if (!this.selectedLessonSource) {
            alert('レッスンが選択されていません。');
            return;
        }

        const selectedMode = (document.querySelector('input[name="saved-lesson-mode"]:checked') as HTMLInputElement).value;
        this.startLessonWithMode(selectedMode);
    }

    cancelLessonMode(): void {
        this.uiManager.hideModal('lesson-mode-selection');
        this.selectedLessonSource = null;
        this.gameController?.backToTitle();
    }

    async deleteSelectedLesson(): Promise<void> {
        if (!this.selectedLessonSource) {
            alert('削除対象のレッスンが選択されていません。');
            return;
        }

        const lesson = this.selectedLessonSource.getLesson();

        const lessonId = lesson.firestoreId || lesson.id;
        const success = await this.lessonManager.deleteLesson(
            lessonId,
            this.customLessons,
            () => this.gameController?.updateLessonList()
        );

        if (success) {
            this.selectedLessonSource = null;

            if (this.customLessons.length > 0) {
                const newestLessonIndex = 0;
                const newestLesson = this.customLessons[newestLessonIndex];
                setTimeout(() => {
                    const lessonSource = new MyLesson(newestLesson, newestLessonIndex);
                    this.selectLesson(lessonSource);
                }, 200);
            } else {
                this.uiManager.hideModal('lesson-mode-selection');
                this.gameController?.backToTitle();
            }
        }
    }

    cancelCustomLesson(): void {
        this.uiManager.hideModal('custom-lesson-setup');
        this.gameController?.backToTitle();
    }

    selectCustomMode(mode: string): void {
        this.selectedCustomMode = mode;

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        document.querySelector(`[data-mode="${mode}"]`)?.classList.add('selected');
    }

    async saveNewLessonOnly(): Promise<void> {
        const newLesson = this.lessonManager.saveNewLesson(
            this.customLessons,
            () => this.gameController?.updateLessonList()
        );
        if (newLesson) {
            (document.getElementById('lesson-name-input') as HTMLInputElement).value = '';
            (document.getElementById('custom-words-input') as HTMLTextAreaElement).value = '';

            this.uiManager.hideModal('custom-lesson-setup');
            this.gameController?.backToTitle();
        }
    }

    async saveAndStartLesson(mode?: string): Promise<void> {
        const input = (document.getElementById('custom-words-input') as HTMLTextAreaElement).value;

        if (!input.trim()) {
            alert('単語を入力してください。');
            return;
        }

        const newLesson = this.lessonManager.saveNewLesson(
            this.customLessons,
            () => this.gameController?.updateLessonList()
        );
        if (!newLesson) {
            return;
        }

        const newestLesson = this.customLessons.reduce((max, lesson, index, array) =>
            lesson.id > array[max].id ? index : max, 0
        );

        this.customWords = this.lessonManager.parseCustomWords(input);

        if (this.customWords.length === 0) {
            alert('有効な単語が入力されていません。正しい形式で入力してください。');
            return;
        }

        this.gameManager.lessonMode = mode || this.selectedCustomMode;
        this.gameManager.isCustomLesson = true;
        this.gameManager.currentLessonIndex = newestLesson;

        (document.getElementById('lesson-name-input') as HTMLInputElement).value = '';
        (document.getElementById('custom-words-input') as HTMLTextAreaElement).value = '';

        this.uiManager.hideModal('custom-lesson-setup');

        (document.querySelector('.typing-area') as HTMLElement).style.display = 'block';
        (document.querySelector('.keyboard-display-container') as HTMLElement).style.display = 'block';
        document.getElementById('back-to-title-btn')!.style.display = 'block';

        this.gameManager.currentLevel = 10;

        if (this.recordManager) this.recordManager.hideRecords();
        this.gameController?.initGame();
    }

    async startCustomLesson(): Promise<void> {
        const input = (document.getElementById('custom-words-input') as HTMLTextAreaElement).value;

        if (!input.trim()) {
            alert('単語を入力してください。');
            return;
        }

        this.customWords = this.lessonManager.parseCustomWords(input);

        if (this.customWords.length === 0) {
            alert('正しい形式で単語を入力してください。\n例: apple, りんご');
            return;
        }

        if (this.customWords.length > 50) {
            alert('単語数は50個以下にしてください。');
            return;
        }

        const newLesson = this.lessonManager.saveNewLesson(
            this.customLessons,
            () => this.gameController?.updateLessonList()
        );
        if (!newLesson) {
            console.warn('レッスンの保存に失敗しましたが、ゲームを開始します。');
        }

        this.storageManager.saveCustomWords(input);

        this.gameManager.lessonMode = this.selectedCustomMode;
        this.gameManager.isCustomLesson = true;

        if (newLesson && this.customLessons.length > 0) {
            this.gameManager.currentLessonIndex = this.customLessons.length - 1;
        }

        this.gameManager.currentLevel = 10;

        this.uiManager.hideModal('custom-lesson-setup');

        (document.querySelector('.typing-area') as HTMLElement).style.display = 'block';
        (document.querySelector('.keyboard-display-container') as HTMLElement).style.display = 'block';
        document.getElementById('back-to-title-btn')!.style.display = 'block';

        if (this.recordManager) this.recordManager.hideRecords();
        this.gameController?.initGame();
    }

    async loadCustomLessons(): Promise<void> {
        try {
            this.customLessons = await this.storageManager.loadCustomLessons();
            if (!Array.isArray(this.customLessons)) {
                this.customLessons = [];
            }

            // お気に入りも一緒に読み込む
            this.userFavorites = await this.storageManager.loadUserFavorites();
            if (!Array.isArray(this.userFavorites)) {
                this.userFavorites = [];
            }
        } catch (error) {
            console.error('❌ Error loading custom lessons:', error);
            this.customLessons = [];
            this.userFavorites = [];
        }
    }

    // 公開レッスンブラウザを表示
    async showPublicLessonBrowser(): Promise<void> {
        const publicLessons = await this.storageManager.loadAllPublicLessons();
        const browserEl = document.getElementById('public-lesson-browser');
        const listEl = document.getElementById('public-lesson-list');

        if (!browserEl || !listEl) return;

        // 既存のカードをクリア
        listEl.innerHTML = '';

        // 既にお気に入り登録済みのlessonIdを収集
        const favoriteLessonIds = new Set(this.userFavorites.map(f => f.lessonId));

        if (publicLessons.length === 0) {
            listEl.innerHTML = '<div class="public-lesson-card"><p style="text-align: center; color: var(--text-muted);">まだ公開レッスンがありません</p></div>';
        } else {
            publicLessons.forEach(lesson => {
                const card = document.createElement('div');
                card.className = 'public-lesson-card';

                const isFavorite = favoriteLessonIds.has(lesson.firestoreId || '');

                card.innerHTML = `
                    <div class="public-lesson-card-header">
                        <h3>${lesson.name}</h3>
                        <span class="public-lesson-author">by ${lesson.ownerDisplayName || 'Unknown'}</span>
                    </div>
                    <div class="public-lesson-card-info">
                        <span>${lesson.words.length}単語</span>
                    </div>
                    <div class="public-lesson-card-preview">
                        ${lesson.words.slice(0, 3).map(w => `${w.word} - ${w.meaning}`).join(', ')}${lesson.words.length > 3 ? '...' : ''}
                    </div>
                    ${isFavorite
                        ? '<span class="public-lesson-imported">お気に入り済み ★</span>'
                        : `<button class="public-lesson-import-btn" onclick="addToFavorites('${lesson.firestoreId}', '${lesson.name}', '${lesson.ownerDisplayName}')">お気に入りに追加</button>`
                    }
                `;

                listEl.appendChild(card);
            });
        }

        browserEl.style.display = 'block';
    }

    // お気に入りに追加
    async addToFavorites(lessonId: string, lessonName: string, ownerDisplayName: string): Promise<void> {
        // 既にお気に入り済みかチェック
        const alreadyFavorite = this.userFavorites.some(f => f.lessonId === lessonId);

        if (alreadyFavorite) {
            alert('このレッスンは既にお気に入り済みです。');
            return;
        }

        const success = await this.storageManager.addFavorite(lessonId, lessonName, ownerDisplayName);
        if (success) {
            // userFavoritesを再読み込み
            await this.loadCustomLessons(); // この中でuserFavoritesも読み込まれる
            this.gameController?.updateLessonList();
            alert('お気に入りに追加しました！');
            // ブラウザを更新
            await this.showPublicLessonBrowser();
        } else {
            alert('お気に入りへの追加に失敗しました。');
        }
    }

    // お気に入りから削除
    async removeFromFavorites(favoriteId: string): Promise<void> {
        const success = await this.storageManager.removeFavorite(favoriteId);
        if (success) {
            // userFavoritesを再読み込み
            await this.loadCustomLessons(); // この中でuserFavoritesも読み込まれる
            this.gameController?.updateLessonList();
            alert('お気に入りから削除しました。');
        } else {
            alert('お気に入りからの削除に失敗しました。');
        }
    }

    /**
     * モーダルからお気に入りを削除
     */
    async removeFavoriteFromModal(): Promise<void> {
        if (!this.selectedLessonSource) {
            return;
        }

        const displayInfo = this.selectedLessonSource.getDisplayInfo();
        if (!displayInfo.showRemoveFavoriteButton || !displayInfo.favoriteId) {
            alert('お気に入りレッスンではありません。');
            return;
        }

        const lesson = this.selectedLessonSource.getLesson();
        const confirmMsg = `「${lesson.name}」をお気に入りから削除しますか？`;

        if (!confirm(confirmMsg)) {
            return;
        }

        await this.removeFromFavorites(displayInfo.favoriteId);

        this.uiManager.hideModal('lesson-mode-selection');
        this.selectedLessonSource = null;
        this.gameController?.backToTitle();
    }

    // レッスン別ランキング読み込み
    async loadLessonRanking(lessonId: string, levelIndex: number): Promise<void> {
        const rankings = await this.storageManager.loadLessonRanking(lessonId, levelIndex);
        const user = (window as any).authManager?.getCurrentUser();
        const containerEl = document.getElementById('lesson-ranking-list');

        if (!containerEl || !user) return;

        this.uiManager.updateLessonRanking(rankings, user.uid, containerEl);
    }
}
