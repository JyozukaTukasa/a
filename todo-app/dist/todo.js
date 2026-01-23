"use strict";
/**
 * Todo App - メインロジック
 *
 * 機能:
 * - タスクの追加・削除・編集
 * - 完了/未完了の切り替え
 * - フィルタリング（すべて/完了/未完了）
 * - ローカルストレージへの保存
 */
// ===================================
// 定数
// ===================================
/** ローカルストレージのキー */
const STORAGE_KEY = 'todos';
// ===================================
// 状態管理
// ===================================
/** Todoリスト */
let todos = [];
/** 現在のフィルター */
let currentFilter = 'all';
// ===================================
// DOM要素の取得
// ===================================
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const remainingCount = document.getElementById('remainingCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterButtons = document.querySelectorAll('.filter-button');
// ===================================
// ユーティリティ関数
// ===================================
/**
 * 一意なIDを生成する
 * Date.now() + ランダム文字列で一意性を保証
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
/**
 * ローカルストレージにTodosを保存
 */
function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
/**
 * ローカルストレージからTodosを読み込み
 */
function loadTodos() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}
// ===================================
// フィルタリング
// ===================================
/**
 * 現在のフィルターに基づいてTodosをフィルタリング
 */
function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(todo => !todo.completed);
        case 'completed':
            return todos.filter(todo => todo.completed);
        default:
            return todos;
    }
}
/**
 * 未完了のタスク数を取得
 */
function getActiveCount() {
    return todos.filter(todo => !todo.completed).length;
}
/**
 * 完了済みのタスク数を取得
 */
function getCompletedCount() {
    return todos.filter(todo => todo.completed).length;
}
// ===================================
// UI更新
// ===================================
/**
 * Todoリストを再描画
 */
function renderTodos() {
    const filteredTodos = getFilteredTodos();
    // リストをクリア
    todoList.innerHTML = '';
    // 空の状態を表示/非表示
    if (filteredTodos.length === 0) {
        emptyState.classList.remove('hidden');
    }
    else {
        emptyState.classList.add('hidden');
        // 各Todoを描画
        filteredTodos.forEach(todo => {
            const li = createTodoElement(todo);
            todoList.appendChild(li);
        });
    }
    // フッターの情報を更新
    updateFooter();
}
/**
 * TodoのDOM要素を作成
 */
function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;
    li.dataset.id = todo.id;
    // チェックボックス
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    // テキスト
    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;
    text.addEventListener('dblclick', () => startEditing(todo.id));
    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = '🗑';
    deleteBtn.title = '削除';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    return li;
}
/**
 * フッターの情報を更新
 */
function updateFooter() {
    const activeCount = getActiveCount();
    remainingCount.textContent = activeCount.toString();
    // 完了済みがない場合は削除ボタンを非表示
    const completedCount = getCompletedCount();
    clearCompletedBtn.style.visibility = completedCount > 0 ? 'visible' : 'hidden';
}
/**
 * フィルターボタンのアクティブ状態を更新
 */
function updateFilterButtons() {
    filterButtons.forEach(btn => {
        const filter = btn.dataset.filter;
        if (filter === currentFilter) {
            btn.classList.add('active');
        }
        else {
            btn.classList.remove('active');
        }
    });
}
// ===================================
// CRUD操作
// ===================================
/**
 * 新しいTodoを追加
 */
function addTodo(text) {
    const trimmedText = text.trim();
    if (!trimmedText)
        return;
    const newTodo = {
        id: generateId(),
        text: trimmedText,
        completed: false,
        createdAt: Date.now()
    };
    todos.unshift(newTodo); // 先頭に追加
    saveTodos();
    renderTodos();
}
/**
 * Todoを削除
 */
function deleteTodo(id) {
    // アニメーション用にクラスを追加
    const item = todoList.querySelector(`[data-id="${id}"]`);
    if (item) {
        item.classList.add('deleting');
        item.addEventListener('animationend', () => {
            todos = todos.filter(todo => todo.id !== id);
            saveTodos();
            renderTodos();
        });
        // アニメーションを適用
        item.style.animation = 'slideOut 0.3s ease forwards';
    }
    else {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
    }
}
/**
 * Todoの完了状態を切り替え
 */
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}
/**
 * 編集モードを開始
 */
function startEditing(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo)
        return;
    const item = todoList.querySelector(`[data-id="${id}"]`);
    if (!item)
        return;
    item.classList.add('editing');
    // テキスト要素を入力欄に置き換え
    const textSpan = item.querySelector('.todo-text');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit-input';
    input.value = todo.text;
    // Enterで保存、Escapeでキャンセル
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishEditing(id, input.value);
        }
        else if (e.key === 'Escape') {
            renderTodos(); // 再描画でキャンセル
        }
    });
    // フォーカスが外れたら保存
    input.addEventListener('blur', () => {
        finishEditing(id, input.value);
    });
    textSpan.replaceWith(input);
    input.focus();
    input.select();
}
/**
 * 編集を完了
 */
function finishEditing(id, newText) {
    const trimmedText = newText.trim();
    if (trimmedText) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.text = trimmedText;
            saveTodos();
        }
    }
    renderTodos();
}
/**
 * 完了済みのTodoをすべて削除
 */
function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
}
/**
 * フィルターを変更
 */
function setFilter(filter) {
    currentFilter = filter;
    updateFilterButtons();
    renderTodos();
}
// ===================================
// イベントリスナー
// ===================================
// フォーム送信（タスク追加）
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(todoInput.value);
    todoInput.value = '';
    todoInput.focus();
});
// フィルターボタン
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        setFilter(filter);
    });
});
// 完了済み削除ボタン
clearCompletedBtn.addEventListener('click', clearCompleted);
// ===================================
// 初期化
// ===================================
/**
 * アプリを初期化
 */
function init() {
    // ローカルストレージからデータを読み込み
    todos = loadTodos();
    // UIを描画
    renderTodos();
    updateFilterButtons();
    // 入力欄にフォーカス
    todoInput.focus();
}
// アプリ起動
init();
