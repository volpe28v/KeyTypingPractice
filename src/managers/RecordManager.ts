import type { LessonData, UserFavorite } from '../types';
import type { StorageManager } from './StorageManager';
import type { UIManager } from './UIManager';

/**
 * RecordManager - 記録管理クラス
 * タイピング記録の保存、読み込み、表示、クリアを処理
 */
export class RecordManager {
    private storageManager: StorageManager;
    private uiManager: UIManager;
    public records: Record<string, any[]> = {};

    constructor(storageManager: StorageManager, uiManager: UIManager) {
        this.storageManager = storageManager;
        this.uiManager = uiManager;
    }

    saveRecords(): Promise<void> {
        return this.storageManager.saveRecords(this.records as any);
    }

    async loadRecords(): Promise<void> {
        this.records = await this.storageManager.loadRecords();
    }

    async addRecord(levelKey: string, time: number, mistakes: number = 0, totalTypes: number = 0): Promise<void> {
        if (!this.records[levelKey]) {
            this.records[levelKey] = [];
        }

        const accuracy = mistakes === 0 ? 100 : Math.round((totalTypes / (totalTypes + mistakes)) * 100);

        const newRecord: any = {
            elapsedTime: time,
            mistakes: mistakes,
            accuracy: accuracy,
            totalTypes: totalTypes,
            date: new Date().toLocaleDateString()
        };

        let shouldSaveNewRecord = false;

        if (this.records[levelKey].length === 0) {
            shouldSaveNewRecord = true;
        } else {
            const currentBestRecord = this.records[levelKey].reduce((best, current) => {
                const currentAccuracy = current.accuracy !== undefined ? current.accuracy : 100;
                const bestAccuracy = best.accuracy !== undefined ? best.accuracy : 100;
                const currentTime = current.elapsedTime || current;
                const bestTime = best.elapsedTime || best;

                if (currentAccuracy > bestAccuracy) {
                    return current;
                } else if (currentAccuracy === bestAccuracy && currentTime < bestTime) {
                    return current;
                }
                return best;
            });

            const currentBestAccuracy = currentBestRecord.accuracy !== undefined ? currentBestRecord.accuracy : 100;
            const currentBestTime = currentBestRecord.elapsedTime || currentBestRecord;

            if (accuracy > currentBestAccuracy || (accuracy === currentBestAccuracy && time < currentBestTime)) {
                shouldSaveNewRecord = true;
            }
        }

        if (shouldSaveNewRecord) {
            this.records[levelKey] = [newRecord];
            await this.storageManager.saveNewRecord(levelKey, newRecord);
            this.uiManager.showNewRecordMessage();
        }
    }

    getRecordForKey(key: string): { accuracy: number; elapsedTime: number } | null {
        const records = this.records[key];
        if (!records || records.length === 0) return null;

        const best = records[0];
        return {
            accuracy: best.accuracy !== undefined ? best.accuracy : 100,
            elapsedTime: best.elapsedTime || best
        };
    }

    displayBestTimes(customLessons: LessonData[]): void {
        customLessons.forEach(lesson => {
            const recordEl = document.getElementById(`lesson${lesson.id}-records`);

            if (recordEl) {
                recordEl.innerHTML = '';

                // 最高クリアレベルを検索
                let highestLevel = -1;
                for (let i = 5; i >= 0; i--) {
                    const record = this.getRecordForKey(`lesson${lesson.id}_${i}`);
                    if (record) {
                        highestLevel = i;
                        break;
                    }
                }

                if (highestLevel >= 0) {
                    const record = this.getRecordForKey(`lesson${lesson.id}_${highestLevel}`)!;
                    const seconds = Math.floor(record.elapsedTime / 1000);
                    recordEl.innerHTML = `<span class="highest-level">Lv${highestLevel}</span> <span class="highest-detail">${record.accuracy}% ${seconds}秒</span>`;
                    recordEl.classList.remove('empty');
                } else {
                    // 旧フォーマット（lesson${id}）の記録を確認
                    const legacyRecord = this.getRecordForKey(`lesson${lesson.id}`);
                    if (legacyRecord) {
                        const seconds = Math.floor(legacyRecord.elapsedTime / 1000);
                        recordEl.innerHTML = `<span class="highest-level">Lv-</span> <span class="highest-detail">${legacyRecord.accuracy}% ${seconds}秒</span>`;
                        recordEl.classList.remove('empty');
                    } else {
                        recordEl.textContent = '-';
                        recordEl.classList.add('empty');
                    }
                }
            }
        });
    }

    /**
     * お気に入りレッスンの最高記録を表示
     */
    displayFavoriteBestTimes(favorites: UserFavorite[]): void {
        favorites.forEach(favorite => {
            const recordEl = document.getElementById(`favLesson${favorite.lessonId}-records`);

            if (recordEl) {
                recordEl.innerHTML = '';

                // 最高クリアレベルを検索
                let highestLevel = -1;
                for (let i = 5; i >= 0; i--) {
                    const record = this.getRecordForKey(`favLesson${favorite.lessonId}_${i}`);
                    if (record) {
                        highestLevel = i;
                        break;
                    }
                }

                if (highestLevel >= 0) {
                    const record = this.getRecordForKey(`favLesson${favorite.lessonId}_${highestLevel}`)!;
                    const seconds = Math.floor(record.elapsedTime / 1000);
                    recordEl.innerHTML = `<span class="highest-level">Lv${highestLevel}</span> <span class="highest-detail">${record.accuracy}% ${seconds}秒</span>`;
                    recordEl.classList.remove('empty');
                } else {
                    recordEl.textContent = '-';
                    recordEl.classList.add('empty');
                }
            }
        });
    }

    async clearRecords(customLessons: LessonData[]): Promise<void> {
        if (confirm('すべての記録をクリアしますか？')) {
            await this.storageManager.clearAllRecords();
            this.records = {};
            customLessons.forEach(lesson => {
                this.records[`lesson${lesson.id}`] = [];
            });
            this.displayBestTimes(customLessons);
        }
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
