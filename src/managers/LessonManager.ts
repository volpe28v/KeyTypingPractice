import type { WordData, LessonData } from '../types';
import type { StorageManager } from './StorageManager';

/**
 * LessonManager - レッスン管理クラス
 * カスタムレッスンの作成、編集、削除を処理
 */
export class LessonManager {
    private storageManager: StorageManager;

    constructor(storageManager: StorageManager) {
        this.storageManager = storageManager;
    }

    // 入力された単語を解析
    parseCustomWords(input: string): WordData[] {
        const lines = input.trim().split('\n');
        const words = [];
        
        for (let line of lines) {
            line = line.trim();
            if (line === '') continue;
            
            const parts = line.split(',');
            if (parts.length >= 2) {
                const word = parts[0].trim();
                const meaning = parts.slice(1).join(',').trim();
                
                if (word && meaning) {
                    words.push({ word, meaning });
                }
            }
        }
        
        return words;
    }

    // 新しいレッスンを保存
    saveNewLesson(customLessons: LessonData[], updateLessonListCallback?: () => void): LessonData | null {
        const lessonName = (document.getElementById('lesson-name-input') as HTMLInputElement).value.trim();
        const wordsText = (document.getElementById('custom-words-input') as HTMLTextAreaElement).value.trim();
        
        if (!wordsText) {
            alert('単語を入力してください。');
            return null;
        }
        
        // 単語を解析
        const words = this.parseCustomWords(wordsText);
        if (words.length === 0) {
            alert('有効な単語が見つかりません。形式を確認してください。');
            return null;
        }
        
        // レッスン名が空の場合は最初の単語から自動生成
        let finalLessonName = lessonName;
        if (!finalLessonName) {
            finalLessonName = `${words[0].word} - ${words[0].meaning}`;
        }
        
        // 新しいレッスンオブジェクトを作成
        const newLesson = {
            id: Date.now().toString(), // 一意のID
            name: finalLessonName,
            words: words,
            createdAt: new Date().toLocaleString()
        };
        
        // レッスンリストに追加
        customLessons.push(newLesson);
        
        // ローカルストレージに保存
        this.storageManager.saveCustomLessons(customLessons);
        
        // サイドバーのレッスン一覧を更新
        if (updateLessonListCallback) {
            updateLessonListCallback();
        }
        
        // 入力フィールドをクリア
        (document.getElementById('lesson-name-input') as HTMLInputElement).value = '';
        (document.getElementById('custom-words-input') as HTMLTextAreaElement).value = '';
        
        alert(`レッスン「${finalLessonName}」を保存しました！`);
        return newLesson;
    }

    // 単語リストを表示
    displayWordsInSelection(lesson: LessonData): void {
        const wordsDisplay = document.getElementById('words-display');
        let displayHTML = '';
        
        lesson.words.forEach((wordObj, index) => {
            displayHTML += `<div class="word-item">${index + 1}. ${wordObj.word} - ${wordObj.meaning}</div>`;
        });
        
        if (lesson.words.length === 0) {
            displayHTML = '<div class="word-item">単語がありません</div>';
        }
        
        wordsDisplay.innerHTML = displayHTML;
    }

    // 単語編集を保存
    saveWordsEdit(selectedLessonForMode: any, customLessons: LessonData[], updateLessonListCallback?: () => void): boolean {
        const wordsEditArea = document.getElementById('words-edit-area') as HTMLTextAreaElement;
        const wordsText = wordsEditArea.value.trim();
        
        if (!wordsText) {
            alert('単語を入力してください。');
            return false;
        }
        
        // 単語を解析
        const newWords = this.parseCustomWords(wordsText);
        if (newWords.length === 0) {
            alert('有効な単語が見つかりません。形式を確認してください。');
            return false;
        }
        
        // レッスンの単語リストを更新
        const lessonIndex = selectedLessonForMode.index;
        customLessons[lessonIndex].words = newWords;
        selectedLessonForMode.lesson.words = newWords;
        
        // ローカルストレージに保存
        this.storageManager.saveCustomLessons(customLessons);
        
        // 表示を更新
        this.displayWordsInSelection(selectedLessonForMode.lesson);
        if (updateLessonListCallback) {
            updateLessonListCallback();
        }
        
        alert('単語リストを更新しました！');
        return true;
    }

    // レッスンを削除
    async deleteLesson(lessonId: string | number, customLessons: LessonData[], updateLessonListCallback?: () => void): Promise<boolean> {
        // firestoreIdまたはidでレッスンを検索（両方のフィールドをチェック）
        const lessonIndex = customLessons.findIndex(lesson => 
            lesson.firestoreId === lessonId || lesson.id === lessonId
        );
        if (lessonIndex === -1) {
            alert('削除対象のレッスンが見つかりません。');
            return false;
        }
        
        const lesson = customLessons[lessonIndex];
        const lessonName = lesson.name;
        
        // 確認ダイアログを表示
        if (!confirm(`「${lessonName}」を削除しますか？\nこの操作は取り消せません。`)) {
            return false;
        }
        
        try {
            // Firestoreから削除（firestoreIdがある場合）
            if (lesson.firestoreId && this.storageManager.firestoreManager) {
                const success = await this.storageManager.firestoreManager.deleteCustomLesson(lesson.firestoreId);
                if (!success) {
                    alert('Firestoreからの削除に失敗しました。');
                    return false;
                }
            }
            
            // ローカル配列から削除
            customLessons.splice(lessonIndex, 1);
            
            // 記録も削除
            const records = await this.storageManager.loadRecords();
            delete records[`lesson${lessonId}`];
            await this.storageManager.saveRecords(records);
            
            // レッスン一覧を更新
            if (updateLessonListCallback) {
                updateLessonListCallback();
            }
            
            alert(`レッスン「${lessonName}」を削除しました。`);
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting lesson:', error);
            alert('レッスンの削除中にエラーが発生しました。');
            return false;
        }
    }
}