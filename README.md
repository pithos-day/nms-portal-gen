# nms-portal-gen

No Man's Sky のポータルアドレス・銀河座標変換ツール。

銀河座標からポータルアドレスを生成し、逆変換もできます。全256銀河に対応し、3D座標ビジュアライズ、プラネット/システム/リージョン名の自動生成、ダークモット対応、日本語・英語のバイリンガルUIを備えています。

## Features

- 銀河座標 ↔ ポータルアドレスの相互変換
- ポータルグリフのカラーコード表示（NMS-Glyphs-Mono フォント）
- Plotly.js による 3D 銀河座標ビジュアライゼーション
- プラネット・システム・リージョン名の自動生成
- 銀河中心からの距離警告（ポータル使用不可エリア）
- URL 連携（ポータルアドレスを共有可能）
- ダーク/ライトテーマ切替（localStorage 永続化）
- 日本語・英語インターナショナライゼーション

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)

### Install & Run

```sh
pnpm install
pnpm dev
```

### Build

```sh
pnpm build
```

### Lint

```sh
pnpm lint
```

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/) (radix-nova style)
- [Plotly.js](https://plotly.com/javascript/) (3D visualization)
- [Lucide](https://lucide.dev/) (icons)
- [Biome](https://biomejs.dev/) (linter/formatter)

## Credits

### ソースコード

- [pithos/nms-portal-gen](https://codeberg.org/pithos/nms-portal-gen) — このプロジェクトのリポジトリ

### ポータルアドレス・銀河座標

- [ポータル | No Man's Sky 日本語Wiki | Fandom](https://nomanssky.fandom.com/ja/wiki/ポータル)
- [Galactic Coordinates - No Man's Sky Wiki](https://nomanssky.fandom.com/wiki/Galactic_Coordinates)

### プラネット・システム・リージョン命名システム

- [stuart/nms_namegen](https://github.com/stuart/nms_namegen) — MIT License
- [andraemon/SystemNameCalculator](https://github.com/andraemon/SystemNameCalculator) — MIT License
- [monkeyman192/NMS_translate](https://github.com/monkeyman192/NMS_translate) — MIT License
- [system-name-calculator-ts](https://codeberg.org/pithos/system-name-calculator-ts) — MIT License

### フォント

- [NMS-Glyphs-Mono by Ghuyajil](https://nomanssky.gamepedia.com/media/hydra/fonts/NMS-Glyphs-Mono.ttf) — CC-BY-SA

### テストデータ

- [No Man's Sky Glyphs](https://glyphs.had.sh)

## License

MIT
