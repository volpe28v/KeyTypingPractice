import type { LessonData, RecordData } from '../types.ts';

/**
 * StorageManager - データストレージ管理クラス
 * Firestoreとの連携でカスタムレッスンと記録データを管理
 */
export class StorageManager {
    public firestoreManager: any = null;

    constructor() {
        this.firestoreManager = null;
    }

    // Firestoreマネージャーを設定
    setFirestoreManager(firestoreManager: any): void {
        this.firestoreManager = firestoreManager;
    }

    // 複数のカスタムレッスンを保存（Firestoreのみ）
    async saveCustomLessons(lessons: LessonData[]): Promise<void> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return;
        }

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

        } catch (error) {
            console.error('❌ Error saving to Firestore:', error);
        }
    }

    // 複数のカスタムレッスンを読み込み（Firestoreのみ）
    async loadCustomLessons(): Promise<LessonData[]> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return [];
        }

        try {
            const firestoreLessons = await this.firestoreManager.loadCustomLessons();

            return firestoreLessons;
        } catch (error) {
            console.error('❌ Error loading from Firestore:', error);
            return [];
        }
    }

    // タイピング記録を保存（Firestoreのみ）
    async saveRecords(records: any): Promise<void> {
        console.log('🔍 saveRecords called:', records);
        
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return;
        }

        try {
            // 各記録をFirestoreに保存（新しい記録のみ）
            for (const [levelName, levelRecords] of Object.entries(records)) {
                if (Array.isArray(levelRecords)) {
                    for (const record of levelRecords) {
                        if (!record.firestoreId) {
                            // RecordData型に合わせてフィールド名を変換
                            const recordData = {
                                date: record.date || new Date().toLocaleDateString(),
                                totalWords: record.totalTypes || 0,  // totalTypes → totalWords
                                mistakes: record.mistakes || 0,
                                accuracy: record.accuracy || 100,
                                elapsedTime: record.elapsedTime || 0,
                                levelName: levelName
                            };
                            console.log('🔍 Saving to Firestore:', recordData);
                            
                            const firestoreId = await this.firestoreManager.saveGameRecord(recordData);
                            console.log('🔍 Firestore response:', firestoreId);
                            
                            if (firestoreId) {
                                record.firestoreId = firestoreId;
                                console.log('✅ Record saved successfully');
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error('❌ Error saving records to Firestore:', error);
        }
    }

    // タイピング記録を読み込み（Firestoreのみ）
    async loadRecords(): Promise<any> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return {};
        }

        try {
            const firestoreRecords = await this.firestoreManager.loadGameRecords();
            
            // Firestoreのデータをローカル形式に変換
            const records = {};
            for (const firestoreRecord of firestoreRecords) {
                const levelName = firestoreRecord.levelName;
                
                if (!records[levelName]) {
                    records[levelName] = [];
                }
                
                records[levelName].push({
                    ...firestoreRecord,
                    firestoreId: firestoreRecord.id
                });
            }
            
            return records;
        } catch (error) {
            console.error('❌ Error loading records from Firestore:', error);
            return {};
        }
    }

    // 後方互換性のため残すメソッド（何もしない）
    loadCustomWords(): string {
        return '';
    }

    saveCustomWords(wordsText: string): void {
        // 何もしない（後方互換性のため）
    }
}