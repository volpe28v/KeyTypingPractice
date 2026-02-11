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

// モード名→レベル番号のマッピング
export const MODE_TO_LEVEL: Record<string, number> = {
    'vocabulary-learning': 0,
    'progressive': 1,
    'pronunciation-meaning': 2,
    'pronunciation-only': 3,
    'japanese-reading': 4,
    'pronunciation-blind': 5,
};

// XP記録の型定義
export interface XPRecord {
    lessonId: string;
    levelIndex: number;
    userId: string;
    displayName: string;
    xp: number;
    accuracy: number;
    wordCount: number;
    weekKey: string;
    createdAt?: any;
}

// ランキングエントリの型定義
export interface RankingEntry {
    userId: string;
    displayName: string;
    totalXP: number;
}

// モード別基本XP値
export const XP_PER_LEVEL: Record<number, number> = {
    0: 1, 1: 2, 2: 3, 3: 4, 4: 4, 5: 5
};

// XP計算
export function calculateXP(levelIndex: number, wordCount: number, accuracy: number): number {
    const base = XP_PER_LEVEL[levelIndex] ?? 1;
    const perfectBonus = accuracy === 100 ? 1.5 : 1.0;
    return Math.floor(base * wordCount * perfectBonus);
}

// 今週のweekKeyを生成（ISO 8601 週番号）
export function getWeekKey(): string {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
    const week = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}