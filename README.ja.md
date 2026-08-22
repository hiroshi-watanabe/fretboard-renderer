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

### コードとして名付けるか、スケールとして名付けるか
デフォルトでは自動生成されるタイトルはコード／アルペジオとして命名されます（例: `Am7add11`）。同じ音をスケールとして読めば別の名前（マイナーペンタトニック等）になります。**Naming mode**を`scale`に切り替えると（設定画面、`fretboard-renderer.yaml`、またはブロック単位で`namingMode: scale`）、タイトルは常に最もマッチするスケール名になります（例: `A Minor Pentatonic`、ムーバブルなパターンなら`□ Minor Pentatonic`）——コピーしたフレーズ／ソロをバッキングコードのRootに対して逆算したいときに便利です。マッチしたスケールに含まれない音は経過音として`A Minor Pentatonic (+2)`のように併記され、指板図上でもゴースト表示されます。スケールの全リストとベストフィットの判定方法はリファレンスの[Naming mode](#naming-modeコード名スケール名の自動生成切り替え)を参照してください。

### 正確なコード名: sus・add・テンション・分数コード
自動生成タイトルは、ルート音と基本クオリティだけでなく実際のコード理論に基づいて推定します: 3度が無いときは`sus2`/`sus4`/パワーコード、7度が無いときは`add9`/`add11`、ドミナント7thでテンションが`7`を置き換える折りたたみ表記（`C9`, `C11`, `C13`）と`maj7`/`m7`にカッコで追加するテンション表記（`Cmaj7(9)`）の使い分け、`6`/`6/9`、そして最低音がルートでない場合の`/ベース音`表記（`Cmaj7/E`、相対モードなら`□m7/bVII`）まで対応します。表記の流儀そのものは、ポップス標準の**Standard**・理論重視の**Berklee**・Real Book形式の**Jazz**の3種類から**Chord symbol style**（設定画面、`fretboard-renderer.yaml`、またはブロック単位で`chordSymbolStyle`）で切り替えられます。詳しいルールは[Chord symbol style（コード表記スタイル）と高度なコード名推定](#chord-symbol-styleコード表記スタイルと高度なコード名推定)を参照してください。

### キーを基準に分析する（ローマ数字の度数表記）
`key: C`を指定し、**Root notation**を`degree`に切り替えると（設定画面、`fretboard-renderer.yaml`、またはブロック単位で`rootNotation: degree`）、タイトルのルート音（および分数コードのベース音）を実音名の代わりにそのキーからのローマ数字の度数で表記できます。例えば`key: C`のとき`Bm7(b5)`は`VIIm7(b5)`（vii°）になります。スケールのタイトルにも適用され、`VII Locrian`のように表記できます。`rootNotation`がデフォルトの`absolute`のままでも、`key`を指定するだけで図の左上に小さく「Key: C」ラベルが表示されます。詳しいルールは[Degree Name表記（keyを基準としたローマ数字）](#degree-name表記keyを基準としたローマ数字)を参照してください。

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
| String spacing | 弦間隔（px） | `24` |
| Fret spacing | フレット間隔（px） | `40` |
| Size | 上記のpx値（および後述のNote size/Label font size）全体に掛かる倍率。Vault全体を一括で縮小・拡大したいときに使う（例: `0.7`）。各図のLocal `size`はこれを上書きせず、さらに掛け算で乗算される | `1` |
| Label mode | `interval`（度数） / `note`（音名） / `none` | `interval` |
| Accidental | `sharp`（#） / `flat`（b） | `sharp` |
| Naming mode | `chord`（コード名を自動生成） / `scale`（最もマッチするスケール名を自動生成、[下記参照](#naming-modeコード名スケール名の自動生成切り替え)） | `chord` |
| Chord symbol style | `standard` / `berklee` / `jazz`、[下記参照](#chord-symbol-styleコード表記スタイルと高度なコード名推定) | `standard` |
| Omit notation | オン/オフ。理論上期待される構成音の省略を明示する（例: `C(omit3)`, `G7(omit3)`, `(omit5)`）。デフォルトはオフ（ギターでは5度の省略が非常に多く、常に表示すると煩雑になるため）。[下記参照](#chord-symbol-styleコード表記スタイルと高度なコード名推定) | オフ |
| Show inversions | オン/オフ。単なる転回形（コード自体の3度・5度・7度が最低音に来ているだけ、例: `C/E`）の場合にスラッシュ表記を表示するか。デフォルトはオフ（実際のコード譜では転回形をあえて明示しないパターンの方が多いため）。[下記参照](#chord-symbol-styleコード表記スタイルと高度なコード名推定) | オフ |
| Root notation | `absolute`（実音名） / `degree`（図の`key`を基準としたローマ数字の度数）、[下記参照](#degree-name表記keyを基準としたローマ数字) | `absolute` |
| Default shape | `circle` / `square` / `triangle` / `diamond`（◇） / `octagon`（八角形） / `doublecircle`（◎、外輪＋中心ドットの固定表示） / `x`（×字） / `none`（枠なし、ラベルのみ。[下記参照](#notes必須)） | `circle` |
| String note default shape | 同じ形状の選択肢 — `stringNotes`専用の独立したデフォルト（[下記参照](#弦ごとの注記stringnotes)）。ラベル文字はこの設定に関わらず常に控えめな色で描画される | `none` |
| Fill style | `filled`（黒塗り） / `outlined`（白抜き） | `outlined` |
| Nut style | `thick`（太線） / `double`（二重線） | `thick` |
| Fret numbering | `all` / `dotted`（音がある列のみ） / `inlay`（指板インレイ位置のみ: 3,5,7,9,12,15,17,19,21,24,...） / `none` | `inlay` |
| Default tuning | 低音弦から高音弦の順、カンマ区切り | `E,A,D,G,B,E` |
| Omitted string behavior | `open`（f:0扱い） / `muted`（f:x扱い） / `none`（描画しない） | `open` |
| Note size (px) | 音のドット（形）の基準半径。個々のノートの`sizeAdjust`（-5〜5）がここに加算される | `9` |
| Label font size (px) | 音のラベル文字の基準フォントサイズ。個々のノートの`labelSizeAdjust`（-5〜5）がここに加算される（4pxの下限あり、それ以上縮小しない） | `11` |

`Label mode: note`は**絶対モード**（`startFret`を指定した場合、または明示的な開放弦`f: 0`を含む場合）でのみ音名を自動表示します。相対/移動モード（`startFret`省略かつ開放弦なし）では、実際の音はポジションに依存して確定しないため、`note`モードでも自動ラベルは表示されません（度数はどこで弾いても同じ関係になるため、`interval`モードはこの制約を受けません）。

#### Global（Vault共通のYAML設定ファイル）

Vaultの**ルートディレクトリ**（`.obsidian/`の中ではない）に **`fretboard-renderer.yaml`** というファイルを作ると、Systemの値をVault単位で上書きできます。指定できるキーはSystemの表と同じです（`key`はLocal限定のオプションのため対象外——曲によってキーは変わる/転調するのが普通で、Vault共通のデフォルトにはそぐわないため）。

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

`startFret`を指定すると、`notes`/`boxes`/`paths`/`barre`内のフレット番号は「ポジション1からの相対値」として扱われます（下記の[`startFret`](#そのほかのlocalオプションすべて任意)参照）。そのため、この`notes`ブロックはそのまま、`startFret`の値を変えるだけで指板上のどこでも同じ形を再現できます:

```fretboard
title: Am Pentatonic (Box 1)
visible: 1-6
startFret: 5
frets: 4
boxes:
  - {frets: "1-4", style: dashed}
paths:
  - [[6,1], [6,4], [5,1], [5,3]]
notes:
  - {s: 6, f: 1, label: root, shape: square}
  - [6, 4]
  - {s: 5, f: 1}
  - {s: 5, f: 3, finger: 3, ghost: true}
```

##### `notes`（必須）

音の配置データの配列。オブジェクト形式と配列の省略記法の両方を使えます。

```yaml
notes:
  - {s: 6, f: 1, label: root, shape: square, finger: 1, ghost: false, class: "highlight"}
  - [6, 4]              # [s, f]
  - [5, 1, "root"]       # [s, f, label]
  - [5, 3, "3", "square", 3]  # [s, f, label, shape, finger]
  - {s: 4, f: 3, color: red, fillStyle: outlined, sizeAdjust: -3, labelSizeAdjust: 2}
```

| キー | 必須 | 説明 |
| :--- | :--- | :--- |
| `s` | ✅ | 弦番号（1〜N、1が最も高音の弦） |
| `f` | ✅ | フレット番号。`0`=開放弦、`1`以上=押弦、`x`=ミュート。**`0`と`x`はグリッドの列ではなく、常にグリッド外のヘッダ領域に描画される特殊記号**（フレット番号ラベルとしてカウントされない） |
| `label` | – | `root` を指定すると度数を自動計算。任意の文字列（`"maj7"`, `"9"` など）を書くと自動計算を無視してそのまま表示 |
| `shape` | – | `circle` / `square` / `triangle` / `diamond` / `octagon` / `doublecircle` / `x` / `none` — `none`は枠線を描画せず、ラベル（または運指番号、その他形の中に表示される値）だけを見せる。ラベルの有無に関わらず、背景として常に枠なしの塗りつぶし円を描画するため、完全に非表示にはならず、背後のフレット線・弦線と文字が交差して読みにくくなることもない。`x`は×字の形状で、実際に押弦された任意の位置に使える（ミュート弦`f: "x"`のヘッダーレーン専用の×マークとは別物）。`doublecircle`（◎）は外輪＋中心ドットの固定表示で、`x`と同様Fill Styleの影響を受けない |
| `finger` | – | 運指番号。ドットの外側に小さく表示 |
| `ghost` | – | `true`で点線・半透明表示 |
| `virtual` | – | `true`にすると、この音を実際に押弦・発音される音ではなく参照ピッチとして扱う。詳細は[仮想ノート](#仮想ノート)参照 |
| `class` | – | 任意のCSSクラス名（スニペットでのハイライト用） |
| `color` | – | この音1つだけの色をCSS色文字列（`red`, `#ff0000`, `var(--color-red)`等）で指定。System/GlobalのFill StyleやRoot強調色より優先される |
| `fillStyle` | – | `filled` / `outlined`。この音1つだけSystem/Globalの`Fill style`を上書き |
| `sizeAdjust` | – | 整数 -5〜5。この音1つだけの形の大きさを`Note size`からpx単位で微調整 |
| `labelSizeAdjust` | – | 整数 -5〜5。この音1つだけのラベル文字サイズを`Label font size`からpx単位で微調整 |
| `opacity` | – | 数値0〜1。この音の形＋ラベルをまとめて薄く表示する（例: `0.4`で経過音・任意音などを弱い情報として示す）。`ghost`とは独立した仕組みで、両方指定した場合は上書きし合わず重ね合わさる（掛け算） |

`color` / `fillStyle` / `sizeAdjust` / `labelSizeAdjust` / `opacity` / `virtual` はオブジェクト形式（`{s: ..., f: ...}`）でのみ指定できます。配列の省略記法（`[s, f, label, shape, finger]`）には含まれません。

Rootとして強調される音（`label: root`と同じ音、オクターブ違い含む）は、デフォルトではSystemのアクセントカラー（Obsidianテーマの`--interactive-accent`、既定では紫系）で強調表示されます。これは意図した既定動作です。特定の音を赤にしたい等、個別に色を変えたい場合は上記の`color`で上書きしてください。

##### そのほかのLocalオプション（すべて任意）

| キー | 型 | 説明 |
| :--- | :--- | :--- |
| `title` | String / `false` | 上部に表示するタイトル。省略時は自動生成（下記参照）。`title: false`は内部計算は行うが表示だけ抑制する — [コード進行シート](#コード進行シート実験的機能)参照 |
| `startFret` | Number | 描画領域の左端フレット番号。省略すると相対モードになる（下記参照）。指定した場合、ブロック内の他のフレット番号（`notes`, `boxes`, `paths`, `barre`）はすべて「ポジション1からの相対値」として解釈され、`absolute = f + max(startFret, 1) - 1`で実際のフレットに変換される。`0`（開放）と`x`（ミュート）は常に変換対象外。`startFret`が`0`または`1`のときは変換が発生しない（オフセット0）ため、実際のフレット番号をそのまま書く通常の絶対指定は影響を受けない |
| `frets` | Number | 描画するフレット幅（Systemの`Fret count`をこの図だけ上書き）。省略時は、押弦音がグリッドからはみ出さないよう`Fret count`より自動的に広がる。明示指定した場合は自動拡張されない |
| `orientation` | `horizontal` / `vertical` | この図だけ向きを上書き |
| `namingMode` | `chord` / `scale` | この図の自動生成タイトルだけ[Naming mode](#naming-modeコード名スケール名の自動生成切り替え)を上書き |
| `chordSymbolStyle` | `standard` / `berklee` / `jazz` | この図の自動生成タイトルだけ[Chord symbol style](#chord-symbol-styleコード表記スタイルと高度なコード名推定)を上書き |
| `omitNotation` | Boolean | この図の自動生成タイトルだけOmit notationを上書き。[Chord symbol style](#chord-symbol-styleコード表記スタイルと高度なコード名推定)参照 |
| `showInversions` | Boolean | この図の自動生成タイトルだけShow inversionsを上書き。[Chord symbol style](#chord-symbol-styleコード表記スタイルと高度なコード名推定)参照 |
| `rootNotation` | `absolute` / `degree` | この図の自動生成タイトルだけRoot notationを上書き。[Degree Name表記](#degree-name表記keyを基準としたローマ数字)参照 |
| `key` | String | この図が分析の基準とするトニック音名（例: `"C"`, `"F#"`）。Local限定。`rootNotation: degree`を機能させ、「Key: X」ラベルを表示する。[Degree Name表記](#degree-name表記keyを基準としたローマ数字)参照 |
| `omittedStringBehavior` | `open` / `muted` / `none` | この図の自動補完される弦（`notes`に書かれていない弦）だけ、System/Globalの`Omitted string behavior`を上書きする。特定の1本の弦だけ変えたい場合は、この設定ではなくその弦を明示的に書くこと（例: `{s: 4, f: 0, shape: none}`） |
| `size` | Number | この図全体の表示倍率（例: `0.6` で60%サイズ）。複数の図を小さく並べたい時に使う。System/Globalの「Size」設定を上書きするのではなく、それに掛け算で乗算される |
| `fretSpacingAdjust` | 整数 -5〜5 | フレット間隔（px）への微調整。`size`より先に加算される |
| `stringSpacingAdjust` | 整数 -5〜5 | 弦間隔（px）への微調整。`size`より先に加算される |
| `visible` | String | 描画する弦の範囲。例: `"1-4"` |
| `barre` | Array | `{fret, start, end}` でセーハ（バレー）を描画 |
| `boxes` | Array | 領域を枠で囲む。矩形形式`{frets: "5-8", strings: "1-6", style: "dashed"}`か、多角形形式`{points: [[6,5],[3,5],[3,8],[6,8]], style: "dashed"}`（3点以上の`[string, fret]`座標、三角形以上）のどちらか（`frets`/`strings`とは排他）。両形式とも`color`と`fill: true`（固定の低い不透明度での塗りつぶし）に対応。[下記参照](#多角形box-points-fill-color) |
| `paths` | Array | ドット同士を線で結ぶ。省略記法`[[6,5],[6,8],[5,5]]`（実線・デフォルト色）か、`{points: [[6,5],[6,8]], style: "dashed", color: "red", arrow: "single", curve: true}`のように個別にstyle等を指定できるオブジェクト形式。`style`は`solid`（デフォルト） / `dashed` / `thick`（バレー記号と同じ太さ・不透明度）。`arrow`は`none`（デフォルト） / `single` / `double`。`curve`は直線ではなく滑らかな曲線で結ぶ。[下記参照](#ドット同士を結ぶ線-style色矢印曲線) |
| `stringNotes` | Array | `{s, label?, shape?, ghost?, class?, color?, fillStyle?, sizeAdjust?, labelSizeAdjust?, side?}` — 特定のフレットではなく弦そのものに紐づく注記を、グリッドの外側に描画する。`side`は`trailing`（デフォルト——Horizontalで右側、Verticalで下側）または`leading`（Horizontalで左側、Verticalで上側）。`notes`と同じ形・スタイルの語彙とデフォルト値を使う。[下記参照](#弦ごとの注記stringnotes) |

`size` / `fretSpacingAdjust` / `stringSpacingAdjust`（図全体）と、各`notes`エントリの`sizeAdjust` / `labelSizeAdjust`（音1つだけ）は、プラグインの `styles.css` を直接編集する代わりに、ノート側から見た目を微調整するための機能です。ユーザーが本体のCSSファイルを触ることは想定していません。細かい色調整も同様に、CSSではなく各`notes`エントリの`color`で行います。

### 絶対モード / 相対モード

- **絶対モード:** `startFret` を指定した場合。または、`startFret` を省略していても`notes`に明示的な開放弦（`f: 0`）が含まれる場合（開放弦を含む形は物理的に移動できないため）。実際のコード名（例: `Cmaj7`）を自動生成し、左端が本当に0フレットの時だけナットを太線/二重線で描画します。
- **相対モード:** `startFret` を省略し、かつ開放弦を一切含まない場合。ムーバブルな（移動可能な）パターンとみなし、`notes`内の最小フレット（0とxを除く）を自動的に左端にし、フレット番号は表示せず、相対的なコード名（例: `□maj7`）を生成します。

### 度数の自動計算とルート強調

いずれかの音に `label: root` を指定すると、チューニングを基準に各音の度数（`1, b2, 2, m3, 3, 4, b5, 5, m6, 6, m7, M7`）を自動計算し、ラベルモードが`interval`ならその度数を表示します。ルートと同じ音（オクターブ違いを含む）は自動的に強調表示（形が変わる・色が変わる）されます。

この度数リストに加えて、表示上だけの調整が2つあります。ルート自身は `1` ではなく **`R`** と表示されます — 指板図上では運指番号にも`1`〜`4`を使うため、数字のままだと紛らわしいからです。また、コードがディミニッシュ（短3度＋減5度、他の7thを含まない）と認識された場合、本来`6`と表示されるはずの音（ルートから9半音、ディミニッシュ7thの`bb7`と異名同音）は代わりに **`bb7`** と表示されます。これはそのコードの実際の解釈により合った表記だからです。どちらもコードタイトルの生成ロジックやスケール判定には影響せず、それらは引き続き内部的に`1`/`6`をそのまま使います。

この自動計算は1オクターブ内でしか判定できないため、9th/11th/13thなどのテンションは2nd/4th/b5と区別できません。正確に表示したい場合は、個々の音の`label`（例: `label: "9"`）、または図全体の`title`（例: `title: Cmaj9`）で明示的に上書きしてください。

### Naming mode（コード名／スケール名の自動生成切り替え）

同じ音の集まりでも、コード／アルペジオとして読むか（例: `Am7add11`）、あるいは——弾いたフレーズ／ソロを指板図にコピーしてバッキングコードのRootを指定したときのように——それが最も由来していそうなスケールとして読むかで名前が変わります。**Naming mode**は自動生成タイトルがどちらを使うかを切り替えます:

- **`chord`**（デフォルト）: 従来通りコード／アルペジオ名を生成します。
- **`scale`**: 音の構成が下記のスケールと完全一致しなくても、常に最もマッチするスケール名を生成します（`chord`名へのフォールバックはしません）。マッチしたスケールに含まれない音は経過音として括弧書きで併記されます（例: `A Minor Pentatonic (+2)`、相対モードなら`□ Minor Pentatonic (+2)`。完全一致の場合は括弧書きなし）。該当する音は指板図上でも`ghost: true`を指定した場合と同じ見た目（ゴースト表示）になり、ひと目で経過音だと分かります。

設定画面、Vault共通の`fretboard-renderer.yaml`、またはブロックごとに`namingMode: scale`で切り替えられます。

**ベストフィットの判定方法:** 下記の各スケールについて、そのスケール自身の構成音のうち入力に含まれるもの1つにつき+1点、含まれないもの1つにつき-1点、そして**入力にあってそのスケールに含まれない音（経過音候補）1つにつき-1点**でスコアを計算します。最もスコアの高いスケールを採用し、同点の場合はより音数の少ない（シンプルな）スケールを優先します。経過音にもペナルティを課しているのは、そうしないと「1音だけ経過音として残す小さいスケール」が「その音も含めて過不足なく説明できるスケール」に音数タイブレークで勝ってしまうためです（例: マイナーペンタトニック+自然2度という入力では、2度を経過音として残す`Minor Pentatonic`ではなく、その音も含めて説明できる`Dorian`が選ばれるべき）。この3項スコアでも、完全一致するスケールは常にそれ単体で最高スコアとなる性質は保たれます（音数の多いスーパーセットは自身の未使用音のペナルティで、音数の少ないサブセットは経過音のペナルティで、それぞれ必ず下回るため）。

- **`scaleAnalyze: true`**（Local限定、デフォルトoff）: 1位の結果だけでなく、上記スコアリングによる**上位5件**をタイトルに複数行で表示します（`1. E Dorian`、`2. E Aeolian (Natural Minor)`、…）。僅差の候補を見比べたいときに使います。

対応スケールは、西洋音楽の標準的なスケール群に加え、日本の平調子（Hirajoshi）・琉球（Ryukyu）の2つの五音音階ファミリーを、伝統的に名前が付いているものだけでなく**全展開形（モード）**まで網羅しています——本プラグインではRootを自由に指定できるため、同じ音の集まりでも起点を変えれば度数集合が変わり、下表の別の行になるからです:

| カテゴリ | スケール |
| :--- | :--- |
| ペンタトニック（全5展開） | Major Pentatonic, Minor Pentatonic, Suspended Pentatonic (Mode 2), Phrygian Pentatonic (Mode 3), Mixolydian Pentatonic (Mode 4) |
| ドミナントペンタトニック（全5展開） | Dominant Pentatonic (Mode 1–5) |
| 和音階 — 平調子(Hirajoshi)系（全5展開） | Hirajoshi, Iwato (Hirajoshi Mode 2), Hon-Kumoi-joshi (Hirajoshi Mode 3), In Sen / Kumoi / Miyakobushi (Hirajoshi Mode 4), Lydian Pentatonic / Chinese (Hirajoshi Mode 5) |
| 和音階 — 琉球(Ryukyu)系（全5展開） | Ryukyu, Ryukyu (Mode 2), Ryukyu (Mode 3), Hindu Pentatonic (Ryukyu Mode 4), Ryukyu (Mode 5) |
| ダイアトニックモード（全7展開） | Ionian (Major), Dorian, Phrygian, Lydian, Mixolydian, Aeolian (Natural Minor), Locrian |
| メロディックマイナー系（全7展開） | Melodic Minor, Lydian Dominant, Altered (Super Locrian), Half-Diminished (Locrian ♮2), Dorian b2, Lydian Augmented, Mixolydian b6 |
| ハーモニックマイナー系（全7展開） | Harmonic Minor, Phrygian Dominant, Locrian ♮6, Ionian #5, Dorian #4, Lydian #2, Ultralocrian (Altered Diminished) |
| ハーモニックメジャー系（全7展開） | Harmonic Major (Mode 1–7) |
| ダブルハーモニック系（全7展開） | Double Harmonic Major (Mode 1–7)（別名: ビザンチン/アラビアン/ジプシーメジャースケール） |
| ナポリタンメジャー系（全7展開） | Neapolitan Major (Mode 1–7) |
| 対称音階 | Whole Tone（展開形は実質1種類のみ）, Augmented（2種類）, Diminished Whole-Half / Half-Whole（各2種類） |
| ビバップ（各8展開） | Bebop Dominant (Mode 1–8), Bebop Major (Mode 1–8) |
| その他 | Blues, Major Blues |

上記の新規ファミリー（ハーモニックメジャー、ダブルハーモニック、ナポリタンメジャー、ドミナントペンタトニック）は、確度の高い親スケール名のみ採用し、派生モードの俗称は情報源によって表記が割れるため断定を避け、`Harmonic Major (Mode 2)`のように機械的な連番表記にしています。「陰音階（In Sen）」は既存の平調子系の1展開形と度数集合が完全に一致することが判明したため、別エントリではなくその行の別名として統合しました。

その他の日本の伝統音階（都節、田舎節、律、民謡音階など）は未対応です。

### Chord symbol style（コード表記スタイル）と高度なコード名推定

自動生成タイトルは、ルート音と基本クオリティだけでなく、構成音から実際のコード理論に基づいた表記を組み立てます:

- **3度が無い場合:** 4度があれば`sus4`、2度があれば`sus2`、どちらも無ければパワーコードの`5`。この場合でも7度は黙って捨てられない — 例えばルート+5度+m7（3度もsusの代替も無し）は、単なる`5`ではなく`7`として命名される。特に`sus4`の場合、下記のテンション折りたたみルールと同様に、ドミナント7thが自然9度・13度を`9sus4`/`13sus4`として折りたたむ（無ければ`7sus4`）— sus4の4度と9度は別の枠だからである（`sus2`では2度自体が9度と同じ音のため、7thは折りたたまず`7sus2`とそのまま連結する）。6度も同様に黙って捨てられない: `6sus4`、`6sus2`、susの代替が両方とも無い場合は`5(add6)`（Omit notationオフ）または`6(omit3)`（オン。`(omit3)`自体がすでに「3度の役割が埋まっていない」ことを示すため、`5`に括弧書きで追加する代わりに`6`を主表記に昇格させる）。
- **7度が無い場合:** 追加された音は`add9` / `add11`として付加音扱いになる。
- **7度があり、ドミナント（長3度+短7度）の場合:** 9度が含まれている場合のみ、最も高いテンション（9度/11度/13度）で`7`を上書きし`C9`/`C11`/`C13`とまとめる。9度が無いまま11度・13度だけが単独で追加されている場合はまとめず、`7`を残したままカッコで付与する（`C7(11)`, `C7(13)`）。
- **7度があり、`maj7`または`m7`の場合:** 下位テンションの有無に関わらず基本の四和音（`Cmaj7`, `Cm7`）は常に維持し、最も高いテンションをカッコで括って付与する（例: `Cmaj7(9)`, `Cm7(11)`。jazzスタイルではカッコなしで連結: `CΔ79`, `C-711`）。
- **オルタードテンション（`b9` / `#9` / `#11` / `b13` / `b5`）:** 上記のどのケースでも（`sus4`/`sus2`/パワーコードを含む）、独立した装飾として末尾に追加され、黙って無視されることはない。この1オクターブの度数体系ではそれぞれ別の度数とラベルを共有しているため、多くは何らかの条件でオルタードとして読むかどうかを判定する: `b9`（`b2`度）はそのような衝突が無いため常にオルタード9thとして扱われる。`#9`（`m3`度）は長3度も同時に含まれる場合に限り`#9`として読まれ、そうでなければ単にそのコードの短3度。`#11`（`b5`度）は5度が同時に含まれる場合に限りオルタードテンションとして読まれ、そうでなければコード自体のフラット5度として扱われる。`b13`（`m6`度）は、5度**または**7th（m7/M7）のいずれかが同時に含まれていれば`b13`として読まれる — ギターでは、オルタードテンションを保持したまま押弦の都合上5度をミュートする7thコードのボイシングが非常によくあるため、7thの存在だけでも十分な判定材料になる。5度も7thも無い場合にのみ、その`m6`は`#5`＝オーギュメントとして解釈される（[度数の自動計算とルート強調](#度数の自動計算とルート強調)参照）。例: `C9(b5)`, `Cm7(9, b5)`, `Csus4(b13)`, `G7(#9, b13)`（jazzスタイルでは`C9b5`, `Csus4b13`）。
- **6thコード:** 6度があり7度が無ければ`6`、さらに2度もあれば`6/9`（このケースは常にカッコなし）。
- **Omit notation**（デフォルトオフ。設定画面参照）: 理論上期待される構成音が実際には含まれていないことを明示する。`(omit3)`は3度の役割を何も満たしていない場合 — パワーコードの`5`はそのまま`C(omit3)`に置き換わり（`C5(omit3)`ではない。`(omit3)`自体がすでに「Root+5度のみ」を示すため）、7thコードを3度なしで弾いている場合は`7`/`maj7`はそのまま残して末尾に`(omit3)`を追加する（`G7(omit3)`）。6度がある場合も同じ「置き換え」の考え方に従い、`5(add6)(omit3)`ではなく`6(omit3)`となる。`(omit5)`は5度系の度数（通常・フラット・シャープいずれも）が一切含まれない場合。`(omit1)`はRootが[仮想ノート](#仮想ノート)（後述）としてのみ与えられ、実際に押弦された音の中にRootが1つも無い場合。これらは常にカッコ付きで表記される — jazzスタイルで通常テンションがカッコなしになる場合でも例外で、テンション記号と違い英単語であるため。`(omit1)`はスラッシュ表記より前に置かれる（例: `G7(#9, b13)(omit1)/B`）。
- **分数コード:** 実際に鳴っている最も低い音がルートでない場合、`/`に続けてベース音を付与する。絶対モードでは絶対音名（例: `Cmaj7/E`）、相対モードでは実際のピッチが確定しないため、ルートを「I」としたローマ数字の度数表記になる（例: `□m7/bVII`）。[仮想ノート](#仮想ノート)は最低音の判定に含まれない。**Show inversions**（デフォルトオフ）は、ベース音が単なる転回形 — コード自体の3度・5度・7度が最低音に来ているだけで新たな和声情報を追加しない場合 — にこの表記を出すかどうかを制御する。実際のコード譜では転回形をあえて明示しないパターンの方が多いため。ベース音がコード自体の構成音に含まれない場合（9度などのテンション音や無関係な音、真の分数コード）は、この設定に関わらず常に表示される — コード記号だけでは伝わらない情報のため。

**Chord symbol style**は、上記のルールとは独立に表記の流儀を切り替えます:

| | Standard（Pop標準） | Berklee | Jazz（Real Book形式） |
| :--- | :--- | :--- | :--- |
| マイナー | `Cm7` | `C-7` | `C-7` |
| ハーフディミニッシュ | `Cm7(b5)` | `C-7(b5)` | `Cø7` |
| ディミニッシュ7th | `Cdim7` | `Cdim7` | `C°7` |
| オーギュメント | `Caug` | `C+` | `C+` |
| メジャー7th | `Cmaj7` | `Cmaj7` | `CΔ7` |
| テンション追加 | `Cmaj7(9)` | `Cmaj7(9)` | `CΔ79`（カッコなし） |

設定画面、Vault共通の`fretboard-renderer.yaml`、またはブロックごとに`chordSymbolStyle: jazz`のように指定して切り替えられます。

### Degree Name表記（keyを基準としたローマ数字）

**Root notation**（デフォルト`absolute`、または`degree`）は、自動生成タイトルのルート音（および分数コードのベース音があればそれも）を、コードの機能分析（例:「Cメジャーにおけるvii°」）やモーダルなスケール分析（「Cメジャーの第7モード＝B Locrian」）向けに表記する仕組みです。これは相対/movableモードの図が既に持っているローマ数字のスラッシュ・ベース表記（`□m7/bVII`、あくまでその図**自身のRoot**が基準）とは別の仕組みです。Degree Name表記はユーザーが明示的に指定した`key`を基準とし、絶対モードの図でも機能します。

- **`key`**（Local限定のYAMLフィールド。例: `key: "C"`, `key: "F#"`）: この図が分析の基準とするトニック。指定するだけで、`rootNotation`の値に関わらず図の左上に小さく「Key: C」ラベルが表示される。
- **`rootNotation: degree`**が実際にルートをローマ数字（`I, bII, II, bIII, III, IV, bV, V, bVI, VI, bVII, VII`。相対モードのスラッシュ・ベースと同じ表）で表記するのは、`rootNotation`が`degree`であること・その図に`key`が設定されていること・その図が**絶対モード**であることの**すべて**を満たす場合のみ。相対/movableモードの図は実際に鳴っている絶対ピッチ自体が確定しないため、`key`/`rootNotation`の値に関わらず常に`□`にフォールバックする。他の条件のいずれかが欠けている場合も実音名にフォールバックする。
- 分数コードのベース音も同じ考え方で表記される — コード自身のRootからではなく`key`を基準としたローマ数字になるため、タイトル全体が一貫してkey基準になる（例: `VIIm7(b5)/I`、ベースがキーのトニック自身の場合）。
- `namingMode: scale`のタイトルにも適用される: `key: C`＋B Locrianの形は、`B Locrian`ではなく`VII Locrian`と表記される。

```fretboard
key: "C"
rootNotation: degree
startFret: 0
notes:
  - {s: 2, f: 0, label: root}
  - {s: 4, f: 0}
  - {s: 1, f: 1}
  - {s: 5, f: 0}
```

これは`Key: C`ラベル付きで`VIIm7(b5)`とレンダリングされます — `key`/`rootNotation`を指定しない同じ形は`Bm7(b5)`になります。

### 仮想ノート

`G7(#9, b13)`のようなオルタード・ドミナントコードは、Rootを省略して弾かれることが非常によくあります — 押弦が難しく、テンションノートの方が色彩を担うためです。しかし度数計算のためには、Rootをどこかに指定する必要があります。音に`virtual: true`を付けると、その音は実際に押弦・発音される音として扱われなくなります — 図形（ドット）は一切描画されず、そのフレット位置に算出済みラベルが丸括弧付きで表示されるだけです（例: 仮想Rootなら`(R)`、仮想5度なら`(5)`）。それでいて度数・コード名の計算には、通常の音と全く同じように寄与します:

```fretboard
omitNotation: true
notes:
  - {s: 6, f: 3, label: root, virtual: true}
  - [5, 2]
  - [4, 1]
  - [3, 3]
  - [1, 1]
```

これは`G7(#9, b13)(omit1)/B`とレンダリングされます — 仮想Rootが基準ピッチを確立し（これにより`#9`/`b13`の計算が可能になる）、`(omit1)`はRoot自体が実際には押弦されていないことを示し（ここでは[Omit notation](#chord-symbol-styleコード表記スタイルと高度なコード名推定)がオンのため）、スラッシュは実際に最も低く鳴っている音を示します。

仮想ノートの挙動:
- 図形も指番号も描画されない — ラベルを`(...)`で囲んだ、控えめな色のテキストのみ。演奏される音と間違えないようにするため。
- 「最も低く鳴っている音」（分数コードのベース音判定）からは除外される。
- グリッドのサイズ計算（`frets`の自動拡張、`visible`など）には通常の音と同様に関与する。
- オブジェクト形式（`{s: ..., f: ..., virtual: true}`）でのみ指定可能 — 配列の省略記法には含まれない。

### 多角形box: points, fill, color

`boxes`は互いに排他な2つの形式に対応しています——従来の矩形（`frets`/`strings`）か、3点以上の`[string, fret]`座標を頂点とする多角形`points`（三角形から任意の形まで）か:

```fretboard
visible: 1-6
boxes:
  - points: [[1, 1], [3, 1], [3, 3], [6, 3], [6, 6], [1, 6]]
    style: dashed
notes:
  - {s: 6, f: 1, label: root}
  - [3, 3]
  - [1, 6]
```

`points`の座標系は`paths`の`points`と全く同じです——`notes`と同じ実フレット位置基準ですが、整数だけでなく任意の数値を許容するため、例えば`4.5`はフレット4と5の境界線上にきっちり乗ります。これにより`points`は矩形形式の完全な上位互換になります: `{frets: "1-4", strings: "2-5"}`は`{points: [[1.5, 0.5], [5.5, 0.5], [5.5, 4.5], [1.5, 4.5]]}`として全く同じ形を再現できます。

どちらの形式も以下に対応します:
- **`color`**: 枠線の色を上書きする。`fill`指定時は塗りの色にもなる。
- **`fill`**: `true`/`false`（デフォルト`false`、従来通り）。`true`にすると固定の低い不透明度で塗りつぶす——半透明のハイライトであり、下の音やグリッドを覆い隠す不透明な塊にはならない。

矩形・多角形を問わず、すべてのboxは鋭角ではなく、わずかに丸みを帯びたコーナー（凹んだ角、例えばL字型の内側の角も含む）で描画されるようになりました。これは設定で変更できません。

### ドット同士を結ぶ線: style・色・矢印・曲線

`paths`の各要素は、従来通りの`[string, fret]`座標配列の省略記法（実線・デフォルト色）か、`points`に座標配列を渡しつつ`style`/`color`/`arrow`/`curve`を個別指定できるオブジェクト形式のどちらかで書けます:

- **`style`**: `solid`（デフォルト） / `dashed`（点線） / `thick`（バレー記号と同じ太さ・不透明度の実線。斜めのバレーを表現したい場合や、複数のドットのまとまりを1組として強調したい場合に使う）。
- **`color`**: この線1本だけのストロークの色（および矢印がある場合は矢じりの色）をCSS色文字列で上書きする（ノートの`color`と同じ規約）。`style`とは独立に指定できる。
- **`arrow`**: `none`（デフォルト） / `single`（`points`の最後の点にだけ矢じり） / `double`（両端に矢じり）。向きを指定する独立したフィールドは無く、`single`は常に「`points`に書いた順序の後ろの点」を指す——逆向きにしたい場合は`points`を逆順に書く。
- **`curve`**: `true`にすると直線ではなく滑らかな曲線で結ぶ。点が2つだけなら一定量の弓なり、3点以上なら全ての点を通るスプライン曲線になる（近似ではなく指定した点を必ず通る）。

```fretboard
visible: 3-6
notes:
  - {s: 6, f: 1, label: root}
  - [5, 3]
  - [4, 3]
  - [3, 1]
paths:
  - {points: [[6, 1], [3, 1]], style: thick}
  - {points: [[5, 3], [4, 3]], style: dashed, color: red, arrow: single, curve: true}
```

### 弦ごとの注記（`stringNotes`）

特定のフレットではなく**弦そのもの**に紐づく注記を、グリッドの外側の末端に描画します——Horizontal Orientationではグリッドの右側、Verticalでは下側（開放弦/ミュート弦のヘッダーレーンと、ちょうど反対側）:

```fretboard
startFret: 10
visible: 3-6
notes:
  - {s: 6, f: 10, finger: 1}
  - {s: 5, f: 12, finger: 4}
  - {s: 4, f: 11, finger: 2}
  - {s: 3, f: 12, finger: 3}
stringNotes:
  - {s: 5, label: "4"}
  - {s: 3, label: "3"}
```

各要素は`s`（必須）に加え、`notes`と全く同じ形・スタイルの語彙——`label`, `shape`, `ghost`, `class`, `color`, `fillStyle`, `sizeAdjust`, `labelSizeAdjust`——を持ち、同じSystem/Globalのデフォルト値を使うため、図の他の部分と見た目が一貫します。`notes`と違い`f`（フレット/ピッチに紐づかない）が無いため、自動計算されるラベル（`root`概念）も無く、`finger`フィールドも無い（この機能自体の`label`がすでにその役割を果たすため、例: `label: "4"`）。オブジェクト形式のみ——`barre`/`boxes`と同じ理由で、1つの図に数個程度しか置かない想定のため配列の省略記法は用意していません。

`shape`のデフォルトは通常の`notes`用「Default shape」ではなく、`stringNoteDefaultShape`（既定`none`）です。通常のノートと違い、`shape: none`の場合は`Fill Style`に関わらず背景の円を一切描画しません（純粋なテキストのみ）——実在のノートの`shape: none`は位置を常に視認できる必要があるため見えない縁取りの背景を常に描画しますが、`stringNotes`は実在のピッチではないためその制約がありません。`Fill Style`が意味を持つのは`shape`を`circle`/`square`/`triangle`に明示的に上書きした場合のみです。ラベル文字は常に控えめな色で描画されます。

`side: "leading"`を足すと反対側——Horizontal Orientationではグリッドの左側（開放弦/ミュート弦のヘッダーレーンよりさらに外側）、Verticalでは上側——に描画できます。`visible`で表示弦を絞り込んだ図（例: `visible: "4-6"`）で、実際の弦番号をラベル表示したい場合などに便利です（`visible: "4-6"`だけでは、一番上の行が弦4であって弦1ではないことが見た目では分かりません）:

```fretboard
startFret: 0
visible: "4-6"
notes:
  - {s: 5, f: 3, label: root}
  - {s: 4, f: 2}
  - {s: 6, f: 7}
stringNotes:
  - {s: 6, label: "6", side: leading}
  - {s: 5, label: "5", side: leading}
  - {s: 4, label: "4", side: leading}
```

さしあたっての用途はバレーコードの主要な形ではカバーしきれない指番号の手動配置ですが、意図的に汎用的な設計にしてあります——弦ごとの短いラベルや形であれば何でも構いません。将来的な自動指番号機能の出力先となることも見込んだ布石でもあります。

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
- 上記の配列形式は、実は`diagrams: {fretboards: [同じ配列]}`というオブジェクト形式の省略記法です。オブジェクト形式で書けば、`size`を同じ階層に追加して全エントリ共通のデフォルトにできます（1つ1つに書く手間を省けます）:
  ```fretboard
  diagrams:
    size: 0.6
    fretboards:
      - {title: Cmaj7, startFret: 0, notes: [...]}
      - {title: Dm7, startFret: 0, notes: [...]}
  ```
  各エントリ自身の`size`は、このデフォルトと合成されるのではなく上書きします。

### コード進行シート（実験的機能）

**実験的機能——文法は今後変わる可能性があります。** `diagrams`は上記の配列に加えて、**オブジェクト形式**でも書けます。コード進行のヘッダー行と、それに対応する指板図を構造的に結びつけて描画できます。教則本によくある「コード名の行＋その下に対応する指板図」というレイアウトです。五線譜そのものを目的とはしません（それが必要な場合は[abcjs](https://github.com/paulrosen/abcjs)等と組み合わせてください）——あくまで進行の行と指板図がレイアウト崩れなく対応するための最小限の仕組みです。

```fretboard
diagrams:
  progression:
    - [Cmaj7]
    - [Dm7, G7]
  fretboards:
    - - {startFret: 0, title: false, notes: [{s: 5, f: 3, label: root}, {s: 4, f: 2}, {s: 2, f: 0}]}
    - - {startFret: 0, title: false, notes: [{s: 5, f: 5, label: root}, {s: 4, f: 3}, {s: 3, f: 5}]}
      - {startFret: 0, title: false, notes: [{s: 3, f: 0, label: root}, {s: 2, f: 0}, {s: 1, f: 1}]}
```

- `progression`は「小節」の配列。**1コードしか無い小節も含めて、各小節は必ずその小節専用の配列として書きます**（上記の`[Cmaj7]`のように）。1小節に複数スロットを並べると、小節内でのコードチェンジになります（上記の`[Dm7, G7]`を参照）。角括弧を省いたフラットな配列（例: `progression: [Cmaj7, Dm7]`）は、意図的にサポートしません——「Cmaj7とDm7、それぞれ1小節ずつの2小節」なのか「1小節の中でCmaj7からDm7へコードチェンジ」なのかが見た目だけでは判別できず紛らわしいためです。前者は`[[Cmaj7], [Dm7]]`、後者は`[[Cmaj7, Dm7]]`と書いてください。
- スロットの値は、明示的なコード名文字列 / `_N`（このスロットの文字列を`fretboards`側のダイアグラムから自動導出する。`N`は進行全体を通したこのスロット自身の位置と一致していなければならない） / `%`（直前のスロットの解決済みテキストをそのまま複製）のいずれかです。
- `fretboards`は`progression`の小節と添字が1:1対応する配列で、`fretboards[i]`の要素数は`progression[i]`のスロット数と厳密に一致している必要があります。各要素（セル）はダイアグラム1個（省略記法）、またはダイアグラムの配列（同じコードを複数の声部で並べて見せる場合）です。
- `variations`（`fretboards`と排他）は、共通のヘッダーの下に複数のパス（行）をまとめて積みます——`[{fretboards: [...]}, {fretboards: [...]}, ...]`。同じ進行を異なるポジションで示すコード・メロディ練習などに使えます。
- シートの共通ヘッダーは、個々のダイアグラム自身のtitleを勝手に非表示にはしません。重複表示したくない場合は各ダイアグラムに`title: false`を指定してください。`title: "$N"`は、そのダイアグラムをprogressionのスロットN（`_N`）の明示的な供給元として指名し（デフォルトの供給元＝1本目のパスの対応するダイアグラムを上書きする）、同時にそのダイアグラム自身のtitle表示も抑制します。
- `size`（`progression`/`fretboards`/`variations`と同階層）は、このシート内の全セルに適用されるデフォルトの`size`を設定します——1つ1つのセルに同じ`size`を書く手間を省けます。セル自身が`size`を明示している場合はそちらが優先されます（掛け合わされることはありません）。

### エラー処理

- **Local（ブロックのYAML）:** 構文エラーや不正な値がある場合、プラグインをクラッシュさせずに、そのコードブロック内に赤字でエラー内容を表示します。
- **Global（Vault共通ファイル）:** `fretboard-renderer.yaml` に構文エラーがある場合、Vault内の描画全体をクラッシュさせず、Obsidianの通知（Notice）で一度だけエラーを表示した上でSystem設定にフォールバックします。
- **未知のキー（タイポ検出）:** Local・Global問わず、`frets` を `flets` と書き間違えるなど認識できないキーがあった場合は、黙って無視せず（＝何も起きたように見えない状態にはせず）エラーとして表示します。`notes` / `barre` / `boxes` の各エントリ内のキーも同様にチェックされます。

## 開発コマンド

```bash
npm install      # 依存関係のインストール
npm run dev       # esbuildのウォッチビルド（開発中はこれを起動しておく）
npm run build     # 型チェック + 本番ビルド（main.js を生成）
```

パース・描画・音楽理論のコアロジックとそのテストスイートは別パッケージ [fretboard-renderer-core](https://github.com/hiroshi-watanabe/fretboard-renderer-core) に切り出されており、このリポジトリはそれを利用する側です。詳しいツールチェイン・依存関係・ソース構成は[doc/TECH_STACK.md](doc/TECH_STACK.md)（英語）を参照してください。

## ライセンス

[MIT](LICENSE)
