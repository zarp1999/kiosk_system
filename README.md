# 印刷屋キオスクシステム

モンゴルの印刷屋向けキオスクアプリです。Electron + React + TypeScript で開発します。

画面は Mac で作り、印刷・USB・Windows 用インストーラーは Windows 実機で確認します。

## 必要環境

- Node.js 20 LTS 以降（22 でも可。Mac と Windows で揃える）
- npm
- Git

## セットアップ

```bash
git clone https://github.com/zarp1999/kiosk_system.git
cd kiosk_system
npm install
npm run dev
```

`node_modules` はコピーせず、各 PC で `npm install` してください。

## よく使うコマンド

```bash
npm run dev          # 開発起動
npm run typecheck    # 型チェック
npm run lint         # ESLint
npm run build:win    # Windows 用インストーラー（Windows 実機で実行）
```

Windows 用の `.exe` は Mac では作りません。ビルドは Windows 側で行います。

## 開発の進め方

1. Mac で画面とロジックを実装して push する
2. Windows で `git pull` → `npm install` → `npm run dev`
3. 印刷・USB の確認は Windows と実プリンターで行う

最初の実装目標は、USB から PDF を選んでプレビューすることです。

## ドキュメント

要件定義・設計書は `docs/` にあります。
