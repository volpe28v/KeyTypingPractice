
// word-lists.js - タイピングゲーム用の単語リスト

// レベルごとの単語リスト
const levelLists = [
    {
        level: 1,
        description: "人差し指のみ",
        words: [
        { word: "run", meaning: "走る" },
        { word: "fun", meaning: "楽しい" },
        { word: "gun", meaning: "銃" },
        { word: "bun", meaning: "パン" },
        { word: "nun", meaning: "尼僧" },
        { word: "hum", meaning: "ハミング" },
        { word: "mum", meaning: "お母さん" },
        { word: "rum", meaning: "ラム酒" },
        { word: "gym", meaning: "ジム" },
        { word: "rub", meaning: "こする" },
        { word: "tub", meaning: "浴槽" },
        { word: "hub", meaning: "中心" },
        { word: "nub", meaning: "小さな塊" },
        { word: "jug", meaning: "水差し" },
        { word: "bug", meaning: "虫" },
        { word: "rug", meaning: "敷物" },
        { word: "mug", meaning: "マグカップ" },
        { word: "hug", meaning: "抱擁" },
        { word: "tug", meaning: "引っ張る" },
        { word: "nut", meaning: "ナッツ" }
        ]
    },
    {
        level: 2,
        description: "人差し指と中指",
        words: [
        { word: "red", meaning: "赤" },
        { word: "bed", meaning: "ベッド" },
        { word: "fed", meaning: "養った" },
        { word: "ted", meaning: "テッド" },
        { word: "vet", meaning: "獣医" },
        { word: "bet", meaning: "賭け" },
        { word: "get", meaning: "得る" },
        { word: "set", meaning: "セット" },
        { word: "wet", meaning: "濡れた" },
        { word: "net", meaning: "網" },
        { word: "met", meaning: "会った" },
        { word: "let", meaning: "させる" },
        { word: "jet", meaning: "ジェット機" },
        { word: "yet", meaning: "まだ" },
        { word: "bee", meaning: "蜂" },
        { word: "see", meaning: "見る" },
        { word: "fee", meaning: "料金" },
        { word: "tee", meaning: "Tシャツ" },
        { word: "vex", meaning: "悩ます" },
        { word: "rex", meaning: "レックス" }
        ]
    },
    {
        level: 3,
        description: "人差し指、中指、薬指",
        words: [
        { word: "was", meaning: "だった" },
        { word: "saw", meaning: "見た" },
        { word: "war", meaning: "戦争" },
        { word: "raw", meaning: "生の" },
        { word: "wed", meaning: "結婚した" },
        { word: "dew", meaning: "露" },
        { word: "few", meaning: "少数" },
        { word: "wax", meaning: "ワックス" },
        { word: "tax", meaning: "税金" },
        { word: "sea", meaning: "海" },
        { word: "ace", meaning: "エース" },
        { word: "sad", meaning: "悲しい" },
        { word: "dad", meaning: "お父さん" },
        { word: "fad", meaning: "一時的な流行" },
        { word: "wad", meaning: "束" },
        { word: "ear", meaning: "耳" },
        { word: "era", meaning: "時代" },
        { word: "are", meaning: "〜です" },
        { word: "far", meaning: "遠い" },
        { word: "war", meaning: "戦争" }
        ]
    },
    {
        level: 4,
        description: "全ての指",
        words: [
        { word: "apple", meaning: "りんご" },
        { word: "banana", meaning: "バナナ" },
        { word: "cherry", meaning: "さくらんぼ" },
        { word: "orange", meaning: "オレンジ" },
        { word: "grape", meaning: "ぶどう" },
        { word: "melon", meaning: "メロン" },
        { word: "peach", meaning: "桃" },
        { word: "lemon", meaning: "レモン" },
        { word: "kiwi", meaning: "キウイ" },
        { word: "mango", meaning: "マンゴー" },
        { word: "pear", meaning: "洋ナシ" },
        { word: "plum", meaning: "プラム" },
        { word: "fig", meaning: "イチジク" },
        { word: "date", meaning: "デーツ" },
        { word: "lime", meaning: "ライム" },
        { word: "coconut", meaning: "ココナッツ" },
        { word: "papaya", meaning: "パパイヤ" },
        { word: "guava", meaning: "グアバ" },
        { word: "pineapple", meaning: "パイナップル" },
        { word: "strawberry", meaning: "いちご" }
        ]
    },
    {
        level: 5,
        description: "頻出単語100個",
        words: [
        { word: "time", meaning: "時間" },
        { word: "year", meaning: "年" },
        { word: "people", meaning: "人々" },
        { word: "way", meaning: "方法" },
        { word: "day", meaning: "日" },
        { word: "man", meaning: "男性" },
        { word: "thing", meaning: "物" },
        { word: "woman", meaning: "女性" },
        { word: "life", meaning: "人生" },
        { word: "child", meaning: "子供" },
        { word: "world", meaning: "世界" },
        { word: "school", meaning: "学校" },
        { word: "state", meaning: "状態" },
        { word: "family", meaning: "家族" },
        { word: "student", meaning: "学生" },
        { word: "group", meaning: "グループ" },
        { word: "country", meaning: "国" },
        { word: "problem", meaning: "問題" },
        { word: "hand", meaning: "手" },
        { word: "part", meaning: "部分" },
        { word: "place", meaning: "場所" },
        { word: "case", meaning: "場合" },
        { word: "week", meaning: "週" },
        { word: "company", meaning: "会社" },
        { word: "system", meaning: "システム" },
        { word: "program", meaning: "プログラム" },
        { word: "question", meaning: "質問" },
        { word: "work", meaning: "仕事" },
        { word: "government", meaning: "政府" },
        { word: "number", meaning: "数" },
        { word: "night", meaning: "夜" },
        { word: "point", meaning: "点" },
        { word: "home", meaning: "家" },
        { word: "water", meaning: "水" },
        { word: "room", meaning: "部屋" },
        { word: "mother", meaning: "母" },
        { word: "area", meaning: "地域" },
        { word: "money", meaning: "お金" },
        { word: "story", meaning: "物語" },
        { word: "fact", meaning: "事実" },
        { word: "month", meaning: "月" },
        { word: "lot", meaning: "多く" },
        { word: "right", meaning: "右" },
        { word: "study", meaning: "勉強" },
        { word: "book", meaning: "本" },
        { word: "eye", meaning: "目" },
        { word: "job", meaning: "仕事" },
        { word: "word", meaning: "単語" },
        { word: "business", meaning: "ビジネス" },
        { word: "issue", meaning: "問題" },
        { word: "side", meaning: "側" },
        { word: "kind", meaning: "種類" },
        { word: "head", meaning: "頭" },
        { word: "house", meaning: "家" },
        { word: "service", meaning: "サービス" },
        { word: "friend", meaning: "友達" },
        { word: "father", meaning: "父" },
        { word: "power", meaning: "力" },
        { word: "hour", meaning: "時間" },
        { word: "game", meaning: "ゲーム" },
        { word: "line", meaning: "線" },
        { word: "end", meaning: "終わり" },
        { word: "member", meaning: "メンバー" },
        { word: "law", meaning: "法律" },
        { word: "car", meaning: "車" },
        { word: "city", meaning: "都市" },
        { word: "name", meaning: "名前" },
        { word: "team", meaning: "チーム" },
        { word: "minute", meaning: "分" },
        { word: "idea", meaning: "アイデア" },
        { word: "kid", meaning: "子供" },
        { word: "body", meaning: "体" },
        { word: "back", meaning: "背中" },
        { word: "parent", meaning: "親" },
        { word: "face", meaning: "顔" },
        { word: "others", meaning: "他の人々" },
        { word: "level", meaning: "レベル" },
        { word: "office", meaning: "オフィス" },
        { word: "door", meaning: "ドア" },
        { word: "health", meaning: "健康" },
        { word: "person", meaning: "人" },
        { word: "art", meaning: "芸術" },
        { word: "war", meaning: "戦争" },
        { word: "history", meaning: "歴史" },
        { word: "party", meaning: "パーティー" },
        { word: "result", meaning: "結果" },
        { word: "change", meaning: "変化" },
        { word: "morning", meaning: "朝" },
        { word: "reason", meaning: "理由" },
        { word: "research", meaning: "研究" },
        { word: "girl", meaning: "女の子" },
        { word: "guy", meaning: "男性" },
        { word: "moment", meaning: "瞬間" },
        { word: "air", meaning: "空気" },
        { word: "teacher", meaning: "教師" },
        { word: "force", meaning: "力" },
        { word: "education", meaning: "教育" }
        ]
    },
    {
        level: 6,
        description: "短い文章100個",
        words: [
        { word: "How are you today?", meaning: "今日の調子はどうですか？" },
        { word: "Nice to meet you.", meaning: "はじめまして。" },
        { word: "What time is it now?", meaning: "今何時ですか？" },
        { word: "I need to go home.", meaning: "家に帰る必要があります。" },
        { word: "Can you help me?", meaning: "手伝ってもらえますか？" },
        { word: "Where is the bathroom?", meaning: "お手洗いはどこですか？" },
        { word: "I don't understand.", meaning: "理解できません。" },
        { word: "Please speak slowly.", meaning: "ゆっくり話してください。" },
        { word: "Thank you very much.", meaning: "どうもありがとうございます。" },
        { word: "You're welcome.", meaning: "どういたしまして。" },
        { word: "I'm sorry I'm late.", meaning: "遅れてすみません。" },
        { word: "What's your name?", meaning: "お名前は何ですか？" },
        { word: "My name is John.", meaning: "私の名前はジョンです。" },
        { word: "How much is this?", meaning: "これはいくらですか？" },
        { word: "I'll take this one.", meaning: "これをください。" },
        { word: "Do you speak English?", meaning: "英語を話せますか？" },
        { word: "I speak a little Japanese.", meaning: "日本語を少し話します。" },
        { word: "I'm from the United States.", meaning: "アメリカ出身です。" },
        { word: "Where are you from?", meaning: "どちらの出身ですか？" },
        { word: "I like Japanese food.", meaning: "日本食が好きです。" },
        { word: "What do you do?", meaning: "お仕事は何ですか？" },
        { word: "I'm a student.", meaning: "学生です。" },
        { word: "I'm a teacher.", meaning: "教師です。" },
        { word: "I work at a company.", meaning: "会社で働いています。" },
        { word: "How was your weekend?", meaning: "週末はどうでしたか？" },
        { word: "I had a great time.", meaning: "とても楽しかったです。" },
        { word: "What's the weather like?", meaning: "天気はどうですか？" },
        { word: "It's raining today.", meaning: "今日は雨です。" },
        { word: "It's very hot today.", meaning: "今日はとても暑いです。" },
        { word: "I'm feeling sick.", meaning: "体調が悪いです。" },
        { word: "I need to see a doctor.", meaning: "医者に診てもらう必要があります。" },
        { word: "Could you repeat that?", meaning: "もう一度言っていただけますか？" },
        { word: "I don't know how to say it.", meaning: "言い方がわかりません。" },
        { word: "What does this mean?", meaning: "これはどういう意味ですか？" },
        { word: "How do you say this in English?", meaning: "これは英語で何と言いますか？" },
        { word: "I'm looking for the station.", meaning: "駅を探しています。" },
        { word: "Which way should I go?", meaning: "どちらの方向に行けばいいですか？" },
        { word: "Turn right at the corner.", meaning: "角を右に曲がってください。" },
        { word: "It's about ten minutes walk.", meaning: "歩いて約10分です。" },
        { word: "I'd like to make a reservation.", meaning: "予約をしたいです。" },
        { word: "Do you have any vacancies?", meaning: "空室はありますか？" },
        { word: "I'd like a table for two.", meaning: "2人用のテーブルをお願いします。" },
        { word: "What would you recommend?", meaning: "おすすめは何ですか？" },
        { word: "The food was delicious.", meaning: "料理はおいしかったです。" },
        { word: "Could I have the bill, please?", meaning: "お会計をお願いします。" },
        { word: "I'd like to pay by credit card.", meaning: "クレジットカードで支払いたいです。" },
        { word: "Do you have Wi-Fi here?", meaning: "ここにWi-Fiはありますか？" },
        { word: "What's the password?", meaning: "パスワードは何ですか？" },
        { word: "I need to charge my phone.", meaning: "携帯を充電する必要があります。" },
        { word: "Can I use your phone?", meaning: "あなたの電話を使ってもいいですか？" },
        { word: "I lost my wallet.", meaning: "財布をなくしました。" },
        { word: "I need to go to the police station.", meaning: "警察署に行く必要があります。" },
        { word: "Could you take a photo for me?", meaning: "写真を撮ってもらえますか？" },
        { word: "What time does the store open?", meaning: "お店は何時に開きますか？" },
        { word: "What time does it close?", meaning: "何時に閉まりますか？" },
        { word: "Is there a convenience store nearby?", meaning: "近くにコンビニはありますか？" },
        { word: "I'm just looking, thanks.", meaning: "見ているだけです、ありがとう。" },
        { word: "Do you have this in another color?", meaning: "これは他の色がありますか？" },
        { word: "What size do you wear?", meaning: "何サイズを着ますか？" },
        { word: "It's too expensive for me.", meaning: "私には高すぎます。" },
        { word: "Can I try this on?", meaning: "これを試着してもいいですか？" },
        { word: "I'll think about it.", meaning: "考えておきます。" },
        { word: "I need to buy some souvenirs.", meaning: "お土産を買う必要があります。" },
        { word: "Do you have anything cheaper?", meaning: "もっと安いものはありますか？" },
        { word: "I'm looking for a gift.", meaning: "贈り物を探しています。" },
        { word: "What time is the next train?", meaning: "次の電車は何時ですか？" },
        { word: "Which platform does it leave from?", meaning: "どのプラットフォームから出発しますか？" },
        { word: "I'd like a one-way ticket.", meaning: "片道切符をお願いします。" },
        { word: "I'd like a round-trip ticket.", meaning: "往復切符をお願いします。" },
        { word: "How long does it take?", meaning: "どのくらい時間がかかりますか？" },
        { word: "Is this seat taken?", meaning: "この席は空いていますか？" },
        { word: "Could you wake me up at 7?", meaning: "7時に起こしてもらえますか？" },
        { word: "I'd like to check out, please.", meaning: "チェックアウトをお願いします。" },
        { word: "Could you call a taxi for me?", meaning: "タクシーを呼んでもらえますか？" },
        { word: "I'm allergic to peanuts.", meaning: "ピーナッツアレルギーがあります。" },
        { word: "I'm a vegetarian.", meaning: "ベジタリアンです。" },
        { word: "I don't eat pork.", meaning: "豚肉は食べません。" },
        { word: "It's an emergency.", meaning: "緊急事態です。" },
        { word: "I need help right now.", meaning: "今すぐ助けが必要です。" },
        { word: "Call an ambulance, please.", meaning: "救急車を呼んでください。" },
        { word: "I have a headache.", meaning: "頭痛がします。" },
        { word: "I have a fever.", meaning: "熱があります。" },
        { word: "I need some medicine.", meaning: "薬が必要です。" },
        { word: "How long will it take to get there?", meaning: "そこに着くまでどのくらいかかりますか？" },
        { word: "Is it far from here?", meaning: "ここから遠いですか？" },
        { word: "Can I get a discount?", meaning: "割引してもらえますか？" },
        { word: "Do you accept credit cards?", meaning: "クレジットカードは使えますか？" },
        { word: "I'd like to exchange money.", meaning: "お金を両替したいです。" },
        { word: "What's the exchange rate?", meaning: "為替レートはいくらですか？" },
        { word: "I'm having a great time here.", meaning: "ここでとても楽しんでいます。" },
        { word: "The view is beautiful.", meaning: "景色が美しいです。" },
        { word: "I'd like to visit again.", meaning: "また訪れたいです。" },
        { word: "It was nice talking to you.", meaning: "お話できて良かったです。" },
        { word: "See you tomorrow.", meaning: "また明日。" },
        { word: "Have a nice day!", meaning: "良い一日を！" },
        { word: "Take care of yourself.", meaning: "お体に気をつけて。" },
        { word: "I hope to see you again soon.", meaning: "またすぐにお会いできることを願っています。" }
        ]
    },
    {
        level: 7,
        description: "数字",
        words: [
        { word: "one", meaning: "1" },
        { word: "two", meaning: "2" },
        { word: "three", meaning: "3" },
        { word: "four", meaning: "4" },
        { word: "five", meaning: "5" },
        { word: "six", meaning: "6" },
        { word: "seven", meaning: "7" },
        { word: "eight", meaning: "8" },
        { word: "nine", meaning: "9" },
        { word: "ten", meaning: "10" },
        { word: "eleven", meaning: "11" },
        { word: "twelve", meaning: "12" },
        { word: "thirteen", meaning: "13" },
        { word: "fourteen", meaning: "14" },
        { word: "fifteen", meaning: "15" },
        { word: "sixteen", meaning: "16" },
        { word: "seventeen", meaning: "17" },
        { word: "eighteen", meaning: "18" },
        { word: "nineteen", meaning: "19" },    
        { word: "twenty", meaning: "20" },
        { word: "twenty-one", meaning: "21" },  
        { word: "twenty-two", meaning: "22" },
        { word: "twenty-three", meaning: "23" },
        { word: "twenty-four", meaning: "24" },
        { word: "twenty-five", meaning: "25" },
        { word: "twenty-six", meaning: "26" },
        { word: "twenty-seven", meaning: "27" },
        { word: "twenty-eight", meaning: "28" },
        { word: "twenty-nine", meaning: "29" },
        { word: "thirty", meaning: "30" },
        { word: "forty", meaning: "40" },
        { word: "fifty", meaning: "50" },
        { word: "sixty", meaning: "60" },
        { word: "seventy", meaning: "70" }, 
        { word: "eighty", meaning: "80" },
        { word: "ninety", meaning: "90" },
        { word: "one hundred", meaning: "100" },
        { word: "one thousand", meaning: "1000" },
        { word: "one million", meaning: "1000000" },
        { word: "one billion", meaning: "1000000000" },
        { word: "one trillion", meaning: "1000000000000" },
        ]
    },
    {
        level: 8,
        description: "マイクラ",
        words: [
        { word: "Let's go mining!", meaning: "採掘に行こう！" },
        { word: "Watch out for creepers!", meaning: "クリーパーに気をつけて！" },
        { word: "I found diamonds!", meaning: "ダイヤモンドを見つけた！" },
        { word: "Need more wood.", meaning: "木材が必要です。" },
        { word: "Building a house here.", meaning: "ここに家を建てています。" },
        { word: "Got any spare iron?", meaning: "余分な鉄ありますか？" },
        { word: "Meet at spawn point.", meaning: "スポーン地点で会いましょう。" },
        { word: "The sun is setting.", meaning: "日が沈んでいます。" },
        { word: "Time to sleep!", meaning: "寝る時間です！" },
        { word: "Found a village!", meaning: "村を見つけた！" },
        { word: "Need food badly.", meaning: "食料が切実に必要です。" },
        { word: "Help me fight zombies!", meaning: "ゾンビと戦うの手伝って！" },
        { word: "Going to the Nether.", meaning: "ネザーに行きます。" },
        { word: "Bring obsidian.", meaning: "黒曜石を持ってきて。" },
        { word: "Nice base design!", meaning: "いい拠点デザインですね！" },
        { word: "Protect the villagers!", meaning: "村人を守って！" },
        { word: "Need more torches.", meaning: "松明が必要です。" },
        { word: "Found ancient ruins!", meaning: "古代遺跡を見つけた！" },
        { word: "Let's build a farm.", meaning: "農場を作りましょう。" },
        { word: "Dragon fight ready?", meaning: "ドラゴン戦の準備できた？" }
        ]
    }

];