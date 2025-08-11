import { auth } from './firebase.ts';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';

export class AuthManager {
    constructor() {
        this.user = null;
        this.provider = new GoogleAuthProvider();
        this.initAuth();
    }

    initAuth() {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            this.updateAuthUI(user);
        });
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, this.provider);
            const user = result.user;
            console.log('User signed in:', user.displayName);
            return user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await auth.signOut();
            console.log('User signed out');
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    updateAuthUI(user) {
        const loginModal = document.getElementById('login-modal');
        const mainContainer = document.querySelector('.main-container');
        const userInfo = document.getElementById('user-info');

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

    getCurrentUser() {
        return this.user;
    }

    isAuthenticated() {
        return this.user !== null;
    }
}