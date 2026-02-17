import type { RankingEntry, LessonRankingEntry } from '../types';

/**
 * UIManager - UI操作とDOM要素管理クラス
 * DOM要素の操作、フィードバック表示、入力制御などを処理
 */
export class UIManager {
    // DOM elements
    public wordDisplay: HTMLElement | null;
    public meaningDisplay: HTMLElement | null;
    public wordInput: HTMLInputElement | null;
    public feedback: HTMLElement | null;
    public progressBar: HTMLElement | null;
    public scoreDisplay: HTMLElement | null;
    public timerDisplay: HTMLElement | null;
    public replayAudioBtn: HTMLElement | null;
    
    // State properties
    public isComposing: boolean = false;
    public pendingGameActive: boolean | undefined;
    
    constructor() {
        // DOM要素のキャッシュ
        this.wordDisplay = document.getElementById('word-display');
        this.meaningDisplay = document.getElementById('meaning');
        this.wordInput = document.getElementById('word-input') as HTMLInputElement;
        this.feedback = document.getElementById('feedback');
        this.progressBar = document.getElementById('progress-bar');
        this.scoreDisplay = document.getElementById('score-display');
        this.timerDisplay = document.getElementById('timer-display');
        this.replayAudioBtn = document.getElementById('replay-audio-btn');
    }
    
    // タイマー表示を更新
    updateTimerDisplay(timeMs: number): void {
        if (this.timerDisplay) {
            this.timerDisplay.textContent = this.formatTime(timeMs);
        }
    }
    
    // 時間をフォーマット
    formatTime(timeMs: number): string {
        const seconds = Math.floor(timeMs / 1000);
        const milliseconds = Math.floor((timeMs % 1000) / 10);
        return `${seconds}.${milliseconds.toString().padStart(2, '0')}秒`;
    }
    
    // プログレスバーを更新
    updateProgressBar(currentIndex: number, totalCount: number): void {
        const progress = (currentIndex / totalCount) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
    }
    
    
    // フィードバックを表示
    showFeedback(message: string, className: string = ''): void {
        if (this.feedback) {
            this.feedback.textContent = message;
            this.feedback.className = 'feedback ' + className;
        }
    }
    
    // 単語表示をクリア
    clearWordDisplay(): void {
        if (this.wordDisplay) {
            this.wordDisplay.innerHTML = '';
        }
    }
    
    // 意味表示を更新
    updateMeaningDisplay(meaning: string, visible: boolean = true): void {
        if (this.meaningDisplay) {
            this.meaningDisplay.textContent = meaning;
            this.meaningDisplay.style.display = visible ? 'block' : 'none';
        }
    }
    
    // 入力フィールドをリセット
    resetInput(): void {
        if (this.wordInput) {
            this.wordInput.value = '';
            this.wordInput.focus();
        }
    }

    // IMEを無効化してアルファベット入力を強制
    forceAlphabetInput(): void {
        if (!this.wordInput) return;
        // IME関連の属性を設定
        this.wordInput.setAttribute('inputmode', 'none');
        this.wordInput.setAttribute('lang', 'en');
        (this.wordInput.style as any).imeMode = 'disabled';
        
        // 既にイベントリスナーが設定されている場合はスキップ
        if (this.wordInput.hasAttribute('data-ime-disabled')) {
            return;
        }
        this.wordInput.setAttribute('data-ime-disabled', 'true');
        
        // フォーカス時にIMEを確実に無効化
        this.wordInput.addEventListener('focus', () => {
            if (this.wordInput) {
                (this.wordInput.style as any).imeMode = 'disabled';
            }
        });
        
        // 日本語入力制御用の状態管理
        this.isComposing = false;
        
        // 日本語入力開始時の制御
        this.wordInput.addEventListener('compositionstart', (e) => {
            this.isComposing = true;
            this.showInputModeWarning();
            // 入力チェックを一時停止（グローバル変数を直接制御）
            const originalGameActive = (window as any).gameActive;
            (window as any).gameActive = false;
            // compositionend後にゲーム状態を復元
            this.pendingGameActive = originalGameActive;
        });
        
        // 日本語入力終了時の制御
        this.wordInput.addEventListener('compositionend', (e) => {
            this.isComposing = false;
            // 日本語入力された内容を完全にクリア
            if (this.wordInput) {
                this.wordInput.value = '';
            }
            // ゲーム状態を復元
            if (this.pendingGameActive !== undefined) {
                (window as any).gameActive = this.pendingGameActive;
                this.pendingGameActive = undefined;
            }
            // 警告を継続表示
            this.showInputModeWarning();
        });
        
        // 全角文字の入力を即座に除去
        this.wordInput.addEventListener('input', (e) => {
            // 日本語入力中は処理しない（compositionendで処理）
            if (this.isComposing) {
                return;
            }
            
            const target = e.target as HTMLInputElement;
            const value = target.value;
            // 全角文字（ひらがな、カタカナ、漢字、全角英数字）を検出
            if (/[^\x00-\x7F]/.test(value)) {
                this.showInputModeWarning();
                // 全角文字を即座に削除
                target.value = value.replace(/[^\x00-\x7F]/g, '');
            }
        });
        
        // キーボードイベントでIME関連キーをブロック
        this.wordInput.addEventListener('keydown', (e) => {
            // 半角/全角キー、変換キーなどをブロック
            if (e.key === 'Convert' || e.key === 'NonConvert' || 
                e.key === 'Zenkaku' || e.key === 'Hankaku' ||
                e.key === 'KanaMode' || e.key === 'Alphanumeric') {
                e.preventDefault();
                this.showInputModeWarning();
            }
        });
    }
    
    // 入力モード警告を表示
    showInputModeWarning(): void {
        this.showFeedback('❌ 日本語モードが検出されました。半角英数字モードに切り替えてください', 'incorrect');
        
        // 音声フィードバック（ミスタイプ音を再生）
        const audioManager = (window as any).audioManager;
        if (audioManager) {
            audioManager.playMistypeSound();
        }
        
        // 入力フィールドの背景を一時的に赤くする
        if (this.wordInput) {
            this.wordInput.style.backgroundColor = '#ffebee';
            setTimeout(() => {
                if (this.wordInput) {
                    this.wordInput.style.backgroundColor = '';
                }
            }, 500);
        }
        
        setTimeout(() => {
            if (this.feedback && this.feedback.textContent && this.feedback.textContent.includes('日本語モード')) {
                this.feedback.textContent = '';
                this.feedback.className = 'feedback';
            }
        }, 4000); // 表示時間を延長
    }
    
    // 入力フィールドを無効化/有効化
    setInputEnabled(enabled: boolean): void {
        if (this.wordInput) {
            this.wordInput.disabled = !enabled;
            if (enabled) {
                this.wordInput.focus();
            }
        }
    }
    
    // スコア文字列を生成（共通メソッド）
    generateScoreText(elapsedTime: number, accuracyRate: number, mistakeCount: number): string {
        return `正確率: ${accuracyRate}% | ミス: ${mistakeCount}回 | クリアタイム: ${this.formatTime(elapsedTime)}`;
    }
    
    // スコア表示を更新
    updateScoreDisplay(elapsedTime: number, accuracyRate: number, mistakeCount: number): void {
        if (this.scoreDisplay) {
            this.scoreDisplay.innerHTML = `
                <div>${this.generateScoreText(elapsedTime, accuracyRate, mistakeCount)}</div>
            `;
            this.scoreDisplay.style.display = 'block';
        }
    }
    
    // スコア表示を隠す
    hideScoreDisplay(): void {
        if (this.scoreDisplay) {
            this.scoreDisplay.style.display = 'none';
        }
    }
    
    // ゲーム完了時の表示
    showGameComplete(isPerfect: boolean, mistakeCount: number, elapsedTime: number, accuracyRate: number, xp?: number): void {
        if (this.wordDisplay) {
            if (isPerfect) {
                this.wordDisplay.innerHTML = '<span style="color: #ffcc00; font-size: 1.2em;">パーフェクト！</span>';
                this.showFeedback('おめでとうございます！', 'correct');
            } else {
                this.wordDisplay.innerHTML = '<span style="color: #66bb6a; font-size: 1.2em;">クリア！</span>';
            }
        }

        if (this.meaningDisplay) {
            const xpText = xp !== undefined ? `<div style="margin-top: 8px; color: #ffa726; font-size: 1.1em; font-weight: bold;">+${xp} XP!</div>` : '';
            this.meaningDisplay.innerHTML = `
                <div>${this.generateScoreText(elapsedTime, accuracyRate, mistakeCount)}</div>
                ${xpText}
                <div style="margin-top: 10px; font-size: 0.8em; color: #90a4ae;">Enter: もう一度 | Escape: レッスン選択に戻る</div>
            `;
            // クリア時はmeaningDisplayを強制的に表示する
            this.meaningDisplay.style.display = 'block';
        }

        // XP獲得演出
        if (xp !== undefined) {
            this.showXPGain(xp);
        }
        
        if (this.wordInput) {
            this.wordInput.placeholder = "";
        }
        
        // スコア表示エリアは非表示にする
        if (this.scoreDisplay) {
            this.scoreDisplay.style.display = 'none';
        }
        
        // 発音ボタンを非表示にする
        if (this.replayAudioBtn) {
            this.replayAudioBtn.style.display = 'none';
        }
    }
    
    // タイトル画面の表示
    showTitle(): void {
        if (this.wordDisplay) {
            this.wordDisplay.innerHTML = '';
        }
        if (this.meaningDisplay) {
            this.meaningDisplay.textContent = '左のサイドバーからレッスンを選択してください';
        }
        if (this.timerDisplay) {
            this.timerDisplay.textContent = "00.00";
            this.timerDisplay.style.display = 'none';
        }
        if (this.replayAudioBtn) {
            this.replayAudioBtn.style.display = 'none';
        }
        if (this.wordInput) {
            this.wordInput.value = '';
            this.wordInput.placeholder = "";
        }
        if (this.feedback) {
            this.feedback.textContent = '';
            this.feedback.className = 'feedback';
        }
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
        if (this.scoreDisplay) {
            this.scoreDisplay.style.display = 'none';
        }
    }
    
    // エラー表示
    showError(message: string): void {
        if (this.wordDisplay) {
            this.wordDisplay.innerHTML = '<span>エラー</span>';
        }
        if (this.meaningDisplay) {
            this.meaningDisplay.textContent = message;
        }
    }
    
    // 画面要素の表示/非表示
    setElementVisibility(elementId: string, visible: boolean): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = visible ? 'block' : 'none';
        }
    }
    
    // 複数の画面要素の表示/非表示
    setMultipleElementsVisibility(elementSelectors: string[], visible: boolean): void {
        elementSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                element.style.display = visible ? (element.tagName === 'SPAN' || element.tagName === 'INPUT' ? 'inline-block' : 'block') : 'none';
            }
        });
    }

    // モーダルを表示
    showModal(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
            setTimeout(() => {
                element.classList.add('show');
            }, 10);
        }
    }

    // モーダルを非表示
    hideModal(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('show');
            setTimeout(() => {
                element.style.display = 'none';
            }, 400);
        }
    }

    // フォーカス管理のセットアップ
    setupFocusManagement(): void {
        // replay-audio-btn がフォーカスを奪わないようにする
        if (this.replayAudioBtn) {
            this.replayAudioBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
        }

        document.addEventListener('click', (e) => {
            if ((window as any).gameActive && this.wordInput && !this.wordInput.disabled) {
                const clickedElement = e.target as HTMLElement;
                const isInteractiveElement = clickedElement.tagName === 'BUTTON' ||
                                           clickedElement.tagName === 'INPUT' ||
                                           clickedElement.tagName === 'SELECT' ||
                                           clickedElement.classList.contains('level-selector') ||
                                           clickedElement.classList.contains('clear-records-btn');
                if (!isInteractiveElement) {
                    this.wordInput.focus();
                }
            }
        });

        window.addEventListener('focus', () => {
            if ((window as any).gameActive && this.wordInput && !this.wordInput.disabled) {
                this.wordInput.focus();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && (window as any).gameActive && this.wordInput && !this.wordInput.disabled) {
                setTimeout(() => {
                    if (this.wordInput) {
                        this.wordInput.focus();
                    }
                }, 100);
            }
        });
    }

    // 新記録メッセージを表示
    showNewRecordMessage(): void {
        const newRecordMsg = document.createElement('div');
        newRecordMsg.className = 'new-record-message';
        newRecordMsg.textContent = '新記録達成！';

        document.body.appendChild(newRecordMsg);

        setTimeout(() => {
            newRecordMsg.style.opacity = '1';
            newRecordMsg.style.transform = 'translateY(0) scale(1)';

            setTimeout(() => {
                newRecordMsg.style.opacity = '0';
                newRecordMsg.style.transform = 'translateY(-50px) scale(0.8)';

                setTimeout(() => {
                    newRecordMsg.remove();
                }, 500);
            }, 2000);
        }, 100);
    }

    // XP獲得演出
    showXPGain(xp: number): void {
        const xpMsg = document.createElement('div');
        xpMsg.className = 'xp-gain-message';
        xpMsg.textContent = `+${xp} XP!`;

        document.body.appendChild(xpMsg);

        setTimeout(() => {
            xpMsg.style.opacity = '1';
            xpMsg.style.transform = 'translateX(-50%) translateY(0) scale(1)';

            setTimeout(() => {
                xpMsg.style.opacity = '0';
                xpMsg.style.transform = 'translateX(-50%) translateY(-60px) scale(0.8)';

                setTimeout(() => {
                    xpMsg.remove();
                }, 500);
            }, 2500);
        }, 100);
    }

    // コンボ表示（2コンボ以上で表示）
    showCombo(comboCount: number): void {
        // 既存のコンボメッセージを削除
        document.querySelectorAll('.combo-message').forEach(el => el.remove());

        const comboMsg = document.createElement('div');
        comboMsg.className = 'combo-message';
        if (comboCount >= 10) {
            comboMsg.classList.add('combo-legendary');
        } else if (comboCount >= 5) {
            comboMsg.classList.add('combo-great');
        }
        comboMsg.textContent = `${comboCount} COMBO!`;

        const typingArea = document.querySelector('.typing-area');
        if (typingArea) {
            typingArea.appendChild(comboMsg);
        }

        setTimeout(() => {
            comboMsg.style.opacity = '0';
            setTimeout(() => comboMsg.remove(), 300);
        }, 800);
    }

    // 画面パルスエフェクト（コンボマイルストーン時）
    showScreenPulse(comboCount: number): void {
        const typingArea = document.querySelector('.typing-area');
        if (!typingArea) return;

        const pulseClass = comboCount >= 10 ? 'screen-pulse-strong' : 'screen-pulse';
        typingArea.classList.add(pulseClass);

        setTimeout(() => {
            typingArea.classList.remove(pulseClass);
        }, 600);
    }

    // ランダム称賛メッセージ
    private static readonly PRAISE_MESSAGES = [
        'すごい！', 'やったね！', 'かっこいい！', 'がんばったね！', 'さいこう！',
        'ナイス！', 'いいかんじ！', 'バッチリ！', 'グッジョブ！', 'えらい！'
    ];
    private static readonly PERFECT_PRAISE_MESSAGES = [
        'てんさい！', 'かんぺき！', 'ミスなしすごい！', 'スーパースター！',
        'チャンピオン！', 'むてき！', 'マスター！', '100てん！'
    ];

    showPraiseMessage(isPerfect: boolean): void {
        const messages = isPerfect ? UIManager.PERFECT_PRAISE_MESSAGES : UIManager.PRAISE_MESSAGES;
        const message = messages[Math.floor(Math.random() * messages.length)];

        const praiseMsg = document.createElement('div');
        praiseMsg.className = 'praise-message';
        if (isPerfect) {
            praiseMsg.classList.add('praise-perfect');
        }
        praiseMsg.textContent = message;

        document.body.appendChild(praiseMsg);

        setTimeout(() => {
            praiseMsg.style.opacity = '1';
            praiseMsg.style.transform = 'translateX(-50%) translateY(0) scale(1)';

            setTimeout(() => {
                praiseMsg.style.opacity = '0';
                praiseMsg.style.transform = 'translateX(-50%) translateY(-40px) scale(0.8)';

                setTimeout(() => praiseMsg.remove(), 500);
            }, 2500);
        }, 100);
    }

    // 紙吹雪エフェクト（パーフェクト限定）
    showConfetti(): void {
        const container = document.createElement('div');
        container.className = 'confetti-container';

        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4'];
        const particleCount = 40;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti-particle';

            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const delay = Math.random() * 1.5;
            const duration = 2 + Math.random() * 2;
            const rotation = Math.random() * 360;
            const size = 6 + Math.random() * 6;

            particle.style.backgroundColor = color;
            particle.style.left = `${left}%`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size * 2.5}px`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.transform = `rotate(${rotation}deg)`;

            container.appendChild(particle);
        }

        document.body.appendChild(container);

        setTimeout(() => container.remove(), 4000);
    }

    // リーダーボード更新
    updateLeaderboard(rankings: RankingEntry[], currentUserId: string): void {
        const listEl = document.getElementById('leaderboard-list');
        const messageEl = document.getElementById('leaderboard-message');
        if (!listEl || !messageEl) return;

        listEl.innerHTML = '';
        messageEl.innerHTML = '';

        if (rankings.length === 0) {
            listEl.innerHTML = '<div class="leaderboard-empty">まだ記録がありません</div>';
            return;
        }

        // 上位5名を表示
        const top5 = rankings.slice(0, 5);
        let currentUserRank = -1;

        top5.forEach((entry, index) => {
            const rank = index + 1;
            const row = document.createElement('div');
            const isCurrentUser = entry.userId === currentUserId;
            row.className = `leaderboard-row${isCurrentUser ? ' leaderboard-row-me' : ''}`;

            const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

            row.innerHTML = `
                <span class="leaderboard-rank">${medalEmoji}</span>
                <span class="leaderboard-name">${entry.displayName}${isCurrentUser ? ' ←' : ''}</span>
                <span class="leaderboard-xp">${entry.totalXP} XP</span>
            `;
            listEl.appendChild(row);

            if (isCurrentUser) {
                currentUserRank = rank;
            }
        });

        // 自分が5位以内にいない場合、ランキング内の位置を探す
        if (currentUserRank === -1) {
            const fullRankIndex = rankings.findIndex(e => e.userId === currentUserId);
            if (fullRankIndex >= 0) {
                currentUserRank = fullRankIndex + 1;
                const entry = rankings[fullRankIndex];
                const row = document.createElement('div');
                row.className = 'leaderboard-row leaderboard-row-me';
                row.innerHTML = `
                    <span class="leaderboard-rank">${currentUserRank}.</span>
                    <span class="leaderboard-name">${entry.displayName} ←</span>
                    <span class="leaderboard-xp">${entry.totalXP} XP</span>
                `;

                // 区切り線を追加
                const separator = document.createElement('div');
                separator.className = 'leaderboard-separator';
                separator.textContent = '···';
                listEl.appendChild(separator);
                listEl.appendChild(row);
            }
        }

        // 「あとXXPでY位！」メッセージ
        if (currentUserRank > 1) {
            const myIndex = rankings.findIndex(e => e.userId === currentUserId);
            if (myIndex > 0) {
                const aboveEntry = rankings[myIndex - 1];
                const myEntry = rankings[myIndex];
                const diff = aboveEntry.totalXP - myEntry.totalXP;
                if (diff > 0) {
                    messageEl.textContent = `あと ${diff} XP で ${myIndex}位！`;
                }
            }
        } else if (currentUserRank === 1) {
            messageEl.textContent = '🎉 1位をキープ中！';
        }
    }

    // レッスン別ランキング更新
    updateLessonRanking(rankings: LessonRankingEntry[], currentUserId: string, containerElement: HTMLElement): void {
        if (!containerElement) return;

        containerElement.innerHTML = '';

        if (rankings.length === 0) {
            containerElement.innerHTML = '<div class="lesson-ranking-empty">まだ記録がありません</div>';
            return;
        }

        // 上位5名を表示
        const top5 = rankings.slice(0, 5);
        let currentUserRank = -1;

        top5.forEach((entry, index) => {
            const rank = index + 1;
            const row = document.createElement('div');
            const isCurrentUser = entry.userId === currentUserId;
            row.className = `lesson-ranking-row${isCurrentUser ? ' lesson-ranking-row-me' : ''}`;

            const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

            row.innerHTML = `
                <span class="lesson-ranking-rank">${medalEmoji}</span>
                <span class="lesson-ranking-name">${entry.displayName}${isCurrentUser ? ' ←' : ''}</span>
                <span class="lesson-ranking-score">${entry.accuracy}% / ${this.formatTime(entry.elapsedTime)}</span>
            `;
            containerElement.appendChild(row);

            if (isCurrentUser) {
                currentUserRank = rank;
            }
        });

        // 自分が5位以内にいない場合、ランキング内の位置を探す
        if (currentUserRank === -1) {
            const fullRankIndex = rankings.findIndex(e => e.userId === currentUserId);
            if (fullRankIndex >= 0) {
                currentUserRank = fullRankIndex + 1;
                const entry = rankings[fullRankIndex];
                const row = document.createElement('div');
                row.className = 'lesson-ranking-row lesson-ranking-row-me';
                row.innerHTML = `
                    <span class="lesson-ranking-rank">${currentUserRank}.</span>
                    <span class="lesson-ranking-name">${entry.displayName} ←</span>
                    <span class="lesson-ranking-score">${entry.accuracy}% / ${this.formatTime(entry.elapsedTime)}</span>
                `;

                // 区切り線を追加
                const separator = document.createElement('div');
                separator.className = 'leaderboard-separator';
                separator.textContent = '···';
                containerElement.appendChild(separator);
                containerElement.appendChild(row);
            }
        }
    }
}