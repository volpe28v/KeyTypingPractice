import type { LessonData, RecordData, XPRecord, RankingEntry, UserFavorite, LessonRecord, LessonRankingEntry } from '../types.ts';
import { getWeekKey } from '../types.ts';
import type { FirestoreManager } from '../firestore.ts';

/**
 * StorageManager - データストレージ管理クラス
 * Firestoreとの連携でカスタムレッスンと記録データを管理
 */
export class StorageManager {
    public firestoreManager: FirestoreManager | null = null;

    constructor() {
        this.firestoreManager = null;
    }

    // Firestoreマネージャーを設定
    setFirestoreManager(firestoreManager: FirestoreManager): void {
        this.firestoreManager = firestoreManager;
    }

    // 複数のカスタムレッスンを保存（Firestoreのみ）
    async saveCustomLessons(lessons: LessonData[], displayName: string): Promise<void> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return;
        }

        try {
            // 各レッスンをFirestoreに保存
            for (const lesson of lessons) {
                if (!lesson.firestoreId) {
                    // 新しいレッスンの場合
                    const firestoreId = await this.firestoreManager.saveCustomLesson(lesson, displayName);
                    if (firestoreId) {
                        lesson.firestoreId = firestoreId;
                    }
                } else {
                    // 既存のレッスンの場合
                    await this.firestoreManager.updateCustomLesson(lesson.firestoreId, lesson, displayName);
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

    // 新しい記録のみを保存（Firestoreのみ）
    async saveNewRecord(levelName: string, record: RecordData): Promise<void> {
        console.log('🔍 saveNewRecord called:', levelName, record);
        
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return;
        }

        try {
            // 新しい記録のみ保存
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

        } catch (error) {
            console.error('❌ Error saving record to Firestore:', error);
        }
    }

    // タイピング記録を保存（Firestoreのみ）- 後方互換性のため残存
    async saveRecords(records: RecordData[]): Promise<void> {
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

    // XPレコードを保存
    async saveXPRecord(record: XPRecord): Promise<void> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return;
        }

        try {
            await this.firestoreManager.saveXPRecord(record);
        } catch (error) {
            console.error('❌ Error saving XP record:', error);
        }
    }

    // 今週のランキングを取得
    async loadWeeklyRanking(): Promise<RankingEntry[]> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return [];
        }

        try {
            const weekKey = getWeekKey();
            const records = await this.firestoreManager.loadWeeklyXP(weekKey);

            // userIdごとにXPを合計
            const userXPMap = new Map<string, { displayName: string; totalXP: number }>();
            for (const record of records) {
                const existing = userXPMap.get(record.userId);
                if (existing) {
                    existing.totalXP += record.xp;
                } else {
                    userXPMap.set(record.userId, {
                        displayName: record.displayName,
                        totalXP: record.xp,
                    });
                }
            }

            // ランキング配列に変換してソート
            const rankings: RankingEntry[] = [];
            for (const [userId, data] of userXPMap) {
                rankings.push({
                    userId,
                    displayName: data.displayName,
                    totalXP: data.totalXP,
                });
            }
            rankings.sort((a, b) => b.totalXP - a.totalXP);

            return rankings;
        } catch (error) {
            console.error('❌ Error loading weekly ranking:', error);
            return [];
        }
    }

    // 後方互換性のため残すメソッド（何もしない）
    loadCustomWords(): string {
        return '';
    }

    saveCustomWords(wordsText: string): void {
        // 何もしない（後方互換性のため）
    }

    // 全ての記録をクリア（LocalStorageとFirestore）
    async clearAllRecords(): Promise<void> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            // LocalStorageのみクリア
            localStorage.removeItem('typingRecords');
            return;
        }

        try {
            console.log('🗑️ Clearing all records from Firestore and localStorage...');

            // Firestoreの全記録を削除
            await this.firestoreManager.clearAllRecords();

            // LocalStorageもクリア
            localStorage.removeItem('typingRecords');

            console.log('✅ All records cleared successfully');
        } catch (error) {
            console.error('❌ Error clearing records:', error);
            // エラーが発生してもLocalStorageはクリア
            localStorage.removeItem('typingRecords');
        }
    }

    // 全公開レッスンを取得（自分のレッスンを除く）
    async loadAllPublicLessons(): Promise<LessonData[]> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return [];
        }

        try {
            return await this.firestoreManager.loadAllPublicLessons();
        } catch (error) {
            console.error('❌ Error loading public lessons:', error);
            return [];
        }
    }

    /**
     * レッスンIDからレッスンデータを取得
     */
    async loadLessonById(lessonId: string): Promise<LessonData | null> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return null;
        }

        try {
            return await this.firestoreManager.loadLessonById(lessonId);
        } catch (error) {
            console.error('❌ Error loading lesson by ID:', error);
            return null;
        }
    }

    // お気に入りに追加
    async addFavorite(lessonId: string, lessonName: string, ownerDisplayName: string): Promise<boolean> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return false;
        }

        try {
            const favoriteId = await this.firestoreManager.addFavorite(lessonId, lessonName, ownerDisplayName);
            return favoriteId !== null;
        } catch (error) {
            console.error('❌ Error adding favorite:', error);
            return false;
        }
    }

    // お気に入りから削除
    async removeFavorite(favoriteId: string): Promise<boolean> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return false;
        }

        try {
            return await this.firestoreManager.removeFavorite(favoriteId);
        } catch (error) {
            console.error('❌ Error removing favorite:', error);
            return false;
        }
    }

    // 自分のお気に入り一覧を取得
    async loadUserFavorites(): Promise<UserFavorite[]> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return [];
        }

        try {
            return await this.firestoreManager.loadUserFavorites();
        } catch (error) {
            console.error('❌ Error loading favorites:', error);
            return [];
        }
    }

    // レッスン記録を保存
    async saveLessonRecord(record: LessonRecord): Promise<boolean> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return false;
        }

        try {
            const recordId = await this.firestoreManager.saveLessonRecord(record);
            return recordId !== null;
        } catch (error) {
            console.error('❌ Error saving lesson record:', error);
            return false;
        }
    }

    // レッスン別・モード別ランキングを取得
    async loadLessonRanking(lessonId: string, levelIndex: number): Promise<LessonRankingEntry[]> {
        if (!this.firestoreManager) {
            console.warn('⚠️ Firestore not connected. Please login first.');
            return [];
        }

        try {
            return await this.firestoreManager.loadLessonRanking(lessonId, levelIndex);
        } catch (error) {
            console.error('❌ Error loading lesson ranking:', error);
            return [];
        }
    }
}