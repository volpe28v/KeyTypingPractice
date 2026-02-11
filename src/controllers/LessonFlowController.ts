import type { WordData, LessonData } from '../types';
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
}

/**
 * LessonFlowController - レッスン管理フロークラス
 * レッスンの作成、編集、削除、モード選択、開始を処理
 */
export class LessonFlowController {
    // State
    public customLessons: LessonData[] = [];
    public selectedLessonForMode: { lesson: LessonData; index: number } | null = null;
    public selectedCustomMode: string = 'progressive';
    public customWords: WordData[] = [];

    // Dependencies
    private lessonManager: LessonManager;
    private storageManager: StorageManager;
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
        this.selectedLessonForMode = null;

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

    showLessonModeSelection(lessonIndex: number): void {
        if (lessonIndex < 0 || lessonIndex >= this.customLessons.length) {
            alert('レッスンが見つかりません。');
            return;
        }

        const lesson = this.customLessons[lessonIndex];
        this.selectedLessonForMode = { lesson, index: lessonIndex };

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
            (lessonNameInput as HTMLInputElement).value = this.selectedLessonForMode!.lesson.name;

            const lesson = this.selectedLessonForMode!.lesson;
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

    saveWordsEdit(): boolean {
        const newLessonName = (document.getElementById('lesson-name-edit-input') as HTMLInputElement).value.trim();
        if (!newLessonName) {
            alert('レッスン名を入力してください。');
            return false;
        }

        this.selectedLessonForMode!.lesson.name = newLessonName;

        const success = this.lessonManager.saveWordsEdit(
            this.selectedLessonForMode!,
            this.customLessons,
            () => this.gameController?.updateLessonList()
        );

        if (success) {
            document.getElementById('selected-lesson-name')!.textContent = newLessonName;
            this.resetWordsEditMode();
        }
        return success;
    }

    startLessonWithMode(mode: string): void {
        if (!this.selectedLessonForMode) {
            alert('レッスンが選択されていません。');
            return;
        }

        const { lesson, index } = this.selectedLessonForMode;

        this.gameManager.currentLessonIndex = index;
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
        if (!this.selectedLessonForMode) {
            alert('レッスンが選択されていません。');
            return;
        }

        const selectedMode = (document.querySelector('input[name="saved-lesson-mode"]:checked') as HTMLInputElement).value;
        this.startLessonWithMode(selectedMode);
    }

    cancelLessonMode(): void {
        this.uiManager.hideModal('lesson-mode-selection');
        this.selectedLessonForMode = null;
        this.gameController?.backToTitle();
    }

    async deleteSelectedLesson(): Promise<void> {
        if (!this.selectedLessonForMode) {
            alert('削除対象のレッスンが選択されていません。');
            return;
        }

        const { lesson } = this.selectedLessonForMode;
        const lessonId = lesson.firestoreId || lesson.id;
        const success = await this.lessonManager.deleteLesson(
            lessonId,
            this.customLessons,
            () => this.gameController?.updateLessonList()
        );

        if (success) {
            this.selectedLessonForMode = null;

            if (this.customLessons.length > 0) {
                const newestLessonIndex = 0;
                setTimeout(() => {
                    this.showLessonModeSelection(newestLessonIndex);
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

    saveNewLessonOnly(): void {
        const success = this.lessonManager.saveNewLesson(
            this.customLessons,
            () => this.gameController?.updateLessonList()
        );
        if (success) {
            (document.getElementById('lesson-name-input') as HTMLInputElement).value = '';
            (document.getElementById('custom-words-input') as HTMLTextAreaElement).value = '';

            this.uiManager.hideModal('custom-lesson-setup');
            this.gameController?.backToTitle();
        }
    }

    saveAndStartLesson(mode?: string): void {
        const input = (document.getElementById('custom-words-input') as HTMLTextAreaElement).value;

        if (!input.trim()) {
            alert('単語を入力してください。');
            return;
        }

        const success = this.lessonManager.saveNewLesson(
            this.customLessons,
            () => this.gameController?.updateLessonList()
        );
        if (!success) {
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

    startCustomLesson(): void {
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

        const saveSuccess = this.lessonManager.saveNewLesson(
            this.customLessons,
            () => this.gameController?.updateLessonList()
        );
        if (!saveSuccess) {
            console.warn('レッスンの保存に失敗しましたが、ゲームを開始します。');
        }

        this.storageManager.saveCustomWords(input);

        this.gameManager.lessonMode = this.selectedCustomMode;
        this.gameManager.isCustomLesson = true;

        if (saveSuccess && this.customLessons.length > 0) {
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
        } catch (error) {
            console.error('❌ Error loading custom lessons:', error);
            this.customLessons = [];
        }
    }
}
