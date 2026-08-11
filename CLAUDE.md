# Obsidian Plugin Development Prompt: Fretboard SVG Renderer

## 1. Overview & Philosophy
ObsidianのMarkdownコードブロック内で、YAMLベースの軽量な記法を用いてギターの指板図（Fretboard）をSVGとして動的にレンダリングするプラグインを作成してください。
**Philosophy:** このプラグインの目標は「コード進行の分析から、ペンタトニックやモード・スケールのポジション確認まで、ギター学習に必要なあらゆる図解を **"最小のタイピング"** と **"最高の見栄え"** で実現する最強のツール」にすることです。
目指すビジュアルは無駄のないクリーンなデザインです（参考画像 "Oolimo_Cadd9.png" のような、指定フレットの太いナット線、丸や四角の図形、度数や音名の表示を備えたもの）。

## 2. Configuration Layers (System / Global / Local)
設定は3段階のレイヤーで構成され、**後段ほど優先度が高くなります（Local > Global > System）**。同じキーが複数レイヤーで指定された場合、より優先度の高いレイヤーの値で上書きしてください。

| レイヤー | 定義場所 | スコープ | 優先度 |
| :--- | :--- | :--- | :--- |
| **System** | Obsidianのプラグイン設定画面 (Settings UI) | インストール単位（Vault内の全```fretboardブロック） | 低（フォールバック） |
| **Global** | Vaultルートの `fretboard-renderer.yaml` | そのVault内の全```fretboardブロック | 中 |
| **Local** | 各```fretboardコードブロック内のYAML | そのブロック1つのみ | 高（最終上書き） |

### 2.1 System Settings（プラグインのデフォルト設定）
Obsidianのプラグイン設定画面から、以下の項目をデフォルト値として設定可能にしてください。Global/Localで指定されなかった場合の最終フォールバックです。

#### [Layout & Dimensions]
*   **Orientation:** `horizontal` (デフォルト) / `vertical`
*   **Strings:** デフォルト `6`
*   **Fret Count:** デフォルト `4` (描画するフレット幅)
*   **String Spacing & Fret Spacing:** SVG描画時のピクセル幅

#### [Display & Style]
*   **Label Mode:** `interval` (度数/デフォルト) / `note` (音名) / `none`。`note`は絶対モード（4.1節: `startFret`指定、または明示的な開放弦を含む）の時だけ音名を自動表示する。相対/移動モードでは実際の音がポジションに依存し確定しないため、`note`モードでも自動ラベルは表示しない（度数は形が決まれば常に一意なので`interval`モードはこの制約を受けない）。
*   **Accidental:** `sharp` (#) / `flat` (b)
*   **Default Shape:** `circle` (〇/デフォルト) / `square` (□) / `triangle` (△)
*   **Fill Style:** `filled` (黒塗り・文字白/デフォルト) / `outlined` (白抜き・文字黒)
*   **Nut Style:** `thick` (太線/デフォルト) / `double` (二重線)。ナット（0フレット位置）の線の描画スタイル。
*   **Fret Numbering:** `all` (全て表示) / `dotted` (ドットが配置されているフレットのみ表示/デフォルト) / `inlay` (指板インレイの位置のみ表示。3, 5, 7, 9, 12, 15, 17, 19, 21, 24, ... という標準的なギターのポジションマーク位置。音の有無に関わらず常にこの位置を表示する) / `none` (非表示)

#### [Tuning & Fallback]
*   **Default Tuning:** `E,A,D,G,B,E` (カンマ区切り、低音弦から高音弦の順。絶対ピッチ基準)
*   **Omitted String Behavior:** `open` (f: 0 補完/デフォルト) / `muted` (f: x 補完) / `none` (何も描画しない)。記述が省略された弦のフォールバック動作。

#### [Note Appearance]
*   **Note Size (px):** 音のドット（形）の基準半径。デフォルト `10`。個々のノートの`sizeAdjust`（-5〜5）がこの値に加算される。
*   **Label Font Size (px):** 音のラベル文字の基準フォントサイズ。デフォルト `10`。個々のノートの`labelSizeAdjust`（-5〜5）がこの値に加算される。

これらはユーザーがプラグイン本体のCSSファイルを直接編集することを想定していないため、見た目の基準値をSystem設定のpx値として持たせ、細かい調整はLocal（ノート単位）のAdjustオプションで行う設計とすること。

### 2.2 Global Settings（Vault共通のYAML設定ファイル）
Vaultのルートディレクトリに **`fretboard-renderer.yaml`** というファイルを置くことで、そのVault内の全```fretboardブロックに適用されるデフォルト値を、System設定より優先して上書きできます。

*   指定できるキーはSystem設定と全く同じ（2.1節の全項目: orientation, strings, fretCount, stringSpacing, fretSpacing, labelMode, accidental, defaultShape, fillStyle, nutStyle, fretNumbering, defaultTuning, omittedStringBehavior）。
*   ファイルが存在しない場合、またはキーが省略されている場合は、Systemの値がそのまま使われる。
*   ファイルの構文エラーや不正な値がある場合は、プラグインやVault内の描画をクラッシュさせず、Obsidianの通知（Notice）で一度だけエラー内容を表示した上で、System設定にフォールバックして動作を継続すること（個々のブロックにはエラーを出さない。原因がVault共通ファイル側にあるため）。
*   ファイルを編集して保存すると、次にレンダリングされるブロックから自動的に反映される（プラグインの再起動やリロードは不要）。

【記述例: Vaultルートの `fretboard-renderer.yaml`】
```yaml
orientation: vertical
fretCount: 5
labelMode: note
```

### 2.3 Local Settings（```fretboardブロックごとのYAML）
各ノート内の```fretboardコードブロックに直接書くYAMLです。System・Globalの値を最終的に上書きする、最も優先度の高い設定です。書式は3節を参照してください。

## 3. Local Settings Syntax (Per-Diagram YAML)
ユーザーは Markdown ノート内に、Obsidian標準の `parseYaml` で解析可能な形式で記述します。
**`notes` プロパティのみが必須（Mandatory）であり、他はすべて任意（Optional）です。**

### 【記述例】
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
  - [6, 8] # 配列による省略記法も許容
  - {s: 5, f: 5}
  - {s: 5, f: 7, finger: 3, ghost: true}
```

### 3.1 必須項目 (Mandatory)
*   **`notes` (Array):** 音の配置データ。オブジェクト `{s: 6, f: 5, label: root}` または、タイピングを減らすための配列省略記法 `[6, 5, "root"]` (インデックス順: s, f, label, shape, finger) の両方を許容し、内部で正規化してください。
    *   `s` (必須): 弦番号 (1〜N)。
    *   `f` (必須): フレット番号。`0` (開放弦)、`1以上` (押弦)、`x` (ミュート)。
        *   `0` と `x` は**グリッド（フレット列）の一部ではない**。常にグリッド外側の専用ヘッダ領域に描画し、フレット番号のラベル（"5fr" や各列の数字）としても一切カウントしないこと。あくまで「YAML記述上、開放弦・ミュート弦を指定するための値」であり、実在するフレット位置ではない。
        *   `x` は cross (×) 記号を描画。
    *   `label` (任意): `root` で度数自動計算。任意の文字列（`maj7`, `9`, `11` 等のテンション表記を含む）で強制表示。度数の自動算出は1オクターブ内でしか判定できない（9thと2nd、11thと4th等を区別できない）ため、テンションを正しく表示したい場合はユーザーがこの`label`で明示すること。
    *   `shape` (任意): `circle`, `square`, `triangle` など。
    *   `finger` (任意): 運指番号（1, 2, 3, 4など）。ドットの外側（下または上）に小さく印字。
    *   `ghost` (任意): Boolean。trueの場合、枠線を点線(dashed)または半透明で描画。
    *   `class` (任意): 任意のCSSクラス名（ハイライト用）。
    *   `color` (任意): この音1つだけの色をCSS色文字列（`red`, `#ff0000`等）で指定。指定時はSystem/Globalの`Fill Style`やRoot強調色より優先される。省略時はデフォルト（Rootは`--interactive-accent`、それ以外は`--text-normal`）。
    *   `fillStyle` (任意): `filled` / `outlined`。この音1つだけSystem/Globalの`Fill Style`を上書きする。
    *   `sizeAdjust` (任意, 整数 -5〜5): この音1つだけの形の大きさを、System/Globalの`Note Size`からピクセル単位で微調整する。
    *   `labelSizeAdjust` (任意, 整数 -5〜5): この音1つだけのラベル文字サイズを、System/Globalの`Label Font Size`からピクセル単位で微調整する。
    *   `color`, `fillStyle`, `sizeAdjust`, `labelSizeAdjust` はオブジェクト形式でのみ指定可能（配列の省略記法には含めない。位置引数が増えすぎて可読性を損なうため）。

### 3.2 任意項目 (Optional)
*   **`title` (String):** グラフ上部に表示。省略時は算出された度数からコード名を自動生成（4.1節参照）。自動生成されたコード名がテンション表記（9th/11th/13th等）を正しく表せない場合は、ここで明示的に上書きできる（例: `title: Cmaj9`）。
*   **`startFret` (Number):** 描画領域の左端となるフレット番号。有無で描画モードが切り替わる（4.1節参照）。
*   **`frets` (Number):** 描画するフレット幅。
*   **`orientation` (String):** `horizontal` / `vertical`。System/Globalの向きをこの図だけ上書きする。
*   **`size` (Number):** この図だけの表示倍率。System/Globalの `stringSpacing`/`fretSpacing`（`fretSpacingAdjust`/`stringSpacingAdjust`適用後の値）に乗算される（例: `0.6` で60%サイズ）。複数の図を小さく並べたい場合に使う。
*   **`fretSpacingAdjust` / `stringSpacingAdjust` (Number, 整数 -5〜5):** System/Globalの `fretSpacing`/`stringSpacing`（ピクセル）に対する微調整量。ユーザーはプラグインのCSSファイルを直接編集する想定ではないため、ピクセル単位の細かい見た目調整はこのYAMLオプションで行う。`size`より先に加算され、その後`size`が乗算される。
*   **`visible` (String):** 描画する弦の範囲。例: `"1-4"`。指定された場合、SVGのY軸（縦幅）の計算を動的に変更し、不要な弦は描画しないこと。
*   **`barre` (Array):** `{fret, start, end}`。セーハ記号を描画。
*   **`boxes` (Array):** スケールのポジション等を枠線で囲む。`{frets: "5-8", strings: "1-6", style: "dashed"}` など。
*   **`paths` (Array):** ドット同士を線で結ぶ。`[[6,5], [6,8], [5,5]]` のように座標の配列を渡し、SVGの `<polyline>` で描画。

複数の```fretboardブロックを空行を挟まず連続して書くと、横に並んで（折り返しながら）表示されることを狙う（`.fretboard-block`要素に`display: inline-block`を指定）。ただし実際に横並びになるかはObsidian側のMarkdownレンダリング構造（Reading View / Live Previewでのブロックのラップ方法）に依存し、プラグイン側から確実に制御できない場合がある。その場合はObsidianの「CSS snippets」機能（`.obsidian/snippets/`、設定画面から有効化）でユーザー自身がレイアウトを調整できるよう、`.fretboard-block` / `.fretboard-svg` 等の安定したクラス名をpublic APIとして提供すること。プラグイン本体の `styles.css` をユーザーが直接編集することは想定しない。

## 4. Core Logic

### 4.1 描画モードの自動切り替え
*   **Absolute Mode (絶対座標):** 次のいずれかに該当する場合。
    1.  `startFret` が指定されている場合。
    2.  `startFret` が省略されていても、`notes` の中に明示的な開放弦（`f: 0`）が1つでも含まれる場合。開放弦を含む形は物理的に移動できない（ムーバブルではない）ため、絶対位置が確定しているとみなす。
    このモードでは、そこ（`startFret`、または開放弦を含む場合は0）を左端として描画し、絶対的なコード名（Cmaj7等）を生成する。ナット（0フレット位置）は、実際に左端が0の場合のみ太線/二重線で描画する。
*   **Relative Mode (相対座標/移動ド):** `startFret` が省略され、かつ`notes`内に開放弦が一切含まれない場合のみ。`notes` 内の `f` の最小値（0とxは除く）を自動的に左端フレットとし、フレット番号("fr")は印字しない。相対コード名（□maj7等）を生成する。

### 4.2 Interval Auto-Calculation & Root Highlighting
`label: root` が指定された場合、Tuningの絶対ピッチ（MIDIノート番号）を基準に各弦の半音差分(Delta)を計算し、`%12`のモジュロ演算で度数 [1, b2, 2, m3, 3, 4, b5, 5, m6, 6, m7, M7] を割り当ててください。
また、**算出結果が `1` (Rootのオクターブ違い) となったすべてのノートについて、自動的に特別なスタイル（例: defaultShapeが円なら四角形にする、または色を変える）を適用**し、視覚的にRootが際立つようにしてください。

この自動算出は1オクターブ内の度数（1〜M7の12種類）しか区別できない仕様上の制約がある（例: 9thと2nd、11thと4thは区別できない）。テンション込みの正確な表記が必要な場合は、個々のノートの`label`、または図全体の`title`をユーザーが明示的に指定することで上書きする（3.1, 3.2節参照）。

### 4.3 Default Behaviors (フォールバック)
`label: root` が一つも存在しない場合は度数の自動算出は行わず、label未指定の音は文字無しの「図形のみ（例: 黒塗り丸 ●）」として描画してください。省略された弦は `Omitted String Behavior` に従って補完してください。

## 5. Error Handling & Deliverables
*   **Error Handling (Local):** ```fretboardブロック内のYAMLに構文エラーや不正な値があった場合、プラグインをクラッシュさせず、そのコードブロック内に赤字でエラー内容のテキストを表示して安全に中断してください。
*   **Error Handling (Global):** Vault共通の`fretboard-renderer.yaml`に構文エラーや不正な値があった場合、Vault内の描画全体をクラッシュさせず、Notice通知で一度だけエラーを表示した上でSystem設定にフォールバックしてください（2.2節参照）。
*   **未知のキーの扱い:** Local・Global（`notes`/`barre`/`boxes`の各エントリを含む）のいずれも、認識できないキー（例: `frets`のタイポである`flets`）が含まれる場合は**黙って無視せず、エラーとして扱う**こと。タイポを黙って無視すると「設定したのに何も起きない」という診断が非常に困難な不具合になるため、必ず気づけるようにする。
*   **Deliverables:** TypeScript (`main.ts` 及び適宜分割したファイル) を生成してください。SVGのスタイリングには Obsidian の CSS 変数 (例: `var(--text-normal)`, `var(--background-modifier-border)`) を使用し、ライト/ダークテーマに自動追従させてください。
