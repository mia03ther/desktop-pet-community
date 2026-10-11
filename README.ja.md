<p align="center">
  <a href="README.md">中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md"><strong>日本語</strong></a>
</p>

<p align="center">
  <img src="outputs/desktop-pet/apps/community-web/dist/assets/brand-logo.png" width="112" alt="desktop pet ロゴ">
</p>

<h1 align="center">desktop pet</h1>

<p align="center"><strong>みんなで育てるデスクトップの仲間。自由なアクション、キャラクター設定、選べるプラグイン、複数の AI ツールとの作業連携。</strong></p>

<p align="center">
  <a href="https://github.com/xunguangzlj-cloud/desktop-pet-community/releases/latest">アプリをダウンロード</a> ·
  <a href="https://desktoppet-e9e.pages.dev">共創プラットフォーム</a> ·
  <a href="https://github.com/xunguangzlj-cloud/desktop-pet-community/issues">問題を報告</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/xunguangzlj-cloud/desktop-pet-community?label=%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3" alt="公開バージョン">
  <img src="https://img.shields.io/github/downloads/xunguangzlj-cloud/desktop-pet-community/total?label=%E3%83%80%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%89" alt="リリースファイルのダウンロード数">
  <img src="https://img.shields.io/badge/%E5%AF%BE%E5%BF%9C%E7%92%B0%E5%A2%83-Windows%20x64-60bba0" alt="Windows x64">
  <img src="https://img.shields.io/badge/macOS-arm64-60bba0" alt="macOS arm64">
  <img src="https://img.shields.io/github/stars/xunguangzlj-cloud/desktop-pet-community?label=Star" alt="GitHub Star">
</p>

## 1. 主な機能

- **デスクトップの仲間**：ドラッグ、サイズ変更、非表示に対応しています。初期設定では静かに待機し、クリックするとランダムに反応します。静かに待機するモードを解除するとランダムにアクションを再生し、実際の AI 作業状態との連携を優先します。
- **自由なアクション設定**：スプライトシート、アニメーション WebP、動画アクションに対応しています。アクションの名前、カテゴリ、ランダム再生の候補、AI／クリック／ドラッグなどの状態への割り当てを変更できます。
- **ペットとの会話**：自分のクラウド AI またはローカル AI をペットの頭脳として設定できます。複数の接続先と独自の互換 API に対応しています。入力と回答のフォント、吹き出しのスタイルを変更でき、コントロールセンターでは時刻付きの履歴を確認できます。
- **キャラクター設定**：全体に適用する Markdown を自分で書く、抽出済みのキャラクター Skill をインポートする、設定済みの AI で資料からキャラクター設定を抽出する、という方法を選べます。有効にした完全な Skill のキャラクター設定は、キーワードによる呼び出しなしでペットとの会話に使用されます。Skill に含まれる任意のスクリプトは自動実行しません。
- **複数の AI ツールとの作業連携**：1 匹のペットで、接続済みの複数セッションの作業状態、具体的なツール、編集に成功したファイル数を表示できます。Codex と ZCode には Hook 接続を用意し、ほかのツールはそれぞれのブリッジ機能に合わせて設定します。作業監視用 AI と、ペットとの会話用 AI は別々に管理します。
- **対応する接続先の利用枠を確認**：Codex では公式の読み取り専用サブスクリプション利用枠に対応しています。DeepSeek の会話接続先では公式の残高照会、OpenRouter では公式の API キー利用枠への対応があります。接続できていない接続先は「不明」と表示し、ペットとの会話で使ったトークン数を、ほかの AI ツールの残り利用枠として表示することはありません。
- **必要なプラグインを選んでインストール**：水分補給、長時間の座りすぎ、目の休憩、ポモドーロなどのリマインダー、ファイルアシスタント、PC ケアは任意のプラグインです。リマインダーは同じペットとの会話に届きます。ファイルアシスタントはローカルファイルの検索と仮想分類ライブラリを提供し、実際の整理前には計画を確認できます。PC ケアは監視と提案を行います。
- **共創プラットフォーム**：ペット広場、プラグイン広場、要望広場、ランキング、作者ページを用意しています。制作と直接インポートを分け、独自の動画アクション、プラグインのカバー画像、完全な作品の投稿に対応しています。現在の公開カタログにはペット 154 件、プラグイン 24 件があり、素材はそれぞれのライセンスに従って公開しています。
- **幅広いインポート**：互換性のある作品は本システムにインストールして実行できます。互換性のないプロジェクトは原本を保持し、対応できない操作を無効にします。元のプログラムと実行環境を識別できる場合は、独立した起動を明示的に選べます。元のプロジェクトのロジックを強制的に書き換えることはありません。

外部 AI の利用には、自分のアカウント、ツール、設定が必要です。プリセットの接続入口、接続経路のテスト、元のプログラムの起動は、すべてのプラットフォームが接続済みであることや、任意のインポート済みプロジェクトが完全に動作することを意味しません。実際の提供内容と検証範囲は[提供状況](outputs/desktop-pet/docs/release-status.md)を参照してください。

### コミュニティペット紹介

プラットフォームには 132 のペットと 24 個のプラグインが収録されています。コミュニティの作品は[共创平台](https://desktoppet-e9e.pages.dev)で探せます。dsh-pet のカードはそのプロジェクトを開きます：

| <a href="https://desktoppet-e9e.pages.dev/#pets/firefly--lingxiaotian"><img src="outputs/desktop-pet/apps/community-web/dist/assets/pets/upstream-20261009/firefly--lingxiaotian-thumb.webp" width="150" alt="流萤"></a> | <a href="https://desktoppet-e9e.pages.dev/#pets/lulu--yogazz"><img src="outputs/desktop-pet/apps/community-web/dist/assets/pets/upstream-20261009/lulu--yogazz-thumb.webp" width="150" alt="Lulu"></a> | <a href="https://github.com/PC2005-cloud/dsh-pet"><img src="https://raw.githubusercontent.com/PC2005-cloud/dsh-pet/92662190cdd4dee05e38a5151584cc6254cd7a43/dsh-pet/assets/preview/daiji-huxi-xiuxian.gif" width="150" alt="dsh-pet"></a> |
|:---:|:---:|:---:|
| **流萤** | **Lulu** | **[dsh-pet](https://github.com/PC2005-cloud/dsh-pet)** |
| <a href="https://desktoppet-e9e.pages.dev/#pets/bongocat-vladelaina"><img src="outputs/desktop-pet/apps/community-web/dist/assets/pets/adapted-20261010/bongocat-vladelaina/thumbnail.webp" width="150" alt="BongoCat"></a> | <a href="https://desktoppet-e9e.pages.dev/#pets/cloud-lykinzlj1"><img src="outputs/desktop-pet/apps/community-web/dist/assets/pets/user-projects-20261010/cloud-lykinzlj1/thumbnail.webp" width="150" alt="真珠"></a> | <a href="https://desktoppet-e9e.pages.dev/#pets/danya-pet-windows"><img src="outputs/desktop-pet/apps/community-web/dist/assets/pets/user-projects-20261010/danya-pet-windows/thumbnail.webp" width="150" alt="达妮娅 · 三形态"></a> |
| **BongoCat** | **真珠** | **达妮娅 · 三形态** |

## 2. インストール方法

### Windows ポータブル版

1. [v4.0.3 リリース](https://github.com/xunguangzlj-cloud/desktop-pet-community/releases/latest)から、Windows x64 用ポータブル ZIP と `SHA256SUMS.txt` をダウンロードします。GitHub が自動生成する `Source code` ZIP はソースコードです。
2. ポータブル ZIP を、`D:\Apps\desktop-pet` などの書き込み可能なフォルダーに**すべて展開**します。同じフォルダー内の `resources`、ランタイム、その他のファイルを保持してください。EXE だけを移動したり、ZIP の中から直接起動したりしないでください。
3. 展開先の `desktop-pet.exe` をダブルクリックします。実行環境は同梱されているため、Node.js や Python のインストールは不要です。初回起動時にローカルプロファイルを作成します。作者の AI アカウントや個人設定は含まれていません。
4. 通常はこの EXE を直接開きます。デスクトップにショートカットを作成することもできます。基本のペット機能に AI の設定は不要です。プラグインは共創プラットフォームから必要なものをダウンロードしてインポートします。

**Windows x64** と **macOS arm64（Apple Silicon）** 用パッケージを提供します。Windows のコード署名は未取得です。Linux、Windows ARM の検証済みパッケージはまだありません。コントロールセンターの「設定」から GitHub の更新を確認できます。更新時はローカルのキャラクター設定、プラグイン、会話、AI 設定を保持します。

ダウンロードしたファイルの整合性は、PowerShell で次のコマンドを実行して確認できます。

```powershell
Get-FileHash -Algorithm SHA256 .\desktop-pet-4.0.3-windows-x64-portable.zip
```

結果を同じリリースの `SHA256SUMS.txt` と照合してください。ハッシュの照合で確認できるのはファイルの一致であり、セキュリティ監査の代わりにはなりません。

### macOS（Apple Silicon／arm64）

[Windows をダウンロード](https://github.com/xunguangzlj-cloud/desktop-pet-community/releases/download/v4.0.3/desktop-pet-4.0.3-windows-x64-portable.zip) · [Mac をダウンロード](https://github.com/xunguangzlj-cloud/desktop-pet-community/releases/download/v4.0.3/desktop-pet-4.0.3-mac-arm64.zip)。Mac ZIP をすべて展開し、`desktop-pet.app` をアプリケーションへ移動して開きます。

macOS arm64 のソースビルドに対応し、PR #2 の Mac 向けパッケージ変更は統合済みです。ペット、コントロールセンター、キャラクター設定、本システムのプラグインは Windows と同じコードを使用します。Windows 専用の診断、元の Windows EXE、外部ホストを必要とする機能には、それぞれの環境が必要です。

Apple Silicon Mac に Node.js 24、pnpm 11.0.8、Xcode Command Line Tools をインストールし、次を実行します。

```bash
git clone https://github.com/xunguangzlj-cloud/desktop-pet-community.git
cd desktop-pet-community/outputs/desktop-pet
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @open-pets/desktop exec electron-builder --mac --arm64 --publish never
node apps/desktop/dist/check-packaging-contract.js --output --platform darwin --arch arm64
```

出力先は `apps/desktop/dist-electron/` です。ZIP 内の完全な `desktop-pet.app` を保持するか、DMG からアプリケーションへドラッグしてください。Mac ビルドは ad-hoc 署名を使用し、Apple Developer ID 署名と公証はまだありません。Gatekeeper が表示された場合は、信頼するダウンロードについてシステム設定の「プライバシーとセキュリティ」の案内に従って承認できます。CI は実際の arm64 パッケージ、ネイティブ依存関係、コントロールセンター、ペット表示、正常終了を確認します。最新結果とダウンロードは [macOS ビルド](https://github.com/xunguangzlj-cloud/desktop-pet-community/actions/workflows/macos.yml)を参照してください。すべての Mac モデルや外部ホストを検証したわけではありません。

### ソースコードからの開発とビルド

Node.js 24 と pnpm 11.0.8 を推奨します。

```powershell
git clone https://github.com/xunguangzlj-cloud/desktop-pet-community.git
cd desktop-pet-community\outputs\desktop-pet
pnpm install
pnpm build
pnpm --filter @open-pets/desktop dev
```

`pnpm --filter @open-pets/desktop package:dir` を実行すると、デスクトップアプリのディレクトリ版をビルドできます。既存のツールや素材との互換性を保つため、ソースコードには一部の上流パッケージ名とプロトコルのフィールド名が残っています。リリース版を利用する通常のユーザーは、上記のコマンドを実行する必要はありません。

ウェブサイトのソースコード、バックエンド、デプロイ例もこのリポジトリに含まれています。自分のウェブサイトをデプロイする場合は、リポジトリのルートで次のコマンドを実行します。

```powershell
npm ci --prefix outputs/community-site
node outputs/community-host/scripts/build.mjs
node outputs/community-cloudflare/scripts/build.mjs
```

デプロイのテンプレートは [Cloudflare 設定例](outputs/community-cloudflare/wrangler.toml.example)を参照してください。自分の `wrangler.toml` としてコピーし、アカウントと D1 データベースの識別子を入力します。`deployment-migrations` 内の `0000`、`0001`、`0011` の順でデータベースを初期化し、プラットフォームのシークレットに `HASH_SALT` を設定してください。作者のデプロイ認証情報はリポジトリに含まれていません。

## 3. 使い方

### ペットの操作

| 操作 | 用途 |
| --- | --- |
| ペットをドラッグ | 好きな位置に移動 |
| ペットをクリック | 静かに待機するモードで、ランダムに反応アクションを再生 |
| 右クリック → コントロールセンターを開く | ローカルのペット、AI、キャラクター設定、スタイル、プラグインを管理 |
| 右クリック → アクション | アクションの選択、静かに待機するモードの切り替え、独自アクションの設定 |
| 右クリック → 非表示 | ペットを隠し、トレイから再表示 |
| 右クリック → 会話／右クリックを続けて 2 回 | ペットの横にある同じ入力欄を開く |
| 右クリック → サイズ | 表示サイズを調整 |
| 会話欄の右上にある × | セッションを保持したまま入力欄を閉じる |

### 会話、キャラクター設定、外部監視の設定

1. コントロールセンターの AI 接続設定で、プロバイダー、モデル、API を保存します。接続テストを行ってから、ペットの頭脳に使う接続先を選びます。キーはローカル設定に入力し、リポジトリにはコミットしないでください。
2. キャラクター設定で全体に適用する Markdown を記述するか、抽出済み Skill のインポートを選びます。完全なキャラクター Skill パッケージでは、`SKILL.md`、`manifest.json`、`references/` を保持できます。インポート後は有効になっているか確認してください。
3. 外部 AI ツールへの接続設定で、Codex、ZCode など実際にインストールされているツールを設定します。ツールごとの要件に従って Hook を確認して信頼し、新しいセッションで設定を読み込んでください。会話用プロバイダーの設定は、外部ツールの作業監視の代わりにはなりません。
4. 利用枠のページで、対応する接続先の公式データと取得時刻を確認します。公開 API がない、ログインしていない、データが古い場合は、画面の「不明／要確認」を基準にしてください。

詳しい操作は[ペットの頭脳](outputs/desktop-pet/docs/companion-ai.md)、[キャラクター設定](outputs/desktop-pet/docs/companion-persona.md)、[外部 AI 接続](outputs/desktop-pet/docs/agent-integrations.md)を参照してください。

### ペットとプラグインのインストール

[共創プラットフォーム](https://desktoppet-e9e.pages.dev)を開いて作品パッケージをダウンロードし、コントロールセンターのペット管理またはプラグイン管理から ZIP／フォルダーをインポートします。互換性と権限を確認してから有効にしてください。新しいプロファイルにすべてのプラグインがプリインストールされるわけではありません。ファイルアシスタント、PC ケア、健康リマインダーも自分でインストールする必要があります。

ウェブサイトおよびローカルのペットパッケージは合計 **1 GiB**、1 ファイル **512 MiB**、最大 **10,000 エントリー**に対応します。Codex アトラスは別途 **100 MiB** までです。ローカルのネイティブ SDK プラグインは合計 **32 MiB**、1 ファイル **5 MiB**、入口コード **1 MiB**までです。ZIP は展開後のサイズも確認します。大きな作品はキャラクターごとに分割、キャッシュ削除、または投稿ガイドに従って完全な作品ファイルへのリンクを提供してください。分割アーカイブには未対応です。

共創作品を投稿する場合は、ウェブサイトでパッケージを作成して情報を入力した後、このサイトの GitHub フォームを開きます。投稿者自身の GitHub アカウントでパッケージを添付して送信し、メンテナーの審査後に掲載します。パッケージの作成成功は、公開済みであることを意味しません。元のプロジェクトを保持したインポートと独立実行の具体的な範囲は[ペットとインポート](outputs/desktop-pet/docs/pets.md)を参照してください。

## 4. コントリビューター

<!-- CONTRIBUTORS_START -->
<p>
  <a href="https://github.com/xunguangzlj-cloud"><img src="assets/contributors/xunguangzlj-cloud.svg" width="64" height="64" alt="Lykinzlj" title="Lykinzlj"></a>
  <a href="https://github.com/wuxuancheng66"><img src="assets/contributors/wuxuancheng66.svg" width="64" height="64" alt="wuxuancheng66" title="wuxuancheng66"></a>
  <a href="https://github.com/legeling"><img src="assets/contributors/legeling.svg" width="64" height="64" alt="legeling" title="legeling"></a>
  <a href="https://github.com/cuNuo"><img src="assets/contributors/cuNuo.svg" width="64" height="64" alt="cuNuo" title="cuNuo"></a>
  <a href="https://github.com/xchangee"><img src="assets/contributors/xchangee.svg" width="64" height="64" alt="tal" title="tal"></a>
  <a href="https://github.com/NateWanggg"><img src="assets/contributors/NateWanggg.svg" width="64" height="64" alt="NateWanggg" title="NateWanggg"></a>
  <a href="https://github.com/gbn666"><img src="assets/contributors/gbn666.svg" width="64" height="64" alt="Guo Beining" title="Guo Beining"></a>
  <a href="https://github.com/Jorge-Cuevas90003"><img src="assets/contributors/Jorge-Cuevas90003.svg" width="64" height="64" alt="Jorge" title="Jorge"></a>
  <a href="https://github.com/ZaytsevZY"><img src="assets/contributors/ZaytsevZY.svg" width="64" height="64" alt="ZaytsevZY" title="ZaytsevZY"></a>
  <a href="https://github.com/xiangking"><img src="assets/contributors/xiangking.svg" width="64" height="64" alt="XiangWang" title="XiangWang"></a>
  <a href="https://github.com/z19t"><img src="assets/contributors/z19t.svg" width="64" height="64" alt="z19t" title="z19t"></a>
  <a href="https://github.com/cxian0928-afk"><img src="assets/contributors/cxian0928-afk.svg" width="64" height="64" alt="cxian0928-afk" title="cxian0928-afk"></a>
  <a href="https://github.com/zihualiu1997"><img src="assets/contributors/zihualiu1997.svg" width="64" height="64" alt="zihualiu1997" title="zihualiu1997"></a>
  <a href="https://github.com/LLLucasXU"><img src="assets/contributors/LLLucasXU.svg" width="64" height="64" alt="LLLucasXU" title="LLLucasXU"></a>
  <a href="https://github.com/D1a0y1bb"><img src="assets/contributors/D1a0y1bb.svg" width="64" height="64" alt="D1a0y1bb" title="D1a0y1bb"></a>
  <a href="https://github.com/Jasdfgh"><img src="assets/contributors/Jasdfgh.svg" width="64" height="64" alt="Jasdfgh" title="Jasdfgh"></a>
  <a href="https://github.com/AygunVarol"><img src="assets/contributors/AygunVarol.svg" width="64" height="64" alt="Aygun Varol" title="Aygun Varol"></a>
  <a href="https://github.com/initiatione"><img src="assets/contributors/initiatione.svg" width="64" height="64" alt="initiatione" title="initiatione"></a>
  <a href="https://github.com/Yau-427"><img src="assets/contributors/Yau-427.svg" width="64" height="64" alt="Yau-427" title="Yau-427"></a>
  <a href="https://github.com/SiIverAsh"><img src="assets/contributors/SiIverAsh.svg" width="64" height="64" alt="SiIverAsh" title="SiIverAsh"></a>
  <a href="https://github.com/Thankyou-Cheems"><img src="assets/contributors/Thankyou-Cheems.svg" width="64" height="64" alt="Thankyou-Cheems" title="Thankyou-Cheems"></a>
  <a href="https://github.com/untko"><img src="assets/contributors/untko.svg" width="64" height="64" alt="untko" title="untko"></a>
  <a href="https://github.com/gg0805"><img src="assets/contributors/gg0805.svg" width="64" height="64" alt="gg0805" title="gg0805"></a>
  <a href="https://github.com/YoGazz"><img src="assets/contributors/YoGazz.svg" width="64" height="64" alt="YoGazz" title="YoGazz"></a>
  <a href="https://github.com/DwDestiny"><img src="assets/contributors/DwDestiny.svg" width="64" height="64" alt="DwDestiny" title="DwDestiny"></a>
  <a href="https://github.com/Hyoni1129"><img src="assets/contributors/Hyoni1129.svg" width="64" height="64" alt="Jeonghan Lee (@Hyoni1129)" title="Jeonghan Lee (@Hyoni1129)"></a>
  <a href="https://github.com/ROTl24"><img src="assets/contributors/ROTl24.svg" width="64" height="64" alt="ROTl24" title="ROTl24"></a>
  <a href="https://github.com/Spacebody"><img src="assets/contributors/Spacebody.svg" width="64" height="64" alt="Jerry" title="Jerry"></a>
  <a href="https://github.com/Somnusochi"><img src="assets/contributors/Somnusochi.svg" width="64" height="64" alt="Somnusochi" title="Somnusochi"></a>
  <a href="https://github.com/ldl1234"><img src="assets/contributors/ldl1234.svg" width="64" height="64" alt="LyuDonglian" title="LyuDonglian"></a>
  <a href="https://github.com/zpzjzj"><img src="assets/contributors/zpzjzj.svg" width="64" height="64" alt="Ping" title="Ping"></a>
  <a href="https://github.com/zhou-jianwen"><img src="assets/contributors/zhou-jianwen.svg" width="64" height="64" alt="zhou-jianwen" title="zhou-jianwen"></a>
  <a href="https://github.com/netizenXuan"><img src="assets/contributors/netizenXuan.svg" width="64" height="64" alt="netizenXuan" title="netizenXuan"></a>
  <a href="https://github.com/Jason-Bai"><img src="assets/contributors/Jason-Bai.svg" width="64" height="64" alt="Jason Bai" title="Jason Bai"></a>
  <a href="https://github.com/FlamurMaliqi"><img src="assets/contributors/FlamurMaliqi.svg" width="64" height="64" alt="Flamur Maliqi" title="Flamur Maliqi"></a>
  <a href="https://github.com/ltmcliao-cmyk"><img src="assets/contributors/ltmcliao-cmyk.svg" width="64" height="64" alt="ltmcliao-cmyk" title="ltmcliao-cmyk"></a>
  <a href="https://github.com/rookie-09"><img src="assets/contributors/rookie-09.svg" width="64" height="64" alt="rookie-09" title="rookie-09"></a>
  <a href="https://github.com/mistyShen"><img src="assets/contributors/mistyShen.svg" width="64" height="64" alt="mistyShen" title="mistyShen"></a>
  <a href="https://github.com/Carl-312"><img src="assets/contributors/Carl-312.svg" width="64" height="64" alt="Carl-312" title="Carl-312"></a>
  <a href="https://github.com/wally025"><img src="assets/contributors/wally025.svg" width="64" height="64" alt="Wally Pet Contributors" title="Wally Pet Contributors"></a>
  <a href="https://github.com/qingyunAGI"><img src="assets/contributors/qingyunAGI.svg" width="64" height="64" alt="qingyunAGI" title="qingyunAGI"></a>
  <a href="https://github.com/Keseras34938976"><img src="assets/contributors/Keseras34938976.svg" width="64" height="64" alt="Keseras34938976" title="Keseras34938976"></a>
  <a href="https://github.com/Ricardo-2005"><img src="assets/contributors/Ricardo-2005.svg" width="64" height="64" alt="Ricardo-2005" title="Ricardo-2005"></a>
  <a href="https://github.com/JbBom"><img src="assets/contributors/JbBom.svg" width="64" height="64" alt="JbBom" title="JbBom"></a>
  <a href="https://github.com/QunBoo"><img src="assets/contributors/QunBoo.svg" width="64" height="64" alt="QunBoo" title="QunBoo"></a>
  <a href="https://github.com/sandytruant"><img src="assets/contributors/sandytruant.svg" width="64" height="64" alt="Yitian Sun" title="Yitian Sun"></a>
  <a href="https://github.com/xxhh0822"><img src="assets/contributors/xxhh0822.svg" width="64" height="64" alt="xxhh0822" title="xxhh0822"></a>
  <a href="https://github.com/Octane0411"><img src="assets/contributors/Octane0411.svg" width="64" height="64" alt="Octane0411" title="Octane0411"></a>
  <a href="https://github.com/amiaverse"><img src="assets/contributors/amiaverse.svg" width="64" height="64" alt="Amiaね" title="Amiaね"></a>
  <a href="https://github.com/regisbsb"><img src="assets/contributors/regisbsb.svg" width="64" height="64" alt="Regis Benedito dos Santos Bittencourt" title="Regis Benedito dos Santos Bittencourt"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/wxy"><img src="assets/contributors/author-50.svg" width="64" height="64" alt="wxy" title="wxy"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/zeyu.wang"><img src="assets/contributors/author-51.svg" width="64" height="64" alt="zeyu.wang" title="zeyu.wang"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/oYTYo"><img src="assets/contributors/author-52.svg" width="64" height="64" alt="oYTYo" title="oYTYo"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/MingDong"><img src="assets/contributors/author-53.svg" width="64" height="64" alt="MingDong" title="MingDong"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/wynn"><img src="assets/contributors/author-54.svg" width="64" height="64" alt="wynn" title="wynn"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/Alter"><img src="assets/contributors/author-55.svg" width="64" height="64" alt="Alter" title="Alter"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/Gaming33"><img src="assets/contributors/author-56.svg" width="64" height="64" alt="Gaming33" title="Gaming33"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/Rank"><img src="assets/contributors/author-57.svg" width="64" height="64" alt="Rank" title="Rank"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/hoody"><img src="assets/contributors/author-58.svg" width="64" height="64" alt="hoody" title="hoody"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/korn"><img src="assets/contributors/author-59.svg" width="64" height="64" alt="korn" title="korn"></a>
  <a href="https://desktoppet-e9e.pages.dev/#contributors/pets/Shawnzhou"><img src="assets/contributors/author-60.svg" width="64" height="64" alt="Shawnzhou" title="Shawnzhou"></a>
</p>
<!-- CONTRIBUTORS_END -->

ペット、プラグイン、コード、ドキュメント、レビュー、アイデアを提供してくださる皆さんに感謝します。

アバター一覧は、本リポジトリの貢献者と、当サイトで公開している作品の作者を紹介しています。クリックすると作者のページに移動します。有効な GitHub プロフィールが確認できない名前は、当サイトの作者ページにリンクしています。**Lykinzlj**（[xunguangzlj-cloud](https://github.com/xunguangzlj-cloud)）が本プロジェクトを保守しています。作品の元の作者名は保持し、本リポジトリのコードへの貢献は [GitHub の貢献履歴](https://github.com/xunguangzlj-cloud/desktop-pet-community/graphs/contributors)で確認できます。

[ペット投稿フォーム](https://github.com/xunguangzlj-cloud/desktop-pet-community/issues/new?template=pet-submission.yml)または[プラグイン投稿フォーム](https://github.com/xunguangzlj-cloud/desktop-pet-community/issues/new?template=plugin-submission.yml)で、完全なファイル、実行環境、実際の作者、ライセンスを添えて投稿してください。コードやテストは Pull Request で提出してください。キー、個人プロファイル、会話履歴、権限のない素材は投稿しないでください。

投稿は手動審査の待ち行列に入ります。審査、テスト、カタログへの収録、サイトのデプロイが完了してから公開されます。[貢献ガイド](CONTRIBUTING.md)と[保守担当者向けの投稿処理手順](docs/submission-maintenance.md)を参照してください。

## 5. 謝辞

- [OpenPetsHQ/openpets](https://github.com/OpenPetsHQ/openpets)：移植したデスクトップ基盤、プラグイン SDK、ツール接続の実装。MIT ライセンスと元の著作権表示を保持しています。
- [legeling/awesome-codex-pet](https://github.com/legeling/awesome-codex-pet) と [Codex Pet](https://codexpet.top/)：ペットコミュニティ、広場、共創フローの参考、および作品ごとのライセンスに従って保持した素材と作者情報。
- Electron、React、Vite、TypeScript、Sharp、Cloudflare などのプロジェクトとそのメンテナー。
- すべてのペット、プラグイン、フォント、その他の素材の作者、およびフィードバックやテストに参加したユーザー。

具体的なライセンスと著作権情報は[第三者の権利に関する声明](THIRD-PARTY-NOTICES.md)を参照してください。コード、フォント、プラグイン、キャラクター素材には、それぞれ適用される条件が異なります。

## 6. ライセンスと著作権について

| 内容 | 適用されるライセンスと権利の範囲 |
| --- | --- |
| 本プロジェクト独自のコード、説明、テンプレート | [MIT License](LICENSE)。著作権表示は Lykinzlj |
| 移植したデスクトップコード | [OpenPets の元の MIT ライセンスと著作権表示](outputs/desktop-pet/LICENSE)を保持 |
| プラグイン、フォント、ペット素材 | 各ディレクトリとダウンロードパッケージ内の `LICENSE`、クレジット、素材利用条件を個別に適用。[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)を参照 |
| キャラクターの外見、作品の IP、商標、参考素材 | 各権利はそれぞれの権利者に帰属。コードの MIT ライセンスは、これらの素材やキャラクターについて追加の権利を付与しない |

素材には CC BY、CC BY-NC など異なる条件があります。非商用ライセンスの作品はその条件の範囲でのみ使用でき、本プロジェクトのコードが公開されていることを理由に、すべての素材を商用利用することはできません。再配布が明示的に許可されていない原本は、公開リリースの対象に含めません。本プロジェクトは、すべてのキャラクターや参考素材について個別の公式許諾を取得したとは主張しません。投稿者は、自分が許諾できる内容と条件を明示する必要があります。

アプリのローカルプロファイル、認証情報、チャット、ログ、ブラウザーの状態、過去の制作記録は、ソースコードやポータブルパッケージに含めて公開しません。自分で設定した AI を有効にすると、リクエストは各プロバイダーの条件に従って処理されます。利用前に、必要に応じて送信内容とプラグイン権限を確認してください。現在のテストとリリースの範囲は[提供状況](outputs/desktop-pet/docs/release-status.md)を基準とします。

## 7. Star と作者への支援

このプロジェクトが役に立ったら、Star を付けていただけるとうれしいです。作者にミルクティー 1 杯分の応援を送っていただくこともできます。

フィードバック、作品の共有、開発への参加も歓迎します。

下の Alipay／WeChat の QR コードは、クリックすると元の画像を開けます。

<p align="center">
  <a href="assets/donate/alipay.jpg"><img src="assets/donate/alipay.jpg" width="150" alt="Alipay の支援用 QR コード"></a>
  <a href="assets/donate/wechat.jpg"><img src="assets/donate/wechat.jpg" width="150" alt="WeChat の支援用 QR コード"></a>
</p>
