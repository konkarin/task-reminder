# タスク設計書

## 1. システムアーキテクチャ

### 1.1 アプリケーション構造
```
src/
├── components/          # 再利用可能なUIコンポーネント
│   ├── Task/           # タスク関連コンポーネント
│   ├── Notification/   # 通知関連コンポーネント
│   └── Common/         # 共通コンポーネント
├── screens/            # 画面コンポーネント
├── hooks/              # カスタムフック
├── services/           # ビジネスロジック・外部サービス
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
└── constants/          # 定数定義
```

### 1.2 データフロー
```
User Action → Component → Custom Hook → Service → AsyncStorage
                ↓                ↓
            State Update ← Notification Service
```

## 2. データモデル設計

### 2.1 Task型定義
```typescript
interface Task {
  id: string;                    // UUID
  name: string;                  // タスク名
  scheduledTimes: string[];      // 実行時刻配列 ["08:00", "12:00", "20:00"]
  daysOfWeek: number[];          // 曜日配列 [1,2,3,4,5,6,0] (月〜日)
  reminderInterval: number;      // リマインド間隔（分）
  isActive: boolean;             // アクティブフラグ
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}

interface TaskExecution {
  id: string;                    // UUID
  taskId: string;               // 関連タスクID
  scheduledTime: string;        // 予定時刻 "08:00"
  date: string;                 // 実行日 "2024-01-15"
  completedAt: Date | null;     // 完了日時
  reminderCount: number;        // リマインド回数
  status: 'pending' | 'completed' | 'missed';
}
```

### 2.2 Notification型定義
```typescript
interface ScheduledNotification {
  id: string;                   // 通知ID
  taskId: string;               // 関連タスクID
  executionId: string;          // 実行記録ID
  scheduledTime: Date;          // 通知予定時刻
  type: 'initial' | 'reminder'; // 通知種別
  isActive: boolean;            // アクティブフラグ
}
```

## 3. 主要機能の実装設計

### 3.1 タスク管理サービス
```typescript
class TaskService {
  // タスクCRUD操作
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>
  async updateTask(id: string, updates: Partial<Task>): Promise<Task>
  async deleteTask(id: string): Promise<void>
  async getTasks(): Promise<Task[]>
  async getTaskById(id: string): Promise<Task | null>
  
  // 日次実行記録管理
  async generateDailyExecutions(date: string): Promise<TaskExecution[]>
  async completeExecution(executionId: string): Promise<void>
  async getExecutionsForDate(date: string): Promise<TaskExecution[]>
}
```

### 3.2 通知管理サービス
```typescript
class NotificationService {
  // 通知スケジューリング
  async scheduleInitialNotifications(task: Task): Promise<void>
  async scheduleReminderNotification(execution: TaskExecution): Promise<void>
  async cancelNotifications(taskId: string): Promise<void>
  
  // 通知処理
  async handleNotificationReceived(notificationId: string): Promise<void>
  async sendImmediateNotification(message: string): Promise<void>
  
  // 権限管理
  async requestPermissions(): Promise<boolean>
  async checkPermissionStatus(): Promise<boolean>
}
```

### 3.3 データ永続化サービス
```typescript
class StorageService {
  // タスクデータ
  async saveTasks(tasks: Task[]): Promise<void>
  async loadTasks(): Promise<Task[]>
  
  // 実行履歴
  async saveExecutions(executions: TaskExecution[]): Promise<void>
  async loadExecutions(dateRange?: { from: string; to: string }): Promise<TaskExecution[]>
  
  // アプリ設定
  async saveSettings(settings: AppSettings): Promise<void>
  async loadSettings(): Promise<AppSettings>
}
```

## 4. 画面設計

### 4.1 ホーム画面 (app/(tabs)/index.tsx)
```typescript
// 主要機能
- 今日のタスク実行一覧表示
- 完了チェック機能
- 次回予定時刻表示
- リアルタイム更新

// 使用するHooks
- useTodayExecutions() // 今日の実行一覧取得
- useCompleteExecution() // 完了処理
- useNotificationStatus() // 通知状態監視
```

### 4.2 タスク管理画面 (app/tasks/)
```typescript
// ファイル構成
├── index.tsx           # タスク一覧
├── create.tsx          # 新規作成
├── [id]/
│   ├── edit.tsx        # 編集
│   └── history.tsx     # 履歴

// 主要機能
- タスクCRUD操作
- フォームバリデーション
- プレビュー機能
```

### 4.3 設定画面 (app/settings/)
```typescript
// 主要設定項目
- 通知設定（音、バイブレーション）
- リマインド間隔デフォルト値
- 履歴保持期間
- データエクスポート/インポート
```

## 5. カスタムHooks設計

### 5.1 タスク関連フック
```typescript
// タスク一覧管理
const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  const createTask = useCallback(async (taskData) => { ... }, []);
  const updateTask = useCallback(async (id, updates) => { ... }, []);
  const deleteTask = useCallback(async (id) => { ... }, []);
  
  return { tasks, loading, createTask, updateTask, deleteTask };
};

// 今日の実行状況
const useTodayExecutions = () => {
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const completeExecution = useCallback(async (id) => { ... }, []);
  const refresh = useCallback(async () => { ... }, []);
  
  return { executions, refreshing, completeExecution, refresh };
};
```

### 5.2 通知関連フック
```typescript
const useNotifications = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>();
  
  const requestPermission = useCallback(async () => { ... }, []);
  const scheduleTaskNotifications = useCallback(async (task) => { ... }, []);
  
  return { hasPermission, requestPermission, scheduleTaskNotifications };
};
```

## 6. 実装タスク一覧

### 6.1 Phase 1: 基本機能実装
1. **プロジェクト環境構築**
   - 必要なExpoライブラリのインストール
   - TypeScript型定義の作成
   - 基本的なディレクトリ構造の構築

2. **データモデル実装**
   - Task, TaskExecution型の定義
   - StorageServiceの実装
   - 基本的なCRUD操作

3. **基本UI実装**
   - ホーム画面のレイアウト
   - タスク一覧表示
   - 新規作成フォーム

4. **通知基盤実装**
   - expo-notifications設定
   - 権限要求処理
   - 基本的な通知送信

### 6.2 Phase 2: コア機能実装
5. **タスクスケジューリング**
   - 曜日・時刻指定機能
   - 日次実行記録生成
   - 通知スケジューリング

6. **リマインド機能**
   - 未完了タスクの検出
   - 繰り返し通知の実装
   - 完了時の通知停止

7. **状態管理強化**
   - リアルタイム更新
   - バックグラウンド同期
   - エラーハンドリング

### 6.3 Phase 3: UI/UX改善
8. **詳細UI実装**
   - タスク編集画面
   - 設定画面
   - 履歴・統計画面

9. **ユーザビリティ向上**
   - アニメーション追加
   - 操作フィードバック改善
   - アクセシビリティ対応

10. **テスト・最適化**
    - 単体テスト作成
    - 統合テスト
    - パフォーマンス最適化

## 7. 技術的考慮事項

### 7.1 Androidバックグラウンド制限対応
- Foreground Serviceの利用検討
- Battery Optimization除外設定の案内
- Doze Mode対応

### 7.2 通知信頼性確保
- 通知配信失敗時のリトライ機構
- ローカル通知とプッシュ通知の使い分け
- 通知履歴の保持

### 7.3 データ整合性
- 日付変更時の処理
- アプリ復旧時のデータ同期
- 異常終了時のデータ保護

### 7.4 パフォーマンス最適化
- 不要な再レンダリング防止
- メモリリーク対策
- バッテリー消費最小化

## 8. 開発・テスト計画

### 8.1 開発環境
- **開発**: Expo Development Build
- **テスト**: Android Emulator + 実機
- **ビルド**: EAS Build
- **デプロイ**: Google Play Store (Internal Testing)

### 8.2 テスト戦略
- **単体テスト**: Jest + React Native Testing Library
- **統合テスト**: Detoxを検討
- **手動テスト**: 実機での通知動作確認
- **ユーザビリティテスト**: 高齢者を含むターゲットユーザー

### 8.3 品質保証
- TypeScriptによる型安全性
- ESLintによるコード品質チェック
- Prettierによるコード整形
- 継続的インテグレーション設定