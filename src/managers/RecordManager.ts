import type { LessonData, UserFavorite } from '../types';
import type { StorageManager } from './StorageManager';
import type { UIManager } from './UIManager';

/**
 * RecordManager - 記録管理クラス
 * lessonRecordsからの記録表示を処理
 */
export class RecordManager {
    private storageManager: StorageManager;
    private uiManager: UIManager;

    constructor(storageManager: StorageManager, uiManager: UIManager) {
        this.storageManager = storageManager;
        this.uiManager = uiManager;
    }

    async displayBestTimes(customLessons: LessonData[]): Promise<void> {
        // 全レッスンの記録を並列取得
        const recordsPromises = customLessons.map(lesson => {
            const lessonId = lesson.firestoreId || lesson.id;
            return this.storageManager.loadMyBestLessonRecords(lessonId);
        });
        const allRecords = await Promise.all(recordsPromises);

        customLessons.forEach((lesson, idx) => {
            const recordEl = document.getElementById(`lesson${lesson.id}-records`);
            if (!recordEl) return;

            recordEl.innerHTML = '';
            const bestRecords = allRecords[idx];

            // 最高クリアレベルを検索
            let highestLevel = -1;
            for (let i = 5; i >= 0; i--) {
                if (bestRecords.get(i)) {
                    highestLevel = i;
                    break;
                }
            }

            if (highestLevel >= 0) {
                const record = bestRecords.get(highestLevel)!;
                const seconds = Math.floor(record.elapsedTime / 1000);
                recordEl.innerHTML = `<span class="highest-level">Lv${highestLevel}</span> <span class="highest-detail">${record.accuracy}% ${seconds}秒</span>`;
                recordEl.classList.remove('empty');
            } else {
                recordEl.textContent = '-';
                recordEl.classList.add('empty');
            }
        });
    }

    /**
     * お気に入りレッスンの最高記録を表示
     */
    async displayFavoriteBestTimes(favorites: UserFavorite[]): Promise<void> {
        // 全お気に入りの記録を並列取得
        const recordsPromises = favorites.map(favorite =>
            this.storageManager.loadMyBestLessonRecords(favorite.lessonId)
        );
        const allRecords = await Promise.all(recordsPromises);

        favorites.forEach((favorite, idx) => {
            const recordEl = document.getElementById(`favLesson${favorite.lessonId}-records`);
            if (!recordEl) return;

            recordEl.innerHTML = '';
            const bestRecords = allRecords[idx];

            // 最高クリアレベルを検索
            let highestLevel = -1;
            for (let i = 5; i >= 0; i--) {
                if (bestRecords.get(i)) {
                    highestLevel = i;
                    break;
                }
            }

            if (highestLevel >= 0) {
                const record = bestRecords.get(highestLevel)!;
                const seconds = Math.floor(record.elapsedTime / 1000);
                recordEl.innerHTML = `<span class="highest-level">Lv${highestLevel}</span> <span class="highest-detail">${record.accuracy}% ${seconds}秒</span>`;
                recordEl.classList.remove('empty');
            } else {
                recordEl.textContent = '-';
                recordEl.classList.add('empty');
            }
        });
    }

    hideRecords(): void {
        const recordsSidebar = document.querySelector('.records-sidebar') as HTMLElement;
        if (recordsSidebar) {
            recordsSidebar.style.display = 'none';
        }
    }

    showRecords(customLessons: LessonData[]): void {
        const recordsSidebar = document.querySelector('.records-sidebar') as HTMLElement;
        if (recordsSidebar) {
            recordsSidebar.style.display = 'block';
            this.displayBestTimes(customLessons);
        }
    }
}
