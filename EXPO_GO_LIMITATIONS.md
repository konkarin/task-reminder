# Expo Go環境での制限事項と対応

## 🚨 重要な制限事項

### Expo Go (SDK 53以降)での通知機能制限
Expo Go環境では、`expo-notifications`のプッシュ通知機能が削除されました。
完全な通知機能を使用するには**Development Build**が必要です。

## 📱 現在の動作状況

### ✅ Expo Goで動作する機能
- タスクの作成・編集・削除
- 今日のタスク一覧表示
- タスク完了チェック
- データの永続化（AsyncStorage）
- 基本的なUI操作

### ❌ Expo Goで制限される機能
- スケジュール通知（定時通知）
- リマインド通知（繰り返し通知）
- バックグラウンド通知

### 🔄 代替動作（Expo Go環境）
- 通知権限要求時：制限について説明するアラート表示
- テスト通知送信時：通知の代わりにアラート表示
- 通知スケジューリング：スキップ（エラーなし）

## 🛠️ 完全な機能を使用する方法

### 1. Development Buildの作成
```bash
# EAS CLIのインストール
npm install -g @expo/eas-cli

# EAS Build設定
eas build:configure

# Android Development Buildの作成
eas build --platform android --profile development
```

### 2. app.jsonの設定復元
Development Build使用時は以下の設定を復元：

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff",
          "defaultChannel": "reminder"
        }
      ]
    ]
  }
}
```

### 3. Android権限の追加（必要に応じて）
```json
{
  "expo": {
    "android": {
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK"
      ]
    }
  }
}
```

## 🧪 開発・テスト戦略

### Phase 1: Expo Go環境
- 基本的なUI/UX開発
- データ管理機能のテスト
- タスクCRUD操作の検証

### Phase 2: Development Build環境
- 通知機能の実装・テスト
- リマインド機能の検証
- バックグラウンド動作の確認

## 📋 現在の対応状況

### 実装済み対応
1. **Expo Go検出機能**
   - `__DEV__ && !process.env.EAS_BUILD`による環境判定
   - 制限機能の適切なスキップ

2. **フォールバック動作**
   - 通知の代わりにアラート表示
   - エラーハンドリング強化

3. **ユーザー向け説明**
   - 制限について適切な通知
   - Development Build使用推奨

### 今後の対応
1. **Development Build対応**
   - EAS Build設定
   - 本格的な通知機能テスト

2. **プロダクション対応**
   - アプリストア配布準備
   - 本格運用環境での検証

## 💡 開発者向けメモ

### Expo Go環境での開発継続
- 通知以外の機能は正常に動作
- UI/UXの開発・検証は可能
- データ管理機能の実装・テスト可能

### Development Buildへの移行タイミング
- 通知機能の実装・テスト時
- 本格的なユーザーテスト開始時
- プロダクション準備段階

通知機能が薬の飲み忘れ防止アプリの核心機能ですが、現在の実装により基本的なアプリ機能は正常に動作し、Development Build環境で完全な機能を利用できます。