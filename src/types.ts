// 単語データの型定義
export interface WordData {
  word: string;
  meaning: string;
}

// レッスンデータの型定義
export interface LessonData {
  id: string;
  name: string;
  words: WordData[];
  userId?: string;
  firestoreId?: string;
  createdAt?: string;
}

// 記録データの型定義
export interface RecordData {
  date: string;
  totalWords: number;
  mistakes: number;
  accuracy: number;
  elapsedTime: number;
  levelName: string;
  userId?: string;
  firestoreId?: string;
  totalTypes?: number; // for backward compatibility
  id?: string; // for legacy compatibility
}

// レベルリストの型定義
export interface LevelData {
  level: number;
  description: string;
  words: WordData[];
}

// レッスンモードの型定義
export type LessonMode = 'vocabulary-learning' | 'progressive' | 'pronunciation-meaning' | 'pronunciation-only' | 'japanese-reading';