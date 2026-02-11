import { auth } from './firebase.ts';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, UserCredential } from 'firebase/auth';

export class AuthManager {
    public user: User | null;
    public provider: GoogleAuthProvider;
    public auth: typeof auth;

    constructor() {
        this.user = null;
        this.provider = new GoogleAuthProvider();
        this.auth = auth; // auth オブジェクトを公開
        this.initAuth();
    }

    initAuth(): void {
        onAuthStateChanged(auth, (user: User | null) => {
            this.user = user;
            this.updateAuthUI(user);
        });
    }

    async signInWithGoogle(): Promise<User> {
        try {
            const result: UserCredential = await signInWithPopup(auth, this.provider);
            const user: User = result.user;

            return user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signOut(): Promise<void> {
        try {
            await auth.signOut();

        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    updateAuthUI(user: User | null): void {
        const loginModal = document.getElementById('login-modal') as HTMLElement | null;
        const mainContainer = document.querySelector('.main-container') as HTMLElement | null;
        const userInfo = document.getElementById('user-info') as HTMLElement | null;

        if (user) {
            // ログイン済み：メイン画面を表示
            if (loginModal) loginModal.classList.add('hidden');
            if (mainContainer) mainContainer.style.display = 'flex';
            
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-profile">
                        <img src="${user.photoURL}" alt="Profile" class="user-avatar">
                        <span>${user.displayName}</span>
                        <button onclick="window.authManager.signOut()" class="sign-out-btn">ログアウト</button>
                    </div>
                `;
            }
        } else {
            // 未ログイン：ログインモーダルを表示
            if (loginModal) loginModal.classList.remove('hidden');
            if (mainContainer) mainContainer.style.display = 'none';
            
            if (userInfo) {
                userInfo.innerHTML = '';
            }
        }
    }

    getCurrentUser(): User | null {
        return this.user;
    }

    isAuthenticated(): boolean {
        return this.user !== null;
    }
}