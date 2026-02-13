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
  ownerId?: string;             // レッスン作成者のユーザーID（新フィールド）
  ownerDisplayName?: string;    // レッスン作成者名（新フィールド）
  userId?: string;              // 後方互換用（旧フィールド、非推奨）
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

// お気に入りレッスンの型定義
export interface UserFavorite {
  firestoreId?: string;
  userId: string;
  lessonId: string;
  lessonName: string;
  ownerDisplayName: string;
  addedAt?: any;
}

// レッスン記録の型定義
export interface LessonRecord {
  firestoreId?: string;
  userId: string;
  displayName: string;
  lessonId: string;
  levelIndex: number;
  accuracy: number;
  elapsedTime: number;
  wordCount: number;
  createdAt?: any;
}

// レッスン別ランキングエントリの型定義
export interface LessonRankingEntry {
  userId: string;
  displayName: string;
  accuracy: number;
  elapsedTime: number;
}

// レッスンソースインターフェース（Strategy パターン）
export interface LessonSource {
    // レッスンデータの取得
    getLesson(): LessonData;

    // 記録キーの生成（レベルごとに異なる）
    getRecordKey(levelIndex: number): string;

    // レッスン記録をlessonRecordsに保存するか
    shouldSaveLessonRecord(): boolean;

    // 編集可能か
    canEdit(): boolean;

    // ランキングを表示するか
    showRanking(): boolean;

    // 表示情報（削除ボタン等の制御用）
    getDisplayInfo(): {
        showRemoveFavoriteButton: boolean;
        favoriteId?: string;
    };
}

// マイレッスンクラス
export class MyLesson implements LessonSource {
    constructor(
        private lesson: LessonData,
        private index: number
    ) {}

    getLesson(): LessonData {
        return this.lesson;
    }

    getRecordKey(levelIndex: number): string {
        return `lesson${this.lesson.id}_${levelIndex}`;
    }

    shouldSaveLessonRecord(): boolean {
        // マイレッスンでも firestoreId がある場合は公開レッスンとして保存
        return !!this.lesson.firestoreId;
    }

    canEdit(): boolean {
        return true;
    }

    showRanking(): boolean {
        return true;
    }

    getDisplayInfo() {
        return {
            showRemoveFavoriteButton: false
        };
    }

    getIndex(): number {
        return this.index;
    }
}

// お気に入りレッスンクラス
export class FavoriteLesson implements LessonSource {
    constructor(
        private lesson: LessonData,
        private favorite: UserFavorite
    ) {}

    getLesson(): LessonData {
        return this.lesson;
    }

    getRecordKey(levelIndex: number): string {
        return `favLesson${this.lesson.firestoreId}_${levelIndex}`;
    }

    shouldSaveLessonRecord(): boolean {
        return true; // お気に入りレッスンは必ず保存
    }

    canEdit(): boolean {
        return false;
    }

    showRanking(): boolean {
        return true;
    }

    getDisplayInfo() {
        return {
            showRemoveFavoriteButton: true,
            favoriteId: this.favorite.firestoreId
        };
    }
}