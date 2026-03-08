# タイピングマスター

キータイピング練習アプリケーション。TypeScript + Vite で構築し、Firebase（Auth + Firestore）でデータ永続化を行う SPA。

## 機能

### 学習モード（6種類）

| レベル | モード | 内容 |
|--------|--------|------|
| Lv0 | 単語学習 | 発音聞き流し（Enter/Spaceで日英交互再生） |
| Lv1 | 段階的練習 | 全表示→徐々に隠す→全隠し（隠し文字選択UI付き） |
| Lv2 | 発音+意味 | 発音と意味を表示してスペル入力 |
| Lv3 | 発音のみ | 発音のみでスペル入力（文字数表示あり） |
| Lv4 | 日本語読み | 日本語の意味からスペル入力 |
| Lv5 | 発音のみ（ブラインド） | 発音のみでスペル入力（文字数非表示） |

### その他の機能

- カスタムレッスンの作成・編集・削除
- 多言語対応（英語 / マレー語）
- スペース・アポストロフィの入力省略
- リアルタイムキーボードビジュアライゼーション
- コンボシステム・XPランキング
- お気に入りレッスン・レッスン別ランキング
- ゲームクリア演出（紙吹雪・効果音・称賛メッセージ）

## セットアップ

```bash
npm install
cp .env.template .env  # Firebase環境変数を設定
npm run dev             # 開発サーバー起動（ポート3000）
```

## コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動（Vite） |
| `npm run build` | プロダクションビルド（`dist/`） |
| `npm run preview` | ビルドプレビュー |
| `npm run typecheck` | TypeScript型チェック |
| `npm run deploy` | Firebase Hostingにデプロイ |

## アーキテクチャ

### ファイル構成

```
index.html              # メインHTML
src/
  main.ts               # エントリーポイント
  types.ts              # TypeScript型定義
  firebase.ts           # Firebase初期化
  auth.ts               # AuthManager（Google認証）
  firestore.ts          # FirestoreManager（CRUD操作）
  InputHandler.ts       # 入力処理
  windowProxies.ts      # レガシー互換プロキシ
  styles.css            # スタイルシート
  controllers/
    GameController.ts   # ゲーム進行制御
    LessonFlowController.ts # レッスン管理フロー
  managers/
    AudioManager.ts     # 音声機能（タイピング音、発音、効果音）
    GameManager.ts      # ゲーム状態・ロジック管理
    KeyboardManager.ts  # キーボード表示・ハイライト
    LessonManager.ts    # レッスンCRUD・単語解析
    RecordManager.ts    # 記録管理・表示
    StorageManager.ts   # データ永続化（Firestore連携）
    UIManager.ts        # DOM操作・UI状態管理
  levels/
    BaseLevel.ts        # レベル基底クラス（abstract）
    level-manager.ts    # LevelManager（多態性によるレベル切替）
    level0-vocabulary.ts       # Lv0: 単語学習
    level1-progressive.ts      # Lv1: 段階的練習
    level2-pronunciation-meaning.ts  # Lv2: 発音+意味
    level3-pronunciation-only.ts     # Lv3: 発音のみ
    level4-japanese-reading.ts       # Lv4: 日本語読み
    level5-pronunciation-blind.ts    # Lv5: 発音のみ（ブラインド）
```

### コンポーネント依存関係

```mermaid
graph TB
    subgraph External["外部サービス"]
        FirebaseAuth["Firebase Auth<br/>(Google認証)"]
        Firestore["Cloud Firestore"]
    end

    subgraph Controllers["コントローラー層"]
        GC["GameController<br/>ゲーム進行制御"]
        LFC["LessonFlowController<br/>レッスン管理フロー"]
        IH["InputHandler<br/>入力処理"]
    end

    subgraph Managers["マネージャー層"]
        GM["GameManager<br/>ゲーム状態"]
        AM["AudioManager<br/>音声・効果音"]
        UM["UIManager<br/>DOM操作"]
        KM["KeyboardManager<br/>キーボード表示"]
        SM["StorageManager<br/>データ永続化"]
        LM["LessonManager<br/>レッスンCRUD"]
        RM["RecordManager<br/>記録管理"]
    end

    subgraph Levels["レベル層"]
        LvM["LevelManager"]
        BL["BaseLevel"]
        L0["Lv0 単語学習"]
        L1["Lv1 段階的練習"]
        L2["Lv2 発音+意味"]
        L3["Lv3 発音のみ"]
        L4["Lv4 日本語読み"]
        L5["Lv5 ブラインド"]
    end

    subgraph Infrastructure["インフラ層"]
        AuthMgr["AuthManager"]
        FSMgr["FirestoreManager"]
    end

    FirebaseAuth --> AuthMgr
    Firestore --> FSMgr

    GC --> GM
    GC --> AM
    GC --> UM
    GC --> RM
    GC --> LFC
    GC --> LvM
    GC --> SM

    LFC --> LM
    LFC --> SM
    LFC --> UM
    LFC --> GM
    LFC --> RM

    IH --> GM
    IH --> UM
    IH --> AM
    IH --> KM
    IH --> LvM

    SM --> FSMgr
    RM --> SM

    LvM --> BL
    BL --> L0
    BL --> L1
    BL --> L2
    BL --> L3
    BL --> L4
    BL --> L5

    LvM --> GM
    LvM --> AM
    LvM --> UM
```

## ドメインモデル

### エンティティ関連図

```mermaid
classDiagram
    direction TB

    class User {
        +string uid
        +string displayName
        +string email
        +string photoURL
    }

    class LessonData {
        +string id
        +string firestoreId
        +string name
        +WordData[] words
        +string ownerId
        +string ownerDisplayName
        +string language
        +Timestamp createdAt
    }

    class WordData {
        +string word
        +string meaning
    }

    class LessonRecord {
        +string firestoreId
        +string userId
        +string displayName
        +string lessonId
        +number levelIndex
        +number accuracy
        +number elapsedTime
        +number wordCount
        +Timestamp createdAt
    }

    class RecordData {
        +string date
        +number totalWords
        +number mistakes
        +number accuracy
        +number elapsedTime
        +string levelName
        +string userId
    }

    class XPRecord {
        +string lessonId
        +number levelIndex
        +string userId
        +string displayName
        +number xp
        +number accuracy
        +number wordCount
        +string weekKey
    }

    class UserFavorite {
        +string firestoreId
        +string userId
        +string lessonId
        +string lessonName
        +string ownerDisplayName
        +Timestamp addedAt
    }

    class RankingEntry {
        +string userId
        +string displayName
        +number totalXP
    }

    class LessonRankingEntry {
        +string userId
        +string displayName
        +number accuracy
        +number elapsedTime
    }

    User "1" --> "*" LessonData : owns
    User "1" --> "*" LessonRecord : plays
    User "1" --> "*" RecordData : records
    User "1" --> "*" XPRecord : earns
    User "1" --> "*" UserFavorite : favorites
    LessonData "1" --> "*" WordData : contains
    LessonData "1" --> "*" LessonRecord : has records
    LessonData "1" --> "*" XPRecord : generates XP
    UserFavorite "*" --> "1" LessonData : references
    LessonRecord ..> LessonRankingEntry : aggregated to
    XPRecord ..> RankingEntry : aggregated to
```

### レッスンソース（Strategy パターン）

```mermaid
classDiagram
    direction TB

    class LessonSource {
        <<interface>>
        +getLesson() LessonData
        +getRecordKey(levelIndex) string
        +shouldSaveLessonRecord() boolean
        +canEdit() boolean
        +showRanking() boolean
        +getDisplayInfo() object
    }

    class MyLesson {
        -LessonData lesson
        -number index
        +getRecordKey(levelIndex) string
        +shouldSaveLessonRecord() boolean
        +canEdit() boolean
        +getIndex() number
    }

    class FavoriteLesson {
        -LessonData lesson
        -UserFavorite favorite
        +getRecordKey(levelIndex) string
        +shouldSaveLessonRecord() boolean
        +canEdit() boolean
    }

    LessonSource <|.. MyLesson
    LessonSource <|.. FavoriteLesson

    note for MyLesson "recordKey: lesson{id}_{level}\ncanEdit: true\nsaveLessonRecord: firestoreIdがある場合のみ"
    note for FavoriteLesson "recordKey: favLesson{firestoreId}_{level}\ncanEdit: false\nsaveLessonRecord: 常にtrue"
```

### レベル階層（Template Method パターン）

```mermaid
classDiagram
    direction TB

    class BaseLevel {
        <<abstract>>
        #GameManager gameManager
        #AudioManager audioManager
        #UIManager uiManager
        +string name
        +string displayName
        +initializeWord(word, playAudio, clearInput)*
        +updateDisplay()*
        +handleWordComplete()*
        +validateInput(e, word) boolean
        +playAudio(word) void
        +replayAudio() void
    }

    class VocabularyLearningLevel {
        Lv0: 単語学習
        Enter/Spaceで日英交互再生
        タイピング不要
    }

    class ProgressiveLearningLevel {
        Lv1: 段階的練習
        全表示→徐々に隠す→全隠し
        隠し文字選択UI
        3回ミスで進捗巻き戻し
    }

    class PronunciationMeaningLevel {
        Lv2: 発音+意味
        意味表示+音声再生
        スペル入力
    }

    class PronunciationOnlyLevel {
        Lv3: 発音のみ
        文字数表示あり
        スペル入力
    }

    class JapaneseReadingLevel {
        Lv4: 日本語読み
        意味からスペル入力
    }

    class PronunciationBlindLevel {
        Lv5: 発音のみ（ブラインド）
        文字数非表示
        最高難度
    }

    class LevelManager {
        -levels: Map~string, BaseLevel~
        -currentLevel: BaseLevel
        +setLevel(name) boolean
        +getCurrentLevel() BaseLevel
    }

    BaseLevel <|-- VocabularyLearningLevel
    BaseLevel <|-- ProgressiveLearningLevel
    BaseLevel <|-- PronunciationMeaningLevel
    BaseLevel <|-- PronunciationOnlyLevel
    BaseLevel <|-- JapaneseReadingLevel
    BaseLevel <|-- PronunciationBlindLevel
    LevelManager "1" --> "*" BaseLevel : manages
```

### Firestore コレクション構成

```mermaid
erDiagram
    USERS {
        string uid PK
        object settings
        timestamp updatedAt
    }

    LESSONS {
        string firestoreId PK
        string id
        string name
        array words
        string ownerId FK
        string ownerDisplayName
        string language
        timestamp createdAt
    }

    GAME_RECORDS {
        string docId PK
        string userId FK
        string levelName
        number accuracy
        number elapsedTime
        number mistakes
        number totalWords
        timestamp timestamp
    }

    LESSON_RECORDS {
        string docId PK
        string userId FK
        string lessonId FK
        number levelIndex
        string displayName
        number accuracy
        number elapsedTime
        number wordCount
        timestamp createdAt
    }

    WEEKLY_XP {
        string docId PK
        string userId FK
        string lessonId FK
        number levelIndex
        number xp
        number accuracy
        number wordCount
        string weekKey
        timestamp createdAt
    }

    USER_FAVORITES {
        string docId PK
        string userId FK
        string lessonId FK
        string lessonName
        string ownerDisplayName
        timestamp addedAt
    }

    USERS ||--o{ LESSONS : "owns"
    USERS ||--o{ GAME_RECORDS : "has"
    USERS ||--o{ LESSON_RECORDS : "plays"
    USERS ||--o{ WEEKLY_XP : "earns"
    USERS ||--o{ USER_FAVORITES : "favorites"
    LESSONS ||--o{ LESSON_RECORDS : "tracked by"
    LESSONS ||--o{ WEEKLY_XP : "generates"
    LESSONS ||--o{ USER_FAVORITES : "referenced by"
```

### ゲームフロー状態遷移

```mermaid
stateDiagram-v2
    [*] --> ログイン
    ログイン --> メイン画面 : Google認証成功

    メイン画面 --> レッスン選択 : レッスンカード選択
    レッスン選択 --> モード選択 : レッスン確定

    モード選択 --> ゲーム中 : Lv1-5選択 → initGame
    モード選択 --> 単語学習中 : Lv0選択

    単語学習中 --> 単語学習中 : Enter/Space → 日英交互再生
    単語学習中 --> 学習完了 : 5回サイクル完了

    ゲーム中 --> 入力判定 : キー入力
    入力判定 --> ゲーム中 : 不正解 → ミスカウント
    入力判定 --> 単語完了 : 正解 → 全文字一致
    単語完了 --> ゲーム中 : 次の単語あり → nextWord
    単語完了 --> ゲーム完了 : 全単語終了

    ゲーム完了 --> 結果画面 : 記録保存・XP計算
    結果画面 --> ゲーム中 : Enter → リプレイ
    結果画面 --> モード選択 : Escape → 戻る

    学習完了 --> モード選択 : 戻る
```

### XP 計算フロー

```mermaid
flowchart LR
    A[ゲーム完了] --> B{accuracy<br/>== 100%?}
    B -->|Yes| C[perfectBonus = 1.5]
    B -->|No| D[perfectBonus = 1.0]
    C --> E["XP = floor(base x wordCount x bonus)"]
    D --> E

    subgraph XP基本値
        X0["Lv0: 1"]
        X1["Lv1: 5"]
        X2["Lv2: 3"]
        X3["Lv3: 4"]
        X4["Lv4: 4"]
        X5["Lv5: 5"]
    end

    E --> F[weeklyXPに保存]
    F --> G[週間ランキング集計]
```

## 技術スタック

- **TypeScript** (ES2020)
- **Vite** (ビルドツール)
- **Firebase** (Auth + Firestore + Hosting)
- **Web Audio API / Web Speech API**
