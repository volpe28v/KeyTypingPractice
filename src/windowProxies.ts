import type { GameManager } from './managers/GameManager';

/**
 * windowProxies - GameManagerプロパティへのwindowプロキシ設定
 * レガシー互換のため、window.* でGameManagerプロパティにアクセスできるようにする
 */
export function setupWindowProxies(gameManager: GameManager): void {
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
}
