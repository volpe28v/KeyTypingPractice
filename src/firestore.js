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
  serverTimestamp 
} from 'firebase/firestore';

export class FirestoreManager {
  constructor(userId) {
    this.userId = userId;
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Online - Firestore available');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📱 Offline - Using LocalStorage');
    });
  }

  // カスタムレッスンの保存
  async saveCustomLesson(lesson) {
    if (!this.isOnline || !this.userId) {
      console.log('💾 Saving lesson to LocalStorage (offline or not authenticated)');
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
      console.log('☁️ Lesson saved to Firestore:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving lesson to Firestore:', error);
      return null;
    }
  }

  // カスタムレッスンの読み込み
  async loadCustomLessons() {
    if (!this.isOnline || !this.userId) {
      console.log('💾 Loading lessons from LocalStorage (offline or not authenticated)');
      return [];
    }

    try {
      const q = query(
        collection(db, 'lessons'),
        where('userId', '==', this.userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const lessons = [];
      
      querySnapshot.forEach((doc) => {
        lessons.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`☁️ Loaded ${lessons.length} lessons from Firestore`);
      return lessons;
    } catch (error) {
      console.error('❌ Error loading lessons from Firestore:', error);
      return [];
    }
  }

  // カスタムレッスンの更新
  async updateCustomLesson(lessonId, updates) {
    if (!this.isOnline || !this.userId) {
      console.log('💾 Updating lesson in LocalStorage (offline or not authenticated)');
      return false;
    }

    try {
      const lessonRef = doc(db, 'lessons', lessonId);
      await updateDoc(lessonRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      console.log('☁️ Lesson updated in Firestore:', lessonId);
      return true;
    } catch (error) {
      console.error('❌ Error updating lesson in Firestore:', error);
      return false;
    }
  }

  // カスタムレッスンの削除
  async deleteCustomLesson(lessonId) {
    if (!this.isOnline || !this.userId) {
      console.log('💾 Deleting lesson from LocalStorage (offline or not authenticated)');
      return false;
    }

    try {
      await deleteDoc(doc(db, 'lessons', lessonId));
      console.log('☁️ Lesson deleted from Firestore:', lessonId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting lesson from Firestore:', error);
      return false;
    }
  }

  // ゲーム記録の保存
  async saveGameRecord(record) {
    if (!this.isOnline || !this.userId) {
      console.log('💾 Saving game record to LocalStorage (offline or not authenticated)');
      return null;
    }

    try {
      const recordData = {
        ...record,
        userId: this.userId,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'gameRecords'), recordData);
      console.log('☁️ Game record saved to Firestore:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving game record to Firestore:', error);
      return null;
    }
  }

  // ゲーム記録の読み込み
  async loadGameRecords() {
    if (!this.isOnline || !this.userId) {
      console.log('💾 Loading game records from LocalStorage (offline or not authenticated)');
      return [];
    }

    try {
      const q = query(
        collection(db, 'gameRecords'),
        where('userId', '==', this.userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records = [];
      
      querySnapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`☁️ Loaded ${records.length} game records from Firestore`);
      return records;
    } catch (error) {
      console.error('❌ Error loading game records from Firestore:', error);
      return [];
    }
  }

  // ユーザー設定の保存
  async saveUserSettings(settings) {
    if (!this.isOnline || !this.userId) {
      console.log('💾 Saving settings to LocalStorage (offline or not authenticated)');
      return false;
    }

    try {
      const userRef = doc(db, 'users', this.userId);
      await setDoc(userRef, {
        settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('☁️ User settings saved to Firestore');
      return true;
    } catch (error) {
      console.error('❌ Error saving user settings to Firestore:', error);
      return false;
    }
  }

  // ユーザー設定の読み込み
  async loadUserSettings() {
    if (!this.isOnline || !this.userId) {
      console.log('💾 Loading settings from LocalStorage (offline or not authenticated)');
      return null;
    }

    try {
      const userRef = doc(db, 'users', this.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        console.log('☁️ User settings loaded from Firestore');
        return userDoc.data().settings || null;
      } else {
        console.log('📄 No user settings found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading user settings from Firestore:', error);
      return null;
    }
  }

  // ネットワーク状態の取得
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      userId: this.userId,
      canUseFirestore: this.isOnline && this.userId
    };
  }
}