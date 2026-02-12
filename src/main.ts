// Firebase imports
import { auth, db } from './firebase.ts';
import { AuthManager } from './auth.ts';
import { FirestoreManager } from './firestore.ts';

// Manager imports
import { AudioManager } from './managers/AudioManager.ts';
import { StorageManager } from './managers/StorageManager.ts';
import { LessonManager } from './managers/LessonManager.ts';
import { GameManager } from './managers/GameManager.ts';
import { UIManager } from './managers/UIManager.ts';
import { KeyboardManager } from './managers/KeyboardManager.ts';
import { RecordManager } from './managers/RecordManager.ts';

// Controller imports
import { GameController } from './controllers/GameController.ts';
import { LessonFlowController } from './controllers/LessonFlowController.ts';

// Other imports
import { InputHandler } from './InputHandler.ts';
import { setupWindowProxies } from './windowProxies.ts';
import { MyLesson } from './types.ts';

// Level imports
import { LevelManager } from './levels/level-manager.ts';
import { VocabularyLearningLevel } from './levels/level0-vocabulary.ts';
import { ProgressiveLearningLevel } from './levels/level1-progressive.ts';
import { PronunciationMeaningLevel } from './levels/level2-pronunciation-meaning.ts';
import { PronunciationOnlyLevel } from './levels/level3-pronunciation-only.ts';
import { JapaneseReadingLevel } from './levels/level4-japanese-reading.ts';

// Type imports
import type { WordData, LessonData, RecordData, LevelData, LessonMode } from './types.ts';

// Global variable declarations for existing JavaScript code
declare global {
    interface Window {
        // Manager instances
        authManager?: AuthManager;
        audioManager: AudioManager;
        storageManager: StorageManager;
        lessonManager: LessonManager;
        gameManager: GameManager;
        uiManager: UIManager;
        keyboardManager: KeyboardManager;

        // Level class definitions
        LevelManager: typeof LevelManager;
        VocabularyLearningLevel: typeof VocabularyLearningLevel;
        ProgressiveLearningLevel: typeof ProgressiveLearningLevel;
        PronunciationMeaningLevel: typeof PronunciationMeaningLevel;
        PronunciationOnlyLevel: typeof PronunciationOnlyLevel;
        JapaneseReadingLevel: typeof JapaneseReadingLevel;

        // GameManager proxy properties
        words: WordData[];
        currentWordIndex: number;
        correctCount: number;
        mistakeCount: number;
        currentLevel: number;
        gameActive: boolean;
        timerStarted: boolean;
        startTime: number | null;
        endTime: number | null;
        timerInterval: number | null;
        currentWordMistake: boolean;
        isCustomLesson: boolean;
        lessonMode: string;
        currentLessonIndex: number;
        progressiveStep: number;
        maxProgressiveSteps: number;
        consecutiveMistakes: number;
        currentCharPosition: number;
        vocabularyLearningCount: number;
        vocabularyLearningMaxCount: number;
        vocabularyLearningIsJapanese: boolean;

        // Audio context for Web Audio API
        webkitAudioContext?: typeof AudioContext;

        // Additional UI state properties
        isShowingClearScreen?: boolean;

        // Custom lesson functions
        saveNewLessonOnly?: () => void;
        cancelCustomLesson?: () => void;
        saveAndStartLesson?: (mode?: string) => void;
        startLessonWithMode?: (mode?: string) => void;
        toggleWordsEdit?: () => void;
        saveWordsEdit?: () => void;
        deleteSelectedLesson?: () => void;
        clearRecords?: () => void;
        replayCurrentWord?: () => void;
        // Public lesson and favorites functions
        showPublicLessonBrowser?: () => void;
        closePublicLessonBrowser?: () => void;
        addToFavorites?: (lessonId: string, lessonName: string, ownerDisplayName: string) => void;
        removeFromFavorites?: (favoriteId: string) => void;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase Authentication
    const authManager = new AuthManager();
    window.authManager = authManager;

    const googleSignInBtn = document.getElementById('google-sign-in-btn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            authManager.signInWithGoogle();
        });
    }

    // Create manager instances
    const audioManager = new AudioManager();
    const storageManager = new StorageManager();
    const lessonManager = new LessonManager(storageManager);
    const gameManager = new GameManager(audioManager, storageManager);
    const uiManager = new UIManager();
    const keyboardManager = new KeyboardManager();

    // Set up window references for managers
    window.audioManager = audioManager;
    window.storageManager = storageManager;
    window.lessonManager = lessonManager;
    window.gameManager = gameManager;
    window.uiManager = uiManager;
    window.keyboardManager = keyboardManager;

    // Set up window proxies for GameManager properties (legacy compatibility)
    setupWindowProxies(gameManager);

    // Create RecordManager
    const recordManager = new RecordManager(storageManager, uiManager);

    // Create InputHandler
    const inputHandler = new InputHandler(gameManager, uiManager, audioManager, keyboardManager);

    // Create Controllers
    const gameController = new GameController(
        gameManager, audioManager, uiManager, keyboardManager,
        inputHandler, recordManager, storageManager
    );

    const lessonFlowController = new LessonFlowController(
        lessonManager, storageManager, uiManager, gameManager
    );

    // Wire up circular dependencies
    gameController.setLessonFlowController(lessonFlowController);
    lessonFlowController.setGameController(gameController);
    lessonFlowController.setRecordManager(recordManager);

    // Set up event listeners
    gameController.setupEventListeners();

    // Setup Firestore integration after authentication
    authManager.auth.onAuthStateChanged(async (user) => {
        if (user) {
            const firestoreManager = new FirestoreManager(user.uid);
            storageManager.setFirestoreManager(firestoreManager);

            await lessonFlowController.loadCustomLessons();
            await recordManager.loadRecords();
            gameController.updateLessonList();

            // リーダーボード読み込み
            gameController.updateLeaderboard();

            // データ読み込み後に最新レッスンを自動選択
            if (lessonFlowController.customLessons.length > 0) {
                const newestLessonIndex = lessonFlowController.customLessons.reduce((max, lesson, index, array) =>
                    lesson.id > array[max].id ? index : max, 0
                );
                const newestLesson = lessonFlowController.customLessons[newestLessonIndex];
                setTimeout(() => {
                    const lessonSource = new MyLesson(newestLesson, newestLessonIndex);
                    lessonFlowController.selectLesson(lessonSource);
                }, 100);
            }
        } else {
            storageManager.setFirestoreManager(null);
            lessonFlowController.customLessons = [];
            recordManager.records = {};
            gameController.updateLessonList();
        }
    });

    // Make level classes available globally
    window.LevelManager = LevelManager;
    window.VocabularyLearningLevel = VocabularyLearningLevel;
    window.ProgressiveLearningLevel = ProgressiveLearningLevel;
    window.PronunciationMeaningLevel = PronunciationMeaningLevel;
    window.PronunciationOnlyLevel = PronunciationOnlyLevel;
    window.JapaneseReadingLevel = JapaneseReadingLevel;

    // Initial load and display
    lessonFlowController.loadCustomLessons();
    gameController.updateLessonList();

    // Set up focus management
    uiManager.setupFocusManagement();

    // Export functions to global scope for HTML onclick events
    window.saveNewLessonOnly = () => lessonFlowController.saveNewLessonOnly();
    window.cancelCustomLesson = () => lessonFlowController.cancelCustomLesson();
    window.saveAndStartLesson = (mode) => lessonFlowController.saveAndStartLesson(mode);
    window.startLessonWithMode = (mode) => lessonFlowController.startLessonWithMode(mode);
    window.toggleWordsEdit = () => lessonFlowController.toggleWordsEdit();
    window.saveWordsEdit = () => { lessonFlowController.saveWordsEdit(); };
    window.deleteSelectedLesson = () => lessonFlowController.deleteSelectedLesson();
    window.clearRecords = () => recordManager.clearRecords(lessonFlowController.customLessons);
    window.replayCurrentWord = () => gameController.replayCurrentWord();
    // Public lesson and favorites functions
    window.showPublicLessonBrowser = () => lessonFlowController.showPublicLessonBrowser();
    window.closePublicLessonBrowser = () => uiManager.hideModal('public-lesson-browser');
    window.addToFavorites = (lessonId: string, lessonName: string, ownerDisplayName: string) =>
        lessonFlowController.addToFavorites(lessonId, lessonName, ownerDisplayName);
    window.removeFromFavorites = (favoriteId: string) =>
        lessonFlowController.removeFromFavorites(favoriteId);
});

// window load handler
window.addEventListener('load', () => {
    // DOMContentLoaded already handles all initialization
    // load event ensures all resources (CSS, images) are ready
});
