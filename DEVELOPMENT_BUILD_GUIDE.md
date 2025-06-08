# Development Build 作成ガイド

## 🚨 重要な制限

EAS Buildの使用には以下の制限があります：
- **対話的な設定が必要**: EAS CLIは対話的なプロンプトを必要とします
- **アカウント設定**: Expo/EAS アカウントでのプロジェクト作成が必要
- **ネットワーク認証**: オンラインでのプロジェクト設定が必要

## 📱 現在の準備状況

### ✅ 完了済み設定
- EAS CLI インストール済み
- `expo-dev-client` パッケージ追加済み
- `expo-notifications` プラグイン復元済み
- Android権限設定済み
- `eas.json` 設定ファイル作成済み

### 📁 設定ファイル内容

#### app.json の設定
```json
{
  "expo": {
    "android": {
      "package": "com.reminder.app",
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE", 
        "WAKE_LOCK",
        "android.permission.SCHEDULE_EXACT_ALARM"
      ]
    },
    "plugins": [
      "expo-router",
      ["expo-splash-screen", { ... }],
      ["expo-notifications", {
        "color": "#ffffff",
        "defaultChannel": "reminder"
      }]
    ]
  }
}
```

#### eas.json の設定
```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    }
  }
}
```

## 🛠️ 手動実行手順

### 1. EAS プロジェクト初期化
```bash
cd /Users/yosuke.kobayashi2/repo/konkarin/reminder
eas init
# プロンプトで「y」を選択してプロジェクト作成
```

### 2. Development Build作成
```bash
# ローカルビルド（推奨）
eas build --platform android --profile development --local

# またはクラウドビルド
eas build --platform android --profile development
```

### 3. APKのインストール
```bash
# ローカルビルド完了後
adb install <生成されたAPKファイル>.apk

# またはAndroidデバイスで直接インストール
```

## 🔧 トラブルシューティング

### 問題1: EAS プロジェクト未設定
**エラー**: `EAS project not configured`
**解決**: `eas init` を手動実行してプロジェクト作成

### 問題2: 対話的プロンプト
**エラー**: `Input is required, but stdin is not readable`
**解決**: ターミナルで手動実行（CLIの制限）

### 問題3: ビルドエラー
**原因**: Gradle設定、権限設定、プラグイン設定
**解決**: 
- Android Studio での設定確認
- `expo doctor` でのヘルスチェック
- キャッシュクリア: `expo r -c`

## 📋 Development Build の利点

### 完全な通知機能
- 実際のプッシュ通知送信
- スケジュール通知
- バックグラウンド通知
- リマインド機能の完全動作

### 本格的なテスト環境
- 実機での完全動作確認
- パフォーマンステスト
- バッテリー消費テスト
- 通知信頼性テスト

## 🚀 次のステップ

1. **手動でのEAS設定実行**
2. **Development Build作成**
3. **実機での完全機能テスト**
4. **通知動作の詳細確認**
5. **ユーザビリティテスト**

## 💡 代替案

### Expo Go での継続開発
現在のExpo Go環境でも以下が可能：
- UI/UX開発・改善
- データ管理機能のテスト
- 基本的なアプリフロー確認
- Phase 3機能の開発

### ローカル開発環境
```bash
# 基本機能テスト
npm start

# Android エミュレータでの動作確認
npm run android
```

---

**注意**: EAS Buildの完全な実行には対話的な操作が必要ですが、すべての設定ファイルは準備完了しています。手動での `eas init` と `eas build` 実行により、完全な通知機能を持つDevelopment Buildを作成できます。