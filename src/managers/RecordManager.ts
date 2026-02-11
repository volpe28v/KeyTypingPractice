import type { LessonData } from '../types';
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

    displayBestTimes(customLessons: LessonData[]): void {
        customLessons.forEach(lesson => {
            const lessonRecords = this.records[`lesson${lesson.id}`] || [];
            const lessonRecordsList = document.getElementById(`lesson${lesson.id}-records`);

            if (lessonRecordsList) {
                lessonRecordsList.innerHTML = '';

                if (lessonRecords.length > 0) {
                    const bestRecord = lessonRecords.reduce((best, current) => {
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

                    const li = document.createElement('li');
                    const recordTime = bestRecord.elapsedTime || bestRecord;
                    const recordAccuracy = bestRecord.accuracy !== undefined ? bestRecord.accuracy : 100;

                    li.innerHTML = `<span style="color: var(--color-success); font-size: 1.2rem; font-weight: bold;">${recordAccuracy}%</span><br><small style="color: var(--text-muted);">${this.uiManager.formatTime(recordTime)}</small>`;
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
