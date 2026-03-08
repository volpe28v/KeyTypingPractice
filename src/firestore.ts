import { db } from './firebase.ts';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  DocumentReference,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import type { LessonData, RecordData, XPRecord, UserFavorite, LessonRecord, LessonRankingEntry } from './types';

export class FirestoreManager {
  public userId: string | null;
  public isOnline: boolean;

  constructor(userId: string | null) {
    this.userId = userId;
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;

    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;

    });
  }

  // カスタムレッスンの保存
  async saveCustomLesson(lesson: LessonData, displayName: string): Promise<string | null> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot save lesson (offline or not authenticated)');
      return null;
    }

    try {
      const lessonData = {
        ...lesson,
        ownerId: this.userId,
        ownerDisplayName: displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'lessons'), lessonData);

      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving lesson to Firestore:', error);
      return null;
    }
  }

  // カスタムレッスンの読み込み（後方互換性対応）
  async loadCustomLessons(): Promise<LessonData[]> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot load lessons (offline or not authenticated)');
      return [];
    }

    try {
      // 後方互換性: ownerIdとuserIdの両方でクエリして統合
      const [ownerIdResults, userIdResults] = await Promise.all([
        // 新しいレッスン: ownerIdで検索
        getDocs(query(
          collection(db, 'lessons'),
          where('ownerId', '==', this.userId),
          orderBy('createdAt', 'desc')
        )).catch(() => ({ docs: [] as any[] })),
        // 古いレッスン: userIdで検索
        getDocs(query(
          collection(db, 'lessons'),
          where('userId', '==', this.userId),
          orderBy('createdAt', 'desc')
        )).catch(() => ({ docs: [] as any[] }))
      ]);

      // 統合してfirestoreIdでDuplicate除去
      const lessonsMap = new Map<string, LessonData>();
      [ownerIdResults, userIdResults].forEach((snapshot: QuerySnapshot<DocumentData> | { docs: any[] }) => {
        snapshot.docs.forEach((doc) => {
          if (!lessonsMap.has(doc.id)) {
            const data = doc.data();
            lessonsMap.set(doc.id, {
              firestoreId: doc.id,
              id: data.id,
              name: data.name,
              words: data.words,
              ownerId: data.ownerId || data.userId,  // フォールバック
              ownerDisplayName: data.ownerDisplayName || 'Unknown',
              language: data.language || 'en-US'
            } as LessonData);
          }
        });
      });

      return Array.from(lessonsMap.values());
    } catch (error) {
      console.error('❌ Error loading lessons from Firestore:', error);
      return [];
    }
  }

  // カスタムレッスンの更新
  async updateCustomLesson(
    lessonId: string,
    updates: Partial<LessonData>,
    displayName?: string  // 新規追加（オプショナル）
  ): Promise<boolean> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot update lesson (offline or not authenticated)');
      return false;
    }

    try {
      const lessonRef = doc(db, 'lessons', lessonId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // displayName が渡された場合のみ ownerDisplayName を更新
      if (displayName) {
        updateData.ownerDisplayName = displayName;
      }

      await updateDoc(lessonRef, updateData);


      return true;
    } catch (error) {
      console.error('❌ Error updating lesson in Firestore:', error);
      return false;
    }
  }

  // カスタムレッスンの削除
  async deleteCustomLesson(lessonId: string): Promise<boolean> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot delete lesson (offline or not authenticated)');
      return false;
    }

    try {
      await deleteDoc(doc(db, 'lessons', lessonId));

      return true;
    } catch (error) {
      console.error('❌ Error deleting lesson from Firestore:', error);
      return false;
    }
  }

  // ゲーム記録の保存
  async saveGameRecord(record: RecordData): Promise<string | null> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot save game record (offline or not authenticated)');
      return null;
    }

    try {
      const recordData = {
        ...record,
        userId: this.userId,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'gameRecords'), recordData);

      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving game record to Firestore:', error);
      return null;
    }
  }

  // ゲーム記録の読み込み
  async loadGameRecords(): Promise<RecordData[]> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot load game records (offline or not authenticated)');
      return [];
    }

    try {
      const q = query(
        collection(db, 'gameRecords'),
        where('userId', '==', this.userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const records: RecordData[] = [];
      
      querySnapshot.forEach((doc) => {
        const recordData = doc.data();
        records.push({
          firestoreId: doc.id,
          date: recordData.date,
          totalWords: recordData.totalWords,
          mistakes: recordData.mistakes,
          accuracy: recordData.accuracy,
          elapsedTime: recordData.elapsedTime,
          levelName: recordData.levelName,
          userId: recordData.userId
        } as RecordData);
      });


      return records;
    } catch (error) {
      console.error('❌ Error loading game records from Firestore:', error);
      return [];
    }
  }

  // ユーザー設定の保存
  async saveUserSettings(settings: any): Promise<boolean> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot save settings (offline or not authenticated)');
      return false;
    }

    try {
      const userRef = doc(db, 'users', this.userId);
      await setDoc(userRef, {
        settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      

      return true;
    } catch (error) {
      console.error('❌ Error saving user settings to Firestore:', error);
      return false;
    }
  }

  // ユーザー設定の読み込み
  async loadUserSettings(): Promise<any | null> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot load settings (offline or not authenticated)');
      return null;
    }

    try {
      const userRef = doc(db, 'users', this.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {

        return userDoc.data().settings || null;
      } else {

        return null;
      }
    } catch (error) {
      console.error('❌ Error loading user settings from Firestore:', error);
      return null;
    }
  }

  // 全ての記録をクリア
  async clearAllRecords(): Promise<void> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot clear records (offline or not authenticated)');
      throw new Error('Cannot clear records: offline or not authenticated');
    }

    try {
      console.log('🗑️ Starting to clear all records from Firestore...');
      
      // ユーザーの全記録を取得
      const recordsQuery = query(
        collection(db, 'gameRecords'),
        where('userId', '==', this.userId)
      );
      
      const recordsSnapshot = await getDocs(recordsQuery);
      console.log(`📊 Found ${recordsSnapshot.size} records to delete`);
      
      // 各記録を削除
      const deletePromises = recordsSnapshot.docs.map(async (docSnapshot) => {
        await deleteDoc(doc(db, 'gameRecords', docSnapshot.id));
        console.log(`🗑️ Deleted record: ${docSnapshot.id}`);
      });
      
      await Promise.all(deletePromises);
      console.log('✅ All Firestore records deleted successfully');
      
    } catch (error) {
      console.error('❌ Error clearing Firestore records:', error);
      throw error;
    }
  }

  // XPレコードの保存
  async saveXPRecord(record: XPRecord): Promise<string | null> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot save XP record (offline or not authenticated)');
      return null;
    }

    try {
      const xpData = {
        ...record,
        userId: this.userId,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'weeklyXP'), xpData);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving XP record to Firestore:', error);
      return null;
    }
  }

  // 今週のXPレコードを全件取得
  async loadWeeklyXP(weekKey: string): Promise<XPRecord[]> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot load weekly XP (offline or not authenticated)');
      return [];
    }

    try {
      const q = query(
        collection(db, 'weeklyXP'),
        where('weekKey', '==', weekKey)
      );

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const records: XPRecord[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          lessonId: data.lessonId,
          levelIndex: data.levelIndex,
          userId: data.userId,
          displayName: data.displayName,
          xp: data.xp,
          accuracy: data.accuracy,
          wordCount: data.wordCount,
          weekKey: data.weekKey,
          createdAt: data.createdAt
        });
      });

      return records;
    } catch (error) {
      console.error('❌ Error loading weekly XP from Firestore:', error);
      return [];
    }
  }

  // ネットワーク状態の取得
  getNetworkStatus(): { isOnline: boolean; userId: string | null; canUseFirestore: boolean } {
    return {
      isOnline: this.isOnline,
      userId: this.userId,
      canUseFirestore: this.isOnline && !!this.userId
    };
  }

  // 全公開レッスンを取得（自分のレッスンを除く）
  async loadAllPublicLessons(): Promise<LessonData[]> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot load public lessons (offline or not authenticated)');
      return [];
    }

    try {
      const q = query(
        collection(db, 'lessons'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const lessons: LessonData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // 自分のレッスンは除外
        if (data.ownerId !== this.userId) {
          lessons.push({
            firestoreId: doc.id,
            id: data.id,
            name: data.name,
            words: data.words,
            ownerId: data.ownerId,
            ownerDisplayName: data.ownerDisplayName || 'Unknown',  // フォールバック追加
            createdAt: data.createdAt,
            language: data.language || 'en-US'
          } as LessonData);
        }
      });

      // createdAtの型混在（Timestamp/文字列）に対応したクライアント側ソート
      lessons.sort((a, b) => {
        const getTime = (v: any): number => {
          if (!v) return 0;
          if (v.toDate) return v.toDate().getTime();
          if (typeof v === 'string') { const d = new Date(v); return isNaN(d.getTime()) ? 0 : d.getTime(); }
          return 0;
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });

      return lessons;
    } catch (error) {
      console.error('❌ Error loading public lessons:', error);
      return [];
    }
  }

  /**
   * レッスンIDからレッスンデータを取得
   */
  async loadLessonById(lessonId: string): Promise<LessonData | null> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot load lesson (offline or not authenticated)');
      return null;
    }

    try {
      const lessonRef = doc(db, 'lessons', lessonId);
      const lessonDoc = await getDoc(lessonRef);

      if (!lessonDoc.exists()) {
        console.warn('⚠️ Lesson not found:', lessonId);
        return null;
      }

      const data = lessonDoc.data();
      return {
        firestoreId: lessonDoc.id,
        id: data.id,
        name: data.name,
        words: data.words,
        ownerId: data.ownerId || data.userId,
        ownerDisplayName: data.ownerDisplayName || 'Unknown'
      } as LessonData;
    } catch (error) {
      console.error('❌ Error loading lesson by ID:', error);
      return null;
    }
  }

  // お気に入りに追加
  async addFavorite(lessonId: string, lessonName: string, ownerDisplayName: string): Promise<string | null> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot add favorite (offline or not authenticated)');
      return null;
    }

    try {
      const favoriteData = {
        userId: this.userId,
        lessonId: lessonId,
        lessonName: lessonName,
        ownerDisplayName: ownerDisplayName,
        addedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'userFavorites'), favoriteData);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding favorite:', error);
      return null;
    }
  }

  // お気に入りから削除
  async removeFavorite(favoriteId: string): Promise<boolean> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot remove favorite (offline or not authenticated)');
      return false;
    }

    try {
      await deleteDoc(doc(db, 'userFavorites', favoriteId));
      return true;
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      return false;
    }
  }

  // 自分のお気に入り一覧を取得
  async loadUserFavorites(): Promise<UserFavorite[]> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot load favorites (offline or not authenticated)');
      return [];
    }

    try {
      const q = query(
        collection(db, 'userFavorites'),
        where('userId', '==', this.userId),
        orderBy('addedAt', 'desc')
      );

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const favorites: UserFavorite[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favorites.push({
          firestoreId: doc.id,
          userId: data.userId,
          lessonId: data.lessonId,
          lessonName: data.lessonName,
          ownerDisplayName: data.ownerDisplayName,
          addedAt: data.addedAt
        });
      });

      return favorites;
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      return [];
    }
  }

  // レッスン記録を保存
  async saveLessonRecord(record: LessonRecord): Promise<string | null> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot save lesson record (offline or not authenticated)');
      return null;
    }

    try {
      const recordData = {
        ...record,
        userId: this.userId,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'lessonRecords'), recordData);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving lesson record:', error);
      return null;
    }
  }

  // レッスン別・モード別ランキングを取得
  async loadLessonRanking(lessonId: string, levelIndex: number): Promise<LessonRankingEntry[]> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot load lesson ranking (offline or not authenticated)');
      return [];
    }

    try {
      const q = query(
        collection(db, 'lessonRecords'),
        where('lessonId', '==', lessonId),
        where('levelIndex', '==', levelIndex)
      );

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const recordsMap = new Map<string, LessonRecord>();

      // ユーザーごとに最高記録を抽出（accuracy優先、同率ならelapsedTime優先）
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const record: LessonRecord = {
          userId: data.userId,
          displayName: data.displayName || 'Unknown',
          lessonId: data.lessonId,
          levelIndex: data.levelIndex,
          accuracy: data.accuracy,
          elapsedTime: data.elapsedTime,
          wordCount: data.wordCount,
          createdAt: data.createdAt
        };

        const existing = recordsMap.get(record.userId);
        if (!existing ||
            record.accuracy > existing.accuracy ||
            (record.accuracy === existing.accuracy && record.elapsedTime < existing.elapsedTime)) {
          recordsMap.set(record.userId, record);
        }
      });

      // ランキングエントリに変換
      const rankings: LessonRankingEntry[] = Array.from(recordsMap.values()).map(record => ({
        userId: record.userId,
        displayName: record.displayName || 'Unknown',
        accuracy: record.accuracy,
        elapsedTime: record.elapsedTime
      }));

      // ソート：accuracy降順、同率ならelapsedTime昇順
      rankings.sort((a, b) => {
        if (b.accuracy !== a.accuracy) {
          return b.accuracy - a.accuracy;
        }
        return a.elapsedTime - b.elapsedTime;
      });

      // 上位10件を返す
      return rankings.slice(0, 10);
    } catch (error) {
      console.error('❌ Error loading lesson ranking:', error);
      return [];
    }
  }
}