# Fretboard Renderer

Obsidianのノート内で、軽量なYAML記法からギターの指板図（フレットボード図）をSVGとして描画するプラグインです。コード進行の分析からペンタトニック／モード・スケールのポジション確認まで、最小限のタイピングで見栄えの良い図を作れることを目指しています。

````markdown
```fretboard
notes:
  - {s: 6, f: 0, label: root}
  - [5, 2]
  - [4, 5]
  - [3, 2]
  - [2, 0]
  - [1, 0]
```
````

## インストール（開発版）

1. このリポジトリを Vault の `.obsidian/plugins/fretboard-renderer` にクローン、または配置する。
2. `npm install`
3. `npm run build`（一度だけビルド）、または `npm run dev`（ソース変更を監視して自動リビルド）
4. Obsidianの設定 → コミュニティプラグイン で "Fretboard Renderer" を有効化する。

## 設定の3階層（System / Global / Local）

設定は3段階のレイヤーで構成され、**後段ほど優先度が高くなります**。

```
Local（```fretboardブロックごとのYAML）
  ↑ 上書き
Global（Vaultルートの fretboard-renderer.yaml）
  ↑ 上書き
System（Obsidianのプラグイン設定画面）
```

| レイヤー | 定義場所 | スコープ |
| :--- | :--- | :--- |
| **System** | Obsidianの設定画面（このプラグインの設定タブ） | Vault内の全```fretboardブロックの最終フォールバック |
| **Global** | Vaultルート直下の `fretboard-renderer.yaml` | そのVault内の全```fretboardブロック |
| **Local** | 各```fretboardコードブロック内のYAML | そのブロック1つだけ |

### System（プラグイン設定画面）

Obsidianの設定 → Fretboard Renderer から変更できます。Vault内の全ての図に影響するデフォルト値です。設定画面は「Layout & Dimensions」「Display & Style」「Note Appearance」「Tuning & Fallback」の4セクションに分かれています。Note size / Label font sizeは「Note Appearance」セクションにあります。

| 項目 | 値 | デフォルト |
| :--- | :--- | :--- |
| Orientation | `horizontal` / `vertical` | `horizontal` |
| Strings | 弦の本数 | `6` |
| Fret count | 描画するフレット幅 | `4` |
| String spacing | 弦間隔（px） | `30` |
| Fret spacing | フレット間隔（px） | `50` |
| Label mode | `interval`（度数） / `note`（音名） / `none` | `interval` |
| Accidental | `sharp`（#） / `flat`（b） | `sharp` |
| Default shape | `circle` / `square` / `triangle` | `circle` |
| Fill style | `filled`（黒塗り） / `outlined`（白抜き） | `filled` |
| Nut style | `thick`（太線） / `double`（二重線） | `thick` |
| Fret numbering | `all` / `dotted`（音がある列のみ） / `inlay`（指板インレイ位置のみ: 3,5,7,9,12,15,17,19,21,24,...） / `none` | `dotted` |
| Default tuning | 低音弦から高音弦の順、カンマ区切り | `E,A,D,G,B,E` |
| Omitted string behavior | `open`（f:0扱い） / `muted`（f:x扱い） / `none`（描画しない） | `open` |
| Note size (px) | 音のドット（形）の基準半径。個々のノートの`sizeAdjust`（-5〜5）がここに加算される | `10` |
| Label font size (px) | 音のラベル文字の基準フォントサイズ。個々のノートの`labelSizeAdjust`（-5〜5）がここに加算される | `10` |

### Global（Vault共通のYAML設定ファイル）

Vaultの**ルートディレクトリ**（`.obsidian/`の中ではない）に **`fretboard-renderer.yaml`** というファイルを作ると、Systemの値をVault単位で上書きできます。指定できるキーはSystemの表と同じです。

```yaml
# Vaultルート/fretboard-renderer.yaml
orientation: vertical
fretCount: 5
labelMode: note
```

- ファイルが無い、またはキーが省略されている項目はSystemの値のまま。
- 保存すると次の描画から自動的に反映されます（プラグインの再読み込み不要）。
- 構文エラーがある場合は、Obsidianの通知（Notice）で一度だけエラーを表示し、System設定にフォールバックします（Vault内の図が全部壊れることはありません）。

### Local（```fretboardブロックごとのYAML）

各ノートの```fretboardコードブロックに直接書きます。System・Globalを最終的に上書きする、最も優先度の高い設定です。`notes` だけが必須で、他は全て任意です。

```fretboard
title: Am Pentatonic (Box 1)
visible: 1-6
startFret: 5
frets: 4
boxes:
  - {frets: "5-8", style: dashed}
paths:
  - [[6,5], [6,8], [5,5], [5,7]]
notes:
  - {s: 6, f: 5, label: root, shape: square}
  - [6, 8]
  - {s: 5, f: 5}
  - {s: 5, f: 7, finger: 3, ghost: true}
```

#### `notes`（必須）

音の配置データの配列。オブジェクト形式と配列の省略記法の両方を使えます。

```yaml
notes:
  - {s: 6, f: 5, label: root, shape: square, finger: 1, ghost: false, class: "highlight"}
  - [6, 8]              # [s, f]
  - [5, 5, "root"]       # [s, f, label]
  - [5, 7, "3", "square", 3]  # [s, f, label, shape, finger]
  - {s: 4, f: 7, color: red, fillStyle: outlined, sizeAdjust: -3, labelSizeAdjust: 2}
```

| キー | 必須 | 説明 |
| :--- | :--- | :--- |
| `s` | ✅ | 弦番号（1〜N、1が最も高音の弦） |
| `f` | ✅ | フレット番号。`0`=開放弦、`1`以上=押弦、`x`=ミュート。**`0`と`x`はグリッドの列ではなく、常にグリッド外のヘッダ領域に描画される特殊記号**（フレット番号ラベルとしてカウントされない） |
| `label` | – | `root` を指定すると度数を自動計算。任意の文字列（`"maj7"`, `"9"` など）を書くと自動計算を無視してそのまま表示 |
| `shape` | – | `circle` / `square` / `triangle` |
| `finger` | – | 運指番号。ドットの外側に小さく表示 |
| `ghost` | – | `true`で点線・半透明表示 |
| `class` | – | 任意のCSSクラス名（スニペットでのハイライト用） |
| `color` | – | この音1つだけの色をCSS色文字列（`red`, `#ff0000`, `var(--color-red)`等）で指定。System/GlobalのFill StyleやRoot強調色より優先される |
| `fillStyle` | – | `filled` / `outlined`。この音1つだけSystem/Globalの`Fill style`を上書き |
| `sizeAdjust` | – | 整数 -5〜5。この音1つだけの形の大きさを`Note size`からpx単位で微調整 |
| `labelSizeAdjust` | – | 整数 -5〜5。この音1つだけのラベル文字サイズを`Label font size`からpx単位で微調整 |

`color` / `fillStyle` / `sizeAdjust` / `labelSizeAdjust` はオブジェクト形式（`{s: ..., f: ...}`）でのみ指定できます。配列の省略記法（`[s, f, label, shape, finger]`）には含まれません。

Rootとして強調される音（`label: root`と同じ音、オクターブ違い含む）は、デフォルトではSystemのアクセントカラー（Obsidianテーマの`--interactive-accent`、既定では紫系）で強調表示されます。これは意図した既定動作です。特定の音を赤にしたい等、個別に色を変えたい場合は上記の`color`で上書きしてください。

#### そのほかのLocalオプション（すべて任意）

| キー | 型 | 説明 |
| :--- | :--- | :--- |
| `title` | String | 上部に表示するタイトル。省略時は自動生成（下記参照） |
| `startFret` | Number | 描画領域の左端フレット番号。省略すると相対モードになる（下記参照） |
| `frets` | Number | 描画するフレット幅（Systemの`Fret count`をこの図だけ上書き） |
| `orientation` | `horizontal` / `vertical` | この図だけ向きを上書き |
| `size` | Number | この図全体の表示倍率（例: `0.6` で60%サイズ）。複数の図を小さく並べたい時に使う |
| `fretSpacingAdjust` | 整数 -5〜5 | フレット間隔（px）への微調整。`size`より先に加算される |
| `stringSpacingAdjust` | 整数 -5〜5 | 弦間隔（px）への微調整。`size`より先に加算される |
| `visible` | String | 描画する弦の範囲。例: `"1-4"` |
| `barre` | Array | `{fret, start, end}` でセーハ（バレー）を描画 |
| `boxes` | Array | `{frets: "5-8", strings: "1-6", style: "dashed"}` でスケールポジション等を枠で囲む |
| `paths` | Array | `[[6,5],[6,8],[5,5]]` のようにドット同士を線で結ぶ |

`size` / `fretSpacingAdjust` / `stringSpacingAdjust`（図全体）と、各`notes`エントリの`sizeAdjust` / `labelSizeAdjust`（音1つだけ）は、プラグインの `styles.css` を直接編集する代わりに、ノート側から見た目を微調整するための機能です。ユーザーが本体のCSSファイルを触ることは想定していません。細かい色調整も同様に、CSSではなく各`notes`エントリの`color`で行います。

## 絶対モード / 相対モード

- **絶対モード:** `startFret` を指定した場合。または、`startFret` を省略していても`notes`に明示的な開放弦（`f: 0`）が含まれる場合（開放弦を含む形は物理的に移動できないため）。実際のコード名（例: `Cmaj7`）を自動生成し、左端が本当に0フレットの時だけナットを太線/二重線で描画します。
- **相対モード:** `startFret` を省略し、かつ開放弦を一切含まない場合。ムーバブルな（移動可能な）パターンとみなし、`notes`内の最小フレット（0とxを除く）を自動的に左端にし、フレット番号は表示せず、相対的なコード名（例: `□maj7`）を生成します。

## 度数の自動計算とルート強調

いずれかの音に `label: root` を指定すると、チューニングを基準に各音の度数（`1, b2, 2, m3, 3, 4, b5, 5, m6, 6, m7, M7`）を自動計算し、ラベルモードが`interval`ならその度数を表示します。ルートと同じ音（オクターブ違いを含む）は自動的に強調表示（形が変わる・色が変わる）されます。

この自動計算は1オクターブ内でしか判定できないため、9th/11th/13thなどのテンションは2nd/4th/b5と区別できません。正確に表示したい場合は、個々の音の`label`（例: `label: "9"`）、または図全体の`title`（例: `title: Cmaj9`）で明示的に上書きしてください。

## 複数の図を横に並べる

```fretboard```ブロックを空行を挟まず連続して書くと、内部的には各ブロックのコンテナ要素に `display: inline-block` を指定しており、横に並んで折り返し表示されることを狙っています。`size`を小さくして複数のコードダイアグラムを並べる、といった使い方を想定しています。

ただし、実際に横並びになるかどうかは**Obsidian側がMarkdownブロックをどうラップするか**（Reading ViewとLive Previewで構造が異なる場合がある）に依存し、プラグイン単体では確実に制御できないことがあります。もし横に並ばない場合は、Obsidianの **CSS snippets** 機能（設定 → 外観 → CSSスニペット、`.obsidian/snippets/` にファイルを置いて有効化）で調整できます。プラグイン本体の `styles.css` は直接編集せず、スニペット側で上書きしてください。以下は`.fretboard-block`要素を対象にしたスニペットの例です。

```css
/* .obsidian/snippets/fretboard-row.css */
.fretboard-block {
	display: inline-block !important;
	vertical-align: top;
}
```

それでも並ばない場合は、Obsidianが各コードブロックをさらに外側の要素でブロック表示にラップしている可能性があります。ブラウザの開発者ツール（Ctrl+Shift+I）で `.fretboard-block` の親要素を確認し、その要素にも同様のルールを追加してください。

## エラー処理

- **Local（ブロックのYAML）:** 構文エラーや不正な値がある場合、プラグインをクラッシュさせずに、そのコードブロック内に赤字でエラー内容を表示します。
- **Global（Vault共通ファイル）:** `fretboard-renderer.yaml` に構文エラーがある場合、Vault内の描画全体をクラッシュさせず、Obsidianの通知（Notice）で一度だけエラーを表示した上でSystem設定にフォールバックします。
- **未知のキー（タイポ検出）:** Local・Global問わず、`frets` を `flets` と書き間違えるなど認識できないキーがあった場合は、黙って無視せず（＝何も起きたように見えない状態にはせず）エラーとして表示します。`notes` / `barre` / `boxes` の各エントリ内のキーも同様にチェックされます。

## 開発コマンド

```bash
npm install      # 依存関係のインストール
npm run dev       # esbuildのウォッチビルド（開発中はこれを起動しておく）
npm run build     # 型チェック + 本番ビルド（main.js を生成）
npm test          # vitestによる単体テスト
```
