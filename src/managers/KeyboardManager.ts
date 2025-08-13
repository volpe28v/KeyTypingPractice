/**
 * KeyboardManager - キーボード表示と操作管理クラス
 * バーチャルキーボードの表示、ハイライト、アニメーション効果を処理
 */
export class KeyboardManager {
    private keyboardDisplay: HTMLElement | null;
    private highlightedKeys: HTMLElement[];

    constructor() {
        this.keyboardDisplay = document.querySelector('.keyboard-display');
        this.highlightedKeys = [];
    }
    
    // キーボードアニメーションを初期化
    initAnimation(): void {
        const keys = document.querySelectorAll('.key');
        
        keys.forEach(key => {
            if (key instanceof HTMLElement) {
                key.style.opacity = '0';
                key.style.transform = 'translateY(20px)';
            }
        });
        
        keys.forEach((key, index) => {
            setTimeout(() => {
                if (key instanceof HTMLElement) {
                    key.style.opacity = '1';
                    key.style.transform = 'translateY(0)';
                    key.style.transition = 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.2)';
                }
            }, index * 20);
        });
    }
    
    // 次のキーをハイライト
    highlightNextKey(): void {
        // 前回のハイライトをクリアするだけで、新しいハイライトは行わない（スペル学習のため）
        this.clearHighlights();
    }
    
    // ハイライトをクリア
    clearHighlights(): void {
        const highlightedKeys = document.querySelectorAll('.key.highlight');
        highlightedKeys.forEach(key => {
            key.classList.remove('highlight');
            
            // シフト文字のスタイルをリセット
            const shiftChar = key.querySelector('.shift-char');
            if (shiftChar instanceof HTMLElement) {
                shiftChar.style.color = '#ff00ff';
                shiftChar.style.textShadow = 'none';
            }
        });
    }
    
    // キーを押した時のエフェクト
    showKeyPress(key: string, isCorrect: boolean = true): void {
        const keyElement = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
        if (!keyElement) return;
        
        const className = isCorrect ? 'correct' : 'incorrect';
        keyElement.classList.remove(className);
        void (keyElement as HTMLElement).offsetWidth; // リフローを強制
        
        keyElement.classList.add(className);
        
        this.createRippleEffect(keyElement, !isCorrect);
        
        setTimeout(() => {
            keyElement.classList.remove(className);
        }, 1000);
    }
    
    // キーボードリップルエフェクト
    createRippleEffect(keyElement: Element, isError: boolean = false): void {
        if (!this.keyboardDisplay) return;
        
        // 既存のリップルを削除
        const existingRipples = document.querySelectorAll('.keyboard-ripple');
        existingRipples.forEach(ripple => ripple.remove());
        
        const ripple = document.createElement('div');
        ripple.className = 'keyboard-ripple';
        
        const keyRect = keyElement.getBoundingClientRect();
        const keyboardRect = this.keyboardDisplay.getBoundingClientRect();
        
        const keyX = keyRect.left + keyRect.width / 2 - keyboardRect.left;
        const keyY = keyRect.top + keyRect.height / 2 - keyboardRect.top;
        
        ripple.style.background = isError 
            ? `radial-gradient(circle at ${keyX}px ${keyY}px, transparent 0%, transparent 70%, rgba(255, 0, 0, 0.5) 100%)`
            : `radial-gradient(circle at ${keyX}px ${keyY}px, transparent 0%, transparent 70%, rgba(0, 255, 0, 0.5) 100%)`;
        
        this.keyboardDisplay.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.opacity = '0.7';
            ripple.style.transform = 'scale(3)';
            ripple.style.transition = 'all 1s cubic-bezier(0, 0.5, 0.5, 1)';
            
            setTimeout(() => {
                ripple.style.opacity = '0';
                setTimeout(() => {
                    ripple.remove();
                }, 300);
            }, 700);
        }, 10);
    }
}