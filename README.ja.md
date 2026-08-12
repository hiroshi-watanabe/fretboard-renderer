# Fretboard Renderer

*[English README](README.md)*

Obsidianのノート内で、軽量なYAML記法からギターの指板図（フレットボード図）をSVGとして描画するプラグインです。コード進行の分析からペンタトニック／モード・スケールのポジション確認まで、最小限のタイピングで見栄えの良い図を作れることを目指しています。

![複数のコードダイアグラムが横に並んで表示されている様子](images/hero.png)

## はじめに

### インストール

Obsidianの設定 → コミュニティプラグイン → 閲覧 で **"Fretboard Renderer"** を検索してインストールしてください。（ソースから動かす場合は下記の[開発](#開発コマンド)を参照）

### 最初のダイアグラム

言語を`fretboard`にしたコードブロックを作り、表示したい音を`notes`に列挙するだけです。必須なのはこれだけです:

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

![上の例から描画されたEmコードのダイアグラム](images/basic-example.png)

`s`は弦番号（1が一番高音の弦）、`f`はフレット（`0`=開放弦、`x`=ミュート）です。1つの音に`label: root`を付けるだけで、コード名の推定とルート音のハイライトが自動的に行われます。

## 主な機能

### ルート音の自動ハイライトと度数表示
どれか1つの音に`label: root`を付けると、それを基準に各音の度数（1, b2, 2, m3, 3, ...）を自動計算し、ルートと同じ音（オクターブ違い含む）を自動的に別の形・色でハイライトします。手動でのスタイル指定は不要です。

### 絶対モード／相対（movable）モード
`startFret`を指定する（または開放弦を使う）と、`Cmaj7`のような実際のコード名が付いた固定ポジションの図になります。省略すると、ポジションに依存しないムーバブルなパターンとして扱われ、`□...`のような汎用的な表記になります（同じ形でも弾く位置によって実際のコードが変わるため）。相対モードでは`boxes`や`paths`と組み合わせて、スケールポジションを枠で囲んだり、運指の流れを線で示したりするとよく合います:

![点線の枠とドット同士を結ぶ線を使った、ムーバブルなペンタトニックのスケールボックス図](images/relative-scale-box.png)

### 複数の図を横に並べる
`diagrams:`を使うと、Cmaj7 → Dm7 → G7のようなコード進行を、Obsidianのブロックレイアウトに邪魔されずに1つのブロック内で横並びにできます:

````markdown
```fretboard
diagrams:
  - {title: Cmaj7, startFret: 0, size: 0.6, notes: [{s: 5, f: 3, label: root}, [4, 2], [3, 0], [2, 0]]}
  - {title: Dm7, startFret: 0, size: 0.6, notes: [{s: 4, f: 0, label: root}, [3, 2], [2, 1], [1, 1]]}
  - {title: G7, startFret: 0, size: 0.6, notes: [{s: 6, f: 3, label: root}, [5, 2], [4, 0], [3, 0], [2, 0], [1, 1]]}
```
````

### 横向き／縦向きの切り替え
Vault全体（設定画面、またはVault共通の`fretboard-renderer.yaml`）で切り替えるか、`orientation: vertical`で図1つだけ上書きできます。

![同じ形を横向きと縦向きで描画した様子](images/orientation.png)

### 必要に応じた細かい調整
音1つごとの`color`・`fillStyle`・`sizeAdjust`、セーハ（barre）、スケールポジションの枠（boxes）、ドット同士を結ぶ線（paths）、カスタムチューニング、音名／度数表示の切り替えなど。詳細は下記の[リファレンス](#リファレンス)を参照してください。

## 設定の概要

設定は3段階のレイヤーで構成され、後段ほど優先度が高くなります: **Local**（そのブロックのYAML） > **Global**（Vaultルートの`fretboard-renderer.yaml`、Vault全体の既定値用） > **System**（プラグインの設定タブ、インストール全体の既定値用）。ほとんどの場合はLocal（コードブロック内）と設定タブだけで十分です。Globalは、同じYAMLを毎回書かずにVault全体で見た目を揃えたいときに使います。詳細は[リファレンス](#リファレンス)を参照してください。

---

## リファレンス

以下はオプションの完全なリファレンスです。必要な項目まで読み飛ばしてください。

### 設定の3階層（System / Global / Local）

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

#### System（プラグイン設定画面）

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

`Label mode: note`は**絶対モード**（`startFret`を指定した場合、または明示的な開放弦`f: 0`を含む場合）でのみ音名を自動表示します。相対/移動モード（`startFret`省略かつ開放弦なし）では、実際の音はポジションに依存して確定しないため、`note`モードでも自動ラベルは表示されません（度数はどこで弾いても同じ関係になるため、`interval`モードはこの制約を受けません）。

#### Global（Vault共通のYAML設定ファイル）

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

#### Local（```fretboardブロックごとのYAML）

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

##### `notes`（必須）

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

##### そのほかのLocalオプション（すべて任意）

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

### 絶対モード / 相対モード

- **絶対モード:** `startFret` を指定した場合。または、`startFret` を省略していても`notes`に明示的な開放弦（`f: 0`）が含まれる場合（開放弦を含む形は物理的に移動できないため）。実際のコード名（例: `Cmaj7`）を自動生成し、左端が本当に0フレットの時だけナットを太線/二重線で描画します。
- **相対モード:** `startFret` を省略し、かつ開放弦を一切含まない場合。ムーバブルな（移動可能な）パターンとみなし、`notes`内の最小フレット（0とxを除く）を自動的に左端にし、フレット番号は表示せず、相対的なコード名（例: `□maj7`）を生成します。

### 度数の自動計算とルート強調

いずれかの音に `label: root` を指定すると、チューニングを基準に各音の度数（`1, b2, 2, m3, 3, 4, b5, 5, m6, 6, m7, M7`）を自動計算し、ラベルモードが`interval`ならその度数を表示します。ルートと同じ音（オクターブ違いを含む）は自動的に強調表示（形が変わる・色が変わる）されます。

この自動計算は1オクターブ内でしか判定できないため、9th/11th/13thなどのテンションは2nd/4th/b5と区別できません。正確に表示したい場合は、個々の音の`label`（例: `label: "9"`）、または図全体の`title`（例: `title: Cmaj9`）で明示的に上書きしてください。

### 複数の図を横に並べる（`diagrams`）

別々の```fretboardブロックを連続して書くだけでは、実際に横に並ぶかどうかは**Obsidian側がMarkdownブロックをどうラップするか**に依存し、CSSスニペットを当てても効かない場合があります（Obsidianが各コードブロックをさらに外側の要素でブロック表示にラップしていて、プラグイン側からは触れないケースがあるため）。

これを確実に行うため、**1つの```fretboardブロックの中に複数の図をまとめて書く`diagrams`記法**を用意しています。この場合、プラグインが1つのコードブロックのコンテナの中で横並びのレイアウト（flexbox）を自前で組み立てるため、Obsidianのブロックラップ方法に左右されず確実に横並びになります。

```fretboard
diagrams:
  - title: Cmaj7
    startFret: 0
    size: 0.6
    notes:
      - {s: 5, f: 3, label: root}
      - [4, 2]
      - [3, 0]
      - [2, 0]
  - title: Dm7
    startFret: 0
    size: 0.6
    notes:
      - {s: 4, f: 0, label: root}
      - [3, 2]
      - [2, 1]
      - [1, 1]
  - title: G7
    startFret: 0
    size: 0.6
    notes:
      - {s: 6, f: 3, label: root}
      - [5, 2]
      - [4, 0]
      - [3, 0]
      - [2, 0]
      - [1, 1]
```

- `diagrams`（配列）を使う場合、トップレベルに`notes`など他のキーを混在させることはできません（`diagrams`のみを持つブロックとして扱われます）。
- `diagrams`の各要素は、単一の図とまったく同じキー（`title`, `startFret`, `notes`, `size`, `orientation`など）を使えます。
- 折り返しはブラウザの幅に応じて自動的に行われます（横に入りきらなければ次の行へ）。
- エラーが起きた場合は`diagrams[0].notes`のように、どの図の何が問題かを示すエラーメッセージが表示されます。

### エラー処理

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

詳しいツールチェイン・依存関係・ソース構成は[doc/TECH_STACK.md](doc/TECH_STACK.md)（英語）を参照してください。

## ライセンス

[MIT](LICENSE)
