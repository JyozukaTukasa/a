/**
 * 電卓アプリ - メインロジック
 * 
 * 【このファイルの役割】
 * - 4足演算（+、-、×、÷）の計算処理
 * - ボタンクリック時のイベント処理
 * - ディスプレイへの結果表示
 * 
 * 【処理の流れ】
 * 1. ユーザーが数字ボタンをクリック → 画面に数字を表示
 * 2. ユーザーが演算子ボタンをクリック → 演算子を記憶
 * 3. ユーザーが=ボタンをクリック → 計算実行 → 結果を表示
 */

/**
 * Calculator クラス
 * 
 * 電卓の状態と計算ロジックを管理するクラス
 * 
 * 【なぜクラスを使うのか？】
 * - 電卓の「状態」（今入力中の数字、前の数字、演算子）をまとめて管理できる
 * - 関連する処理（計算、表示、クリア）をひとまとめにできる
 * - コードが整理されて読みやすくなる
 */
class Calculator {
  /**
   * 現在ディスプレイに表示されている数字
   * 文字列として保持（小数点や連続入力に対応するため）
   */
  private currentValue: string = '0';

  /**
   * 前回入力された数字
   * 演算子が押されたとき、currentValueがここに移動する
   */
  private previousValue: string = '';

  /**
   * 現在選択されている演算子（+、-、*、/）
   * 空文字の場合は演算子未選択
   */
  private operator: string = '';

  /**
   * 次の数字入力で画面をクリアするかどうか
   * =を押した後や演算子を押した後にtrueになる
   */
  private shouldResetDisplay: boolean = false;

  /**
   * ディスプレイ要素への参照
   * HTMLのinput要素を保持
   */
  private displayElement: HTMLInputElement;

  /**
   * コンストラクタ
   * 
   * 【コンストラクタとは？】
   * - クラスのインスタンス（実体）を作るときに最初に実行される処理
   * - 初期設定を行う場所
   * 
   * @param displayElementId - ディスプレイ要素のID（HTMLのid属性）
   */
  constructor(displayElementId: string) {
    // IDを使ってHTML要素を取得
    // 「!」は「nullではないことを保証する」という意味（TypeScriptの記法）
    this.displayElement = document.getElementById(displayElementId) as HTMLInputElement;
    
    // ボタンにイベントリスナーを設定
    this.setupEventListeners();
  }

  /**
   * イベントリスナーの設定
   * 
   * 【イベントリスナーとは？】
   * - ユーザーの操作（クリックなど）を「聞いて」いる仕組み
   * - 操作があったら指定した処理を実行する
   * 
   * 【なぜイベント委譲を使うのか？】
   * - ボタンが複数あっても、親要素に1つリスナーを付けるだけでOK
   * - コードがシンプルになり、メモリ効率も良い
   */
  private setupEventListeners(): void {
    // 電卓全体（calculator クラスを持つ要素）を取得
    const calculator = document.querySelector('.calculator');
    
    if (calculator) {
      // クリックイベントを監視
      calculator.addEventListener('click', (event: Event) => {
        // クリックされた要素を取得
        const target = event.target as HTMLElement;
        
        // ボタン要素でなければ何もしない
        if (!target.classList.contains('btn')) return;

        // data-action属性からアクションを取得
        const action = target.dataset.action;
        // data-value属性から値を取得
        const value = target.dataset.value;

        // アクションに応じて処理を分岐
        switch (action) {
          case 'number':
            // 数字ボタンが押された
            this.inputNumber(value || '');
            break;
          case 'operator':
            // 演算子ボタンが押された
            this.inputOperator(value || '');
            break;
          case 'equal':
            // =ボタンが押された
            this.calculate();
            break;
          case 'clear':
            // Cボタンが押された
            this.clear();
            break;
        }
      });
    }
  }

  /**
   * 数字入力処理
   * 
   * 【処理内容】
   * - 入力された数字をディスプレイに追加
   * - 最初の0は置き換える（01にならないように）
   * - 小数点は1つまで
   * 
   * @param num - 入力された数字（0-9または.）
   */
  private inputNumber(num: string): void {
    // エラー表示をクリア
    this.displayElement.classList.remove('error');

    // 画面をリセットするフラグが立っていたら、新しい数字で上書き
    if (this.shouldResetDisplay) {
      this.currentValue = num === '.' ? '0.' : num;
      this.shouldResetDisplay = false;
    } else {
      // 小数点の重複チェック
      if (num === '.' && this.currentValue.includes('.')) {
        return; // すでに小数点があれば何もしない
      }
      
      // 最初の0を置き換える（ただし0.の場合は除く）
      if (this.currentValue === '0' && num !== '.') {
        this.currentValue = num;
      } else {
        // 既存の数字に追加
        this.currentValue += num;
      }
    }

    // ディスプレイを更新
    this.updateDisplay();
  }

  /**
   * 演算子入力処理
   * 
   * 【処理内容】
   * - 演算子を記憶
   * - 前の計算がある場合は先に計算を実行
   * 
   * @param op - 入力された演算子（+、-、*、/）
   */
  private inputOperator(op: string): void {
    // エラー表示をクリア
    this.displayElement.classList.remove('error');

    // すでに演算子が入力されていて、次の数字も入力されている場合
    // → 先に計算を実行してから新しい演算子を設定
    if (this.operator && !this.shouldResetDisplay) {
      this.calculate();
    }

    // 現在の値を「前の値」に移動
    this.previousValue = this.currentValue;
    // 演算子を記憶
    this.operator = op;
    // 次の数字入力で画面をリセット
    this.shouldResetDisplay = true;
  }

  /**
   * 計算実行
   * 
   * 【処理内容】
   * - 前の数字と現在の数字を演算子で計算
   * - 結果をディスプレイに表示
   * - 0で割った場合はエラーを表示
   */
  private calculate(): void {
    // 演算子がなければ何もしない
    if (!this.operator) return;

    // 文字列を数値に変換
    // parseFloatは「文字列を小数点付き数値に変換する」関数
    const prev = parseFloat(this.previousValue);
    const current = parseFloat(this.currentValue);
    let result: number;

    // 演算子に応じて計算
    switch (this.operator) {
      case '+':
        // 足し算
        result = prev + current;
        break;
      case '-':
        // 引き算
        result = prev - current;
        break;
      case '*':
        // 掛け算
        result = prev * current;
        break;
      case '/':
        // 割り算
        // 0で割るとエラー
        if (current === 0) {
          this.showError();
          return;
        }
        result = prev / current;
        break;
      default:
        return;
    }

    // 結果を文字列に変換してディスプレイに設定
    // toStringは「数値を文字列に変換する」メソッド
    this.currentValue = this.formatResult(result);
    
    // 状態をリセット
    this.operator = '';
    this.previousValue = '';
    this.shouldResetDisplay = true;

    // ディスプレイを更新
    this.updateDisplay();
  }

  /**
   * 計算結果のフォーマット
   * 
   * 【処理内容】
   * - 小数点以下が長くなりすぎないように丸める
   * - 整数の場合は小数点を表示しない
   * 
   * @param result - 計算結果
   * @returns フォーマットされた文字列
   */
  private formatResult(result: number): string {
    // 小数点以下10桁で丸める（浮動小数点の誤差対策）
    // 例：0.1 + 0.2 = 0.30000000000000004 → 0.3
    const rounded = Math.round(result * 10000000000) / 10000000000;
    return rounded.toString();
  }

  /**
   * エラー表示
   * 
   * 【処理内容】
   * - ディスプレイに「Error」と表示
   * - CSSでエラースタイルを適用
   * - 状態をリセット
   */
  private showError(): void {
    this.currentValue = 'Error';
    this.operator = '';
    this.previousValue = '';
    this.shouldResetDisplay = true;
    
    // ディスプレイを更新
    this.updateDisplay();
    
    // エラースタイルを適用（赤色で揺れるアニメーション）
    this.displayElement.classList.add('error');
  }

  /**
   * クリア処理
   * 
   * 【処理内容】
   * - すべての状態を初期値に戻す
   * - ディスプレイを0に戻す
   */
  private clear(): void {
    this.currentValue = '0';
    this.previousValue = '';
    this.operator = '';
    this.shouldResetDisplay = false;
    
    // エラースタイルを解除
    this.displayElement.classList.remove('error');
    
    // ディスプレイを更新
    this.updateDisplay();
  }

  /**
   * ディスプレイ更新
   * 
   * 【処理内容】
   * - 現在の値をHTML要素に反映
   */
  private updateDisplay(): void {
    this.displayElement.value = this.currentValue;
  }
}

/**
 * アプリケーション初期化
 * 
 * 【DOMContentLoadedとは？】
 * - HTMLの読み込みが完了したタイミングで発火するイベント
 * - このタイミングで初期化しないと、HTML要素がまだ存在しない可能性がある
 * 
 * 【なぜこのタイミングで初期化？】
 * - JavaScriptはHTMLより先に実行される可能性がある
 * - document.getElementByIdがnullを返さないようにするため
 */
document.addEventListener('DOMContentLoaded', () => {
  // 電卓インスタンスを作成
  // 'display'はHTML内のinput要素のID
  new Calculator('display');
});
