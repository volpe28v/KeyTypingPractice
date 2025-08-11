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
  serverTimestamp,
  DocumentReference,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import type { LessonData, RecordData } from './types';

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
  async saveCustomLesson(lesson: LessonData): Promise<string | null> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot save lesson (offline or not authenticated)');
      return null;
    }

    try {
      const lessonData = {
        ...lesson,
        userId: this.userId,
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

  // カスタムレッスンの読み込み
  async loadCustomLessons(): Promise<LessonData[]> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot load lessons (offline or not authenticated)');
      return [];
    }

    try {
      const q = query(
        collection(db, 'lessons'),
        where('userId', '==', this.userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const lessons: LessonData[] = [];
      
      querySnapshot.forEach((doc) => {
        const lessonData = doc.data();
        lessons.push({
          firestoreId: doc.id,
          id: lessonData.id,
          name: lessonData.name,
          words: lessonData.words,
          userId: lessonData.userId
        } as LessonData);
      });


      return lessons;
    } catch (error) {
      console.error('❌ Error loading lessons from Firestore:', error);
      return [];
    }
  }

  // カスタムレッスンの更新
  async updateCustomLesson(lessonId: string, updates: Partial<LessonData>): Promise<boolean> {
    if (!this.isOnline || !this.userId) {
      console.warn('⚠️ Cannot update lesson (offline or not authenticated)');
      return false;
    }

    try {
      const lessonRef = doc(db, 'lessons', lessonId);
      await updateDoc(lessonRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      

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

  // ネットワーク状態の取得
  getNetworkStatus(): { isOnline: boolean; userId: string | null; canUseFirestore: boolean } {
    return {
      isOnline: this.isOnline,
      userId: this.userId,
      canUseFirestore: this.isOnline && !!this.userId
    };
  }
}