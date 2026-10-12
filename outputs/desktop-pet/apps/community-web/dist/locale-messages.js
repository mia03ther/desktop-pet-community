// 只翻译网站界面的完整词条。作品署名、许可原文与用户内容由调用方保护。
const rows = `
界面语言|Interface language|表示言語|표시 언어
desktop pet · 广场与制作工作台|desktop pet · Gallery and creator workspace|desktop pet · ギャラリーと制作ワークスペース|desktop pet · 갤러리와 제작 작업실
正式版|Stable|正式版|정식 버전
桌宠广场|Pet gallery|デスクトップペット広場|데스크톱 펫 갤러리
需求广场|Requests|制作リクエスト|제작 요청
插件广场|Plugin gallery|プラグイン広場|플러그인 갤러리
共创平台|Community creation|共同制作プラットフォーム|공동 제작 플랫폼
安装指南|Installation guide|インストールガイド|설치 안내
前往 GitHub|Open GitHub|GitHub を開く|GitHub 열기
社区共创 · 持续收录|Community creations · Growing collection|コミュニティ制作 · 随時追加|커뮤니티 제작 · 계속 추가
作品收录|Works collected|収録作品|등록 작품
分类数|Categories|カテゴリー数|분류 수
本周|This week|今週|이번 주
社区排行榜|Community rankings|コミュニティランキング|커뮤니티 순위
近 7 日 · 本浏览器|Last 7 days · This browser|直近7日 · このブラウザー|최근 7일 · 이 브라우저
近 7 日 · 全站|Last 7 days · Site-wide|直近7日 · サイト全体|최근 7일 · 사이트 전체
榜单|Rankings|ランキング|순위
榜单 →|Rankings →|ランキング →|순위 →
桌宠 · 近 7 日互动|Pets · Interactions in the last 7 days|ペット · 直近7日の反応|펫 · 최근 7일 반응
作者 · 本站收录|Authors · Works on this site|作者 · 本サイトの収録作品|작가 · 사이트 등록 작품
等待制作|Awaiting creation|制作待ち|제작 대기
这些小宠物还在等人制作|These pets are waiting to be created|制作を待っているペットたち|제작을 기다리는 펫
进入需求广场|Browse requests|リクエストを見る|요청 갤러리 보기
公开需求与创作提案；草稿、支持与关注保存在此浏览器。|Public requests and creative proposals; drafts, support and follows are saved in this browser.|公開リクエストと制作案です。下書き、応援、フォローはこのブラウザーに保存されます。|공개 요청과 제작 제안입니다. 초안, 응원과 팔로우는 이 브라우저에 저장됩니다.
精选合集|Featured collections|おすすめコレクション|추천 모음
值得一起安装的精选组合|Collections worth installing together|一緒に使いたいおすすめの組み合わせ|함께 설치하면 좋은 모음
查看全部|View all|すべて見る|모두 보기
插件排行榜|Plugin rankings|プラグインランキング|플러그인 순위
插件 · 近 7 日互动|Plugins · Interactions in the last 7 days|プラグイン · 直近7日の反応|플러그인 · 최근 7일 반응
作者 / 维护者 · 本站收录|Authors / Maintainers · Works on this site|作者 / メンテナー · 本サイトの収録作品|작가 / 관리자 · 사이트 등록 작품
正在读取作品…|Loading works…|作品を読み込み中…|작품을 불러오는 중…
点赞、下载与近期趋势仅记录在此浏览器，不代表全站统计。|Likes, downloads and recent trends are recorded only in this browser, not across the site.|いいね、ダウンロード、最近の傾向はこのブラウザーの記録で、サイト全体の統計ではありません。|좋아요, 다운로드 및 최근 추세는 이 브라우저에만 기록되며 사이트 전체 통계가 아닙니다.
随机发现|Discover randomly|ランダムに探す|무작위로 찾기
广场排序|Gallery sorting|広場の並び順|갤러리 정렬
热门优先|Most popular|人気順|인기순
随机|Random|ランダム|무작위
最多下载|Most downloaded|ダウンロード順|다운로드순
最多点赞|Most liked|いいね順|좋아요순
近期趋势|Recent trends|最近の傾向|최근 추세
名称（A → Z）|Name (A → Z)|名前（A → Z）|이름 (A → Z)
桌宠作品|Pet works|ペット作品|펫 작품
插件作品|Plugin works|プラグイン作品|플러그인 작품
暂时没有匹配的作品|No matching works|一致する作品がありません|일치하는 작품이 없습니다
换一个关键词，或者把它变成你的下一个作品。|Try another keyword, or create it yourself.|別のキーワードで探すか、自分で制作してみましょう。|다른 검색어로 찾거나 직접 제작해 보세요.
清除筛选|Clear filters|絞り込みを解除|필터 초기화
加载更多|Load more|もっと見る|더 보기
发现社区作品|Discover community works|コミュニティ作品を探す|커뮤니티 작품 찾기
正在读取互动记录。|Loading interaction records.|反応の記録を読み込み中。|반응 기록을 불러오는 중입니다.
统计快照|Statistics snapshot|統計スナップショット|통계 스냅샷
更新频率|Refresh frequency|更新頻度|갱신 주기
页面读取时更新|Updated when opened|ページを開くと更新|페이지를 열 때 갱신
桌宠榜单|Pet rankings|ペットランキング|펫 순위
插件榜单|Plugin rankings|プラグインランキング|플러그인 순위
作品|Works|作品|작품
贡献者|Contributors|貢献者|기여자
系列|Series|シリーズ|시리즈
总榜|All time|総合|전체 기간
← 返回榜单|← Back to rankings|← ランキングに戻る|← 순위로 돌아가기
社区创作者|Community creators|コミュニティクリエイター|커뮤니티 제작자
关注|Follow|フォロー|팔로우
作者主页 ↗|Author homepage ↗|作者のホームページ ↗|작가 홈페이지 ↗
作者主页|Author homepage|作者のホームページ|작가 홈페이지
关注者|Followers|フォロワー|팔로워
下载|Downloads|ダウンロード|다운로드
点赞|Likes|いいね|좋아요
作者的作品|Author's works|作者の作品|작가의 작품
找到值得一起安装的伙伴|Find companions to install together|一緒に使いたい仲間を探す|함께 설치할 친구 찾기
按作品系列或共同主题浏览本站收录的桌宠，打开合集后可逐个预览和下载。|Browse pets by series or theme, then open a collection to preview and download each one.|シリーズや共通のテーマでペットを探し、コレクションから各作品をプレビューしてダウンロードできます。|시리즈 또는 공통 주제별로 펫을 찾고, 모음에서 각 작품을 미리 보고 다운로드할 수 있습니다.
全部|All|すべて|전체
全部分类|All categories|すべてのカテゴリー|전체 분류
作品系列|Franchise series|作品シリーズ|작품 시리즈
主题系列|Theme series|テーマシリーズ|주제 시리즈
← 返回合集|← Back to collections|← コレクションに戻る|← 모음으로 돌아가기
桌宠需求广场|Pet requests|ペット制作リクエスト|펫 제작 요청
制作需求广场|Creation requests|制作リクエスト広場|제작 요청 갤러리
筛选|Filter|絞り込み|필터
全部需求|All requests|すべてのリクエスト|전체 요청
待制作|Awaiting creation|制作待ち|제작 대기
我关注的|Following|フォロー中|팔로우 중
导出我的需求|Export my requests|自分のリクエストを出力|내 요청 내보내기
申请你喜欢的角色|Request a character|好きなキャラクターをリクエスト|좋아하는 캐릭터 요청하기
角色或作品名称|Character or work name|キャラクター名・作品名|캐릭터 또는 작품 이름
分类|Category|カテゴリー|분류
原创角色|Original characters|オリジナルキャラクター|창작 캐릭터
游戏角色|Game characters|ゲームキャラクター|게임 캐릭터
动漫角色|Anime characters|アニメキャラクター|애니메이션 캐릭터
吉祥物|Mascots|マスコット|마스코트
其他|Other|その他|기타
机器人|Robots|ロボット|로봇
人物头像|Character avatars|人物アバター|인물 아바타
动物伙伴|Animal companions|動物の仲間|동물 친구
幻想生物|Fantasy creatures|ファンタジーの生き物|판타지 생물
网络梗图|Internet memes|インターネットミーム|인터넷 밈
物件与道具|Objects and props|物・小道具|사물과 소품
制作说明|Creation notes|制作説明|제작 설명
图集版本|Sprite atlas version|スプライトシートのバージョン|스프라이트 시트 버전
V2 · 动作与 16 向注视|V2 · Actions and 16 gaze directions|V2 · アクションと16方向の視線|V2 · 동작과 16방향 시선
V1 · 九组动作|V1 · Nine action groups|V1 · 9種類のアクション|V1 · 9가지 동작
发布制作需求|Publish request|制作リクエストを投稿|제작 요청 게시
保存草稿|Save draft|下書きを保存|초안 저장
前往公开共创平台|Open public community|公開プラットフォームを開く|공개 플랫폼 열기
打开本站需求投稿|Open request submission|リクエスト投稿フォームを開く|요청 제출 양식 열기
我的制作需求说明|My creation requests|自分の制作リクエスト|내 제작 요청 설명
可保存 Markdown，也可以复制后交给你选择的 AI。|Save as Markdown or copy it for your chosen AI.|Markdownで保存するか、コピーして選んだAIに渡せます。|Markdown으로 저장하거나 복사하여 선택한 AI에 전달할 수 있습니다.
制作需求 Markdown|Request Markdown|リクエストのMarkdown|요청 Markdown
复制制作需求|Copy request|制作リクエストをコピー|제작 요청 복사
创作者工作台|Creator workspace|制作ワークスペース|제작자 작업실
共创工作台|Community workspace|共同制作ワークスペース|공동 제작 작업실
返回广场|Back to gallery|広場に戻る|갤러리로 돌아가기
制作桌宠|Create a pet|ペットを制作|펫 제작
制作插件|Create a plugin|プラグインを制作|플러그인 제작
导入桌宠|Import a pet|ペットをインポート|펫 가져오기
导入插件|Import a plugin|プラグインをインポート|플러그인 가져오기
选择一种共创方式|Choose a creation workflow|制作方法を選択|제작 방식 선택
正在检查投稿服务…|Checking submission service…|投稿サービスを確認中…|제출 서비스를 확인하는 중…
打开本站投稿表单|Open submission form|本サイトの投稿フォームを開く|사이트 제출 양식 열기
作品信息|Work information|作品情報|작품 정보
名称|Name|名前|이름
作品 ID|Work ID|作品ID|작품 ID
作品编号|Work ID|作品ID|작품 ID
简介|Description|紹介|소개
作者|Author|作者|작가
维护者|Maintainer|メンテナー|관리자
来源|Source|出典|출처
许可|License|ライセンス|라이선스
许可声明|License declaration|ライセンス声明|라이선스 선언
动作素材方式|Action material format|アクション素材形式|동작 소재 형식
逐动作视频 / 动画 WebP|Individual videos / Animated WebP|個別動画 / アニメーションWebP|개별 동영상 / 애니메이션 WebP
WebP 图集|WebP sprite atlas|WebPスプライトシート|WebP 스프라이트 시트
添加动作文件|Add action files|アクションファイルを追加|동작 파일 추가
每个文件是一个独立动作。名称、种类和与 AI 状态的对应关系均可自定义，未绑定状态显示待机。单文件 512 MiB，总计 1 GiB。|Each file is one action. Customize its name, type and AI-state bindings. Unbound states use idle. Maximum 512 MiB per file and 1 GiB total.|各ファイルが1つのアクションです。名前、種類、AI状態との対応を自由に設定できます。未設定の状態は待機を使います。1ファイル512 MiB、合計1 GiBまで。|파일 하나가 동작 하나입니다. 이름, 종류 및 AI 상태 연결을 설정할 수 있습니다. 미연결 상태에는 대기를 사용합니다. 파일당 512 MiB, 전체 1 GiB까지입니다.
背景处理|Background handling|背景処理|배경 처리
纯色背景去背|Remove solid-color background|単色背景を除去|단색 배경 제거
素材自带透明通道|Material includes transparency|素材の透明チャンネルを使用|소재의 투명 채널 사용
背景颜色|Background color|背景色|배경색
AI 与交互动作绑定|AI and interaction bindings|AI・操作とアクションの対応|AI 및 상호작용 동작 연결
选择 WebP 图集|Choose WebP atlas|WebPシートを選択|WebP 시트 선택
V1：1536 × 1872；V2：1536 × 2288。每格 192 × 208，8 列，透明背景。最大 24 MB。|V1: 1536 × 1872; V2: 1536 × 2288. Cells: 192 × 208, 8 columns, transparent background. Maximum 24 MB.|V1：1536 × 1872、V2：1536 × 2288。1コマ192 × 208、8列、透明背景。24 MBまで。|V1: 1536 × 1872, V2: 1536 × 2288. 셀은 192 × 208, 8열, 투명 배경입니다. 최대 24 MB.
先导入原项目文件|Import original project files first|先に元プロジェクトのファイルをインポート|먼저 원본 프로젝트 파일 가져오기
完整文件夹|Complete folder|フォルダー全体|전체 폴더
清单与配套文件|Manifest and companion files|マニフェストと関連ファイル|매니페스트 및 관련 파일
尚未导入文件|No files imported|未インポート|가져온 파일 없음
预览原素材|Preview original material|元の素材をプレビュー|원본 소재 미리 보기
AI 动作绑定由原清单定义|AI bindings use the original manifest|AIの対応は元のマニフェストに従います|AI 동작 연결은 원본 매니페스트에 따릅니다
导入后显示本系统支持范围。|Supported capabilities appear after import.|インポート後に本システムの対応範囲を表示します。|가져온 후 시스템 지원 범위를 표시합니다.
打包并发布|Package and publish|パッケージ化して投稿|패키징 및 게시
下载分享 ZIP|Download sharing ZIP|共有ZIPをダウンロード|공유 ZIP 다운로드
恢复草稿|Restore draft|下書きを復元|초안 복원
动作预览|Action preview|アクションプレビュー|동작 미리 보기
选择图集后，在这里预览|Choose an atlas to preview here|シートを選択するとここに表示されます|시트를 선택하면 여기에 표시됩니다
预览背景|Preview background|プレビュー背景|미리 보기 배경
透明棋盘|Transparency checkerboard|透明チェッカー|투명 격자
浅色背景|Light background|明るい背景|밝은 배경
深色背景|Dark background|暗い背景|어두운 배경
预览动作|Preview action|アクションをプレビュー|동작 미리 보기
16 向注视|16 gaze directions|16方向の視線|16방향 시선
选择图集后即可预览|Choose an atlas to preview|シートを選択してプレビュー|시트를 선택하여 미리 보기
等待选择图集|Waiting for an atlas|シートの選択待ち|시트 선택 대기
上传你制作的插件|Upload your plugin|制作したプラグインをアップロード|제작한 플러그인 업로드
插件名称|Plugin name|プラグイン名|플러그인 이름
插件 ID|Plugin ID|プラグインID|플러그인 ID
说明|Description|説明|설명
插件广场卡片封面（可选）|Plugin gallery cover (optional)|プラグインカードの表紙（任意）|플러그인 카드 표지 (선택)
移除本次封面|Remove this cover|今回の表紙を削除|이 표지 제거
插件广场卡片预览|Plugin gallery card preview|プラグインカードのプレビュー|플러그인 카드 미리 보기
作品文件|Work files|作品ファイル|작품 파일
声明权限|Declared permissions|宣言された権限|선언된 권한
尚未读取清单|Manifest not loaded|マニフェスト未読込|매니페스트를 읽지 않음
运行插件|Run plugin|プラグインを実行|플러그인 실행
运行配置|Runtime settings|実行設定|실행 설정
提交投稿后，审核收录才会在广场显示。|Submitted works appear in the gallery after review.|投稿作品は審査・収録後に広場へ表示されます。|제출한 작품은 검토 및 등록 후 갤러리에 표시됩니다.
从网站到桌面|From website to desktop|ウェブサイトからデスクトップへ|웹사이트에서 데스크톱으로
下载，导入，开始陪伴|Download, import, meet your companion|ダウンロードして、仲間を迎えよう|다운로드하고 가져와 친구 만나기
安装桌宠|Install a pet|ペットをインストール|펫 설치
在广场预览动作，下载桌宠 ZIP。打开控制中心「我的桌宠」，选择「导入 ZIP 或文件夹」并导入 ZIP，然后设为桌面伙伴。|Preview actions and download the pet ZIP. In Control Center, open “My pets”, choose “Import ZIP or folder”, import the ZIP and activate your companion.|広場でアクションを確認し、ペットZIPをダウンロードします。コントロールセンターの「我的桌宠」から「导入 ZIP 或文件夹」を選び、ZIPを読み込んで使用するペットに設定します。|동작을 미리 보고 펫 ZIP을 다운로드하세요. 제어 센터의 “我的桌宠”에서 “导入 ZIP 或文件夹”를 선택해 ZIP을 가져온 뒤 데스크톱 친구로 설정하세요.
已存在的编号会按本地导入规则处理，内置桌宠无需再次安装。|Existing IDs follow local import rules. Built-in pets do not need reinstalling.|既存のIDはローカルのインポート規則に従います。内蔵ペットの再インストールは不要です。|기존 ID는 로컬 가져오기 규칙에 따라 처리됩니다. 기본 제공 펫은 다시 설치하지 않아도 됩니다.
安装插件|Install a plugin|プラグインをインストール|플러그인 설치
下载插件 ZIP。在「插件管理」选择「导入 ZIP 或文件夹」，选中下载包或含插件清单的文件夹。阅读并确认权限后再启用。|Download the plugin ZIP. In “Plugin management”, choose “Import ZIP or folder” and select the package or manifest folder. Review and approve permissions before enabling.|プラグインZIPをダウンロードし、「插件管理」の「导入 ZIP 或文件夹」でZIPまたはマニフェストのあるフォルダーを選びます。権限を確認してから有効にします。|플러그인 ZIP을 다운로드하세요. “插件管理”의 “导入 ZIP 或文件夹”에서 패키지 또는 매니페스트 폴더를 선택하고 권한을 확인한 후 활성화하세요.
提醒是否开启、运行频率与停用操作由本机控制。|Reminders, frequency and disabling are controlled locally.|通知の有効化、頻度、停止はローカルで管理します。|알림, 실행 주기 및 비활성화는 로컬에서 제어합니다.
连接你选择的 AI|Connect your chosen AI|選んだAIに接続|선택한 AI 연결
在控制中心「宠物大脑」配置多个提供方或兼容接口；在「外部 AI 接入」连接支持的本机工具。外观素材不绑定单一 AI。|Configure providers or compatible endpoints in Control Center's “Pet brain”. Use “External AI integration” for supported local tools. Pet artwork is independent of the AI provider.|コントロールセンターの「宠物大脑」で提供元や互換APIを設定し、「外部 AI 接入」で対応するローカルツールに接続します。外観素材は特定のAIに限定されません。|제어 센터의 “宠物大脑”에서 제공자 또는 호환 API를 설정하고 “外部 AI 接入”에서 지원하는 로컬 도구를 연결하세요. 펫 외형은 특정 AI에 종속되지 않습니다.
密钥、人设、聊天与电脑文件都留在本地配置流程中。|Keys, personas, chats and computer files stay in your local configuration.|キー、人物設定、チャット、パソコンのファイルはローカルの設定内に保持されます。|키, 페르소나, 대화 및 컴퓨터 파일은 로컬 설정에 유지됩니다.
作品按各自声明使用；代码 MIT 不代表角色、美术等第三方素材取得同样许可。|Use each work under its own terms. MIT code does not grant the same rights to characters, artwork or other third-party materials.|各作品の声明に従って利用してください。コードがMITでも、キャラクターや美術などの第三者素材に同じ権利が与えられるとは限りません。|각 작품의 선언에 따라 이용하세요. MIT 코드 라이선스가 캐릭터, 미술 등 제삼자 소재에 같은 권리를 부여하는 것은 아닙니다.
桌宠动作预览|Pet action preview|ペットのアクションプレビュー|펫 동작 미리 보기
关闭|Close|閉じる|닫기
正在预览：安静陪伴|Previewing: quiet company|プレビュー：静かな付き添い|미리 보기: 조용한 동행
动作|Action|アクション|동작
以屏幕为方向：0° 向上，90° 向右。点击查看实际单帧姿态。|Screen directions: 0° up, 90° right. Click to view the actual single-frame pose.|画面上の方向：0°は上、90°は右。クリックすると実際の1コマのポーズを表示します。|화면 기준 0°는 위, 90°는 오른쪽입니다. 클릭하면 실제 단일 프레임 자세를 표시합니다.
下载桌宠 ZIP|Download pet ZIP|ペットZIPをダウンロード|펫 ZIP 다운로드
下载插件 ZIP|Download plugin ZIP|プラグインZIPをダウンロード|플러그인 ZIP 다운로드
下载 ZIP|Download ZIP|ZIPをダウンロード|ZIP 다운로드
浏览桌宠与插件，预览动作，制作兼容 desktop pet 的素材包。AI 来源在本机自行配置。|Browse pets and plugins, preview actions and create desktop pet packages. Configure AI providers locally.|ペットやプラグインを探し、アクションを確認してdesktop pet対応の素材パックを制作できます。AIの提供元はローカルで設定します。|펫과 플러그인을 찾고 동작을 미리 보며 desktop pet 호환 소재 패키지를 제작하세요. AI 제공자는 로컬에서 설정합니다.
网站导航|Site navigation|サイトナビゲーション|사이트 탐색
切换深色主题|Switch to dark theme|ダークテーマに切り替え|어두운 테마로 전환
切换主题|Toggle theme|テーマ切り替え|테마 전환
广场收录信息|Gallery collection information|広場の収録情報|갤러리 등록 정보
精选桌宠|Featured pets|おすすめペット|추천 펫
上一组合集|Previous collections|前のコレクション|이전 모음
下一组合集|Next collections|次のコレクション|다음 모음
按当前统计的点赞与下载总量排序，同分时点赞更多在前|Sort by current likes and downloads; ties favor more likes|現在のいいねとダウンロードの合計で並べ、同点はいいね順|현재 좋아요 및 다운로드 합계순, 동점이면 좋아요순
按当前统计的下载次数排序|Sort by current downloads|現在のダウンロード数で並べる|현재 다운로드순 정렬
搜索桌宠、作者、标签…|Search pets, authors, tags…|ペット・作者・タグを検索…|펫, 작가, 태그 검색…
搜索插件、作者、标签…|Search plugins, authors, tags…|プラグイン・作者・タグを検索…|플러그인, 작가, 태그 검색…
搜索广场|Search gallery|広場を検索|갤러리 검색
搜索桌宠|Search pets|ペットを検索|펫 검색
搜索插件|Search plugins|プラグインを検索|플러그인 검색
筛选分类|Filter categories|カテゴリーを絞り込み|분류 필터
作品类型|Work type|作品の種類|작품 유형
榜单类型|Ranking type|ランキングの種類|순위 유형
时间范围|Time range|期間|기간
作者作品类型|Author work type|作者の作品の種類|작가 작품 유형
搜索合集或主题…|Search collections or themes…|コレクション・テーマを検索…|모음 또는 주제 검색…
搜索合集|Search collections|コレクションを検索|모음 검색
合集类型|Collection type|コレクションの種類|모음 유형
搜索角色或制作需求…|Search characters or requests…|キャラクター・リクエストを検索…|캐릭터 또는 제작 요청 검색…
搜索制作需求|Search creation requests|制作リクエストを検索|제작 요청 검색
例如：戴耳机的云朵小猫|Example: a cloud kitten wearing headphones|例：ヘッドホンをつけた雲の子猫|예: 헤드폰을 쓴 구름 고양이
它的模样、个性或你想看到的动作…|Appearance, personality or actions you'd like…|外見、性格、見たいアクション…|외모, 성격 또는 보고 싶은 동작…
共创入口|Creation workflows|制作の入口|제작 방식
桌宠作品工作台|Pet workspace|ペット制作ワークスペース|펫 작업실
例如：云朵小猫|Example: cloud kitten|例：雲の子猫|예: 구름 고양이
例如：cloud-cat|Example: cloud-cat|例：cloud-cat|예: cloud-cat
它是什么样的伙伴？|What kind of companion is it?|どんな仲間ですか？|어떤 친구인가요?
你的署名|Your credit|あなたの署名|제작자 이름
例如：CC BY-NC 4.0 或个人使用|Example: CC BY-NC 4.0 or personal use|例：CC BY-NC 4.0、または個人利用|예: CC BY-NC 4.0 또는 개인 이용
导入保留原清单，不在网页改写映射|Import preserves the original manifest; bindings are not rewritten on the website|インポートでは元のマニフェストを保持し、ウェブ上では対応関係を書き換えません|가져오기는 원본 매니페스트를 유지하며 웹에서 연결을 다시 작성하지 않습니다
上传图集的九组动作|Nine action groups in the uploaded atlas|アップロードしたシートの9種類のアクション|업로드한 시트의 9가지 동작
上传图集的十六方向注视|Sixteen gaze directions in the uploaded atlas|アップロードしたシートの16方向の視線|업로드한 시트의 16방향 시선
插件作品工作台|Plugin workspace|プラグイン制作ワークスペース|플러그인 작업실
我的插件|My plugin|自分のプラグイン|내 플러그인
功能、适用环境与安装条件|Features, supported environments and installation requirements|機能、対応環境、インストール条件|기능, 지원 환경 및 설치 조건
例如：MIT|Example: MIT|例：MIT|예: MIT
关闭详情|Close details|詳細を閉じる|상세 정보 닫기
关闭工具详情|Close tool details|ツール詳細を閉じる|도구 상세 정보 닫기
关闭桌宠详情|Close pet details|ペット詳細を閉じる|펫 상세 정보 닫기
桌宠动作|Pet actions|ペットのアクション|펫 동작
九组动作|Nine action groups|9種類のアクション|9가지 동작
十六方向注视|Sixteen gaze directions|16方向の視線|16방향 시선
查看|View|見る|보기
查看功能|View features|機能を見る|기능 보기
桌宠|Pet|ペット|펫
插件|Plugin|プラグイン|플러그인
安装|Install|インストール|설치
分享|Share|共有|공유
复制给 AI 的安装说明|Copy installation notes for AI|AI用インストール説明をコピー|AI용 설치 설명 복사
阅读安装指南|Read installation guide|インストールガイドを読む|설치 안내 읽기
复制作品链接|Copy work link|作品リンクをコピー|작품 링크 복사
查看安装指南|View installation guide|インストールガイドを見る|설치 안내 보기
提供的功能|Features|提供する機能|제공 기능
选择动作|Choose action|アクションを選択|동작 선택
预览此绑定|Preview this binding|この対応をプレビュー|이 연결 미리 보기
动作名称|Action name|アクション名|동작 이름
动作种类|Action type|アクションの種類|동작 종류
动作 ID|Action ID|アクションID|동작 ID
例如：陪伴 / 互动 / 工作|Example: company / interaction / work|例：付き添い / 操作 / 作業|예: 동행 / 상호작용 / 작업
移除|Remove|削除|제거
待机|Idle|待機|대기
向右行走|Walk right|右へ歩く|오른쪽 걷기
向左行走|Walk left|左へ歩く|왼쪽 걷기
挥手|Wave|手を振る|손 흔들기
庆祝|Celebrate|喜ぶ|축하
失败|Failure|失敗|실패
等待|Waiting|待つ|기다리기
工作|Working|作業|작업
思考|Thinking|考える|생각하기
睡觉|Sleeping|眠る|잠자기
点击|Click response|クリック反応|클릭 반응
拖拽|Drag response|ドラッグ反応|드래그 반응
第一个动作|First action|最初のアクション|첫 동작
使用待机|Use idle|待機を使用|대기 사용
向上|Up|上|위
向右|Right|右|오른쪽
向下|Down|下|아래
向左|Left|左|왼쪽
原生兼容|Native compatibility|ネイティブ対応|기본 호환
部分支持|Partial support|部分対応|부분 지원
需原宿主|Original host required|元のホストが必要|원본 호스트 필요
无法识别或直接兼容|Unrecognized or incompatible|未認識・直接非対応|인식 불가 또는 직접 호환 불가
静态兼容性检查|Static compatibility check|静的互換性チェック|정적 호환성 검사
清单未请求权限|No permissions requested|要求された権限なし|요청된 권한 없음
未提供本系统权限声明|No permissions declared for this system|本システムの権限声明なし|이 시스템의 권한 선언 없음
请使用原宿主。|Use the original host.|元のホストを使用してください。|원본 호스트를 사용하세요.
你的插件名称|Your plugin name|プラグイン名|플러그인 이름
填写说明后在这里预览|Enter a description to preview here|説明を入力するとここに表示されます|설명을 입력하면 여기에 표시됩니다
参考外观|Reference appearance|外見の参考|외형 참고
你的角色创意|Your character idea|あなたのキャラクター案|캐릭터 아이디어
我的制作需求|My request|自分の制作リクエスト|내 제작 요청
社区制作需求|Community request|コミュニティのリクエスト|커뮤니티 제작 요청
创作提案示例|Example proposal|制作案の例|제작 제안 예시
等你开始|Waiting for you|あなたの制作を待っています|제작을 기다립니다
已支持|Supported|応援済み|응원 중
我也想要|I want this too|私も欲しい|나도 원해요
已关注|Following|フォロー中|팔로우 중
关注进度|Follow progress|進捗をフォロー|진행 상황 팔로우
近 7 日|Last 7 days|直近7日|최근 7일
累计|All time|累計|누적
近 7 日下载|Downloads in 7 days|直近7日のダウンロード|최근 7일 다운로드
近 7 日点赞|Likes in 7 days|直近7日のいいね|최근 7일 좋아요
近 7 日互动|Interactions in 7 days|直近7日の反応|최근 7일 반응
累计互动|All-time interactions|累計の反応|누적 반응
全站真实互动|Site-wide interactions|サイト全体の反応|사이트 전체 반응
此浏览器记录|This browser's records|このブラウザーの記録|이 브라우저 기록
打开页面与互动后读取|Loaded when opened or after interactions|ページを開いた時・反応後に取得|페이지 열기 또는 반응 후 조회
正在保存…|Saving…|保存中…|저장 중…
正在读取关注状态…|Loading follow status…|フォロー状態を読み込み中…|팔로우 상태를 불러오는 중…
关注服务暂不可用。|Follow service is temporarily unavailable.|フォローサービスは一時的に利用できません。|팔로우 서비스를 일시적으로 사용할 수 없습니다.
未找到此创作者|Creator not found|クリエイターが見つかりません|제작자를 찾을 수 없습니다
请从本站榜单选择一位创作者。|Choose a creator from this site's rankings.|本サイトのランキングからクリエイターを選択してください。|사이트 순위에서 제작자를 선택하세요.
作者未提供主页|The author has not provided a homepage|作者のホームページが未登録です|작가가 홈페이지를 제공하지 않았습니다
创作者的作品|Creator's works|クリエイターの作品|제작자의 작품
全站|Site-wide|サイト全体|사이트 전체
此浏览器|This browser|このブラウザー|이 브라우저
下载与点赞|Downloads and likes|ダウンロード・いいね|다운로드 및 좋아요
统计暂不可用|Statistics unavailable|統計を利用できません|통계 이용 불가
本站暂无此类型作品。|No works of this type on this site yet.|この種類の作品はまだありません。|이 유형의 등록 작품이 아직 없습니다.
没有匹配的合集，换个关键词试试。|No matching collections. Try another keyword.|一致するコレクションがありません。別のキーワードで試してください。|일치하는 모음이 없습니다. 다른 검색어를 사용하세요.
还没有互动记录。去广场为喜欢的伙伴点赞或下载，它就会出现在这里。|No interactions yet. Like or download a companion to see it here.|反応の記録がありません。広場でいいねやダウンロードをすると、ここに表示されます。|반응 기록이 없습니다. 갤러리에서 좋아요를 누르거나 다운로드하면 여기에 표시됩니다.
还没有互动记录。为喜欢的作品点赞或下载后，这里会显示实际排名。|No interactions yet. Rankings will appear after likes or downloads.|反応の記録がありません。いいねやダウンロードの後に実際の順位を表示します。|반응 기록이 없습니다. 좋아요 또는 다운로드 후 실제 순위를 표시합니다.
统计暂不可用，请稍后刷新。|Statistics are unavailable. Refresh later.|統計を取得できません。しばらくして再読込してください。|통계를 사용할 수 없습니다. 나중에 새로 고침하세요.
暂时没有匹配的制作需求。写下你的角色想法，或关注一项提案。|No matching requests. Add a character idea or follow a proposal.|一致するリクエストがありません。キャラクター案を書くか、提案をフォローしてください。|일치하는 제작 요청이 없습니다. 캐릭터 아이디어를 쓰거나 제안을 팔로우하세요.
`;
export const uiMessages = Object.fromEntries(rows.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); if (values.length !== 3) throw new Error('界面词典列数无效：'+key); return [key, values]; }));
const feedbackRows = `
互动服务暂不可用。|The interaction service is temporarily unavailable.|反応サービスは一時的に利用できません。|반응 서비스를 일시적으로 사용할 수 없습니다.
公共统计暂不可用，请刷新后重试。|Shared statistics are unavailable. Refresh and retry.|公開統計を取得できません。再読込してお試しください。|공유 통계를 사용할 수 없습니다. 새로 고침 후 다시 시도하세요.
公共统计暂不可用，请刷新重试|Shared statistics are unavailable. Refresh and retry|公開統計を取得できません。再読込してください|공유 통계를 사용할 수 없습니다. 새로 고침하세요
取消点赞|Unlike|いいねを取り消す|좋아요 취소
全站下载，同一匿名来源每日去重|Site-wide downloads, deduplicated daily for each anonymous source|全サイトのダウンロード。同じ匿名利用元は1日1回として集計|사이트 전체 다운로드, 동일 익명 사용자의 하루 중복 제외
全站点赞与下载 · 同一匿名来源每天去重|Site-wide likes and downloads · Deduplicated daily per anonymous source|全サイトのいいねとダウンロード · 同じ匿名利用元は1日1回|사이트 전체 좋아요 및 다운로드 · 익명 사용자별 일일 중복 제외
点赞与下载次数记录于此浏览器 · 近期趋势为近 7 日互动|Likes and downloads in this browser · Recent trends cover 7 days|このブラウザーのいいね・ダウンロード · 最近の傾向は直近7日|이 브라우저의 좋아요 및 다운로드 · 최근 추세는 7일 반응
浏览器未允许保存，点赞与下载次数仅在当前页面保留|Browser storage is unavailable; likes and downloads stay on this page only|ブラウザーが保存を許可していないため、いいねとダウンロードは現在のページにのみ保持|브라우저 저장 불가. 좋아요와 다운로드는 현재 페이지에만 유지됩니다
全站下载，每日去重|Site-wide downloads, deduplicated daily|全サイトのダウンロード、1日単位で重複除外|사이트 전체 다운로드, 일일 중복 제외
此浏览器发起下载|Download initiated by this browser|このブラウザーからのダウンロード|이 브라우저에서 시작한 다운로드
卡片预览，发布结果以下方反馈为准|Card preview; publication status is shown below|カードのプレビュー。投稿結果は下の表示で確認|카드 미리 보기. 게시 결과는 아래 안내를 확인하세요
此作品不存在，请从广场重新选择。|This work does not exist. Choose another from the gallery.|この作品は存在しません。広場から選び直してください。|작품이 없습니다. 갤러리에서 다시 선택하세요.
此工具不存在，请从插件广场重新选择。|This tool does not exist. Choose another from the plugin gallery.|このツールは存在しません。プラグイン広場から選び直してください。|도구가 없습니다. 플러그인 갤러리에서 다시 선택하세요.
见包内声明|See declaration in the package|パッケージ内の声明を参照|패키지 내부 선언 참조
浏览器未允许复制，请使用下载按钮或安装指南。|Clipboard access is unavailable. Use Download or the installation guide.|コピーが許可されていません。ダウンロードまたはインストールガイドを利用してください。|복사가 허용되지 않습니다. 다운로드 버튼이나 설치 안내를 이용하세요.
正在检查图集…|Checking atlas…|シートを確認中…|시트를 확인하는 중…
图集超过 24 MB。|Atlas exceeds 24 MB.|シートが24 MBを超えています。|시트가 24 MB를 초과합니다.
请选择真正的 WebP 图集。|Choose a valid WebP atlas.|有効なWebPシートを選択してください。|유효한 WebP 시트를 선택하세요.
请选择单张图集，不要使用动画 WebP。|Choose a single atlas image, not animated WebP.|アニメーションWebPではなく、1枚のシートを選択してください。|애니메이션 WebP가 아닌 단일 시트 이미지를 선택하세요.
图集尺寸应为 1536 × 1872（V1）或 1536 × 2288（V2）。|Atlas dimensions must be 1536 × 1872 (V1) or 1536 × 2288 (V2).|シートは1536 × 1872（V1）または1536 × 2288（V2）です。|시트 크기는 1536 × 1872 (V1) 또는 1536 × 2288 (V2)여야 합니다.
图集需要同时包含透明背景和可见角色。|Atlas needs a transparent background and a visible character.|シートには透明背景と見えるキャラクターが必要です。|시트에는 투명 배경과 보이는 캐릭터가 필요합니다.
上传图集的动作预览|Uploaded atlas action preview|アップロードしたシートのプレビュー|업로드한 시트 동작 미리 보기
当前没有匹配作品，请先清除筛选。|No matching works. Clear filters first.|一致する作品がありません。絞り込みを解除してください。|일치하는 작품이 없습니다. 먼저 필터를 초기화하세요.
本机作品链接已复制；其他电脑请分享 ZIP。|Local work link copied; share the ZIP for other computers.|ローカル作品リンクをコピーしました。他のパソコンにはZIPを共有してください。|로컬 작품 링크를 복사했습니다. 다른 컴퓨터에는 ZIP을 공유하세요.
作品链接已复制。|Work link copied.|作品リンクをコピーしました。|작품 링크를 복사했습니다.
安装说明已复制，可以交给你选择的 AI。|Installation notes copied for your chosen AI.|インストール説明をコピーしました。選んだAIに渡せます。|설치 설명을 복사했습니다. 선택한 AI에 전달하세요.
切换到浅色模式|Switch to light mode|ライトモードに切り替え|밝은 모드로 전환
切换到深色模式|Switch to dark mode|ダークモードに切り替え|어두운 모드로 전환
主题已切换；此浏览器未允许保存偏好。|Theme changed; this browser could not save the preference.|テーマを変更しました。ブラウザーが設定の保存を許可していません。|테마를 변경했습니다. 브라우저에서 설정을 저장할 수 없습니다.
添加动作文件后即可预览|Add action files to preview|アクションファイルを追加してプレビュー|동작 파일을 추가하여 미리 보기
添加动作文件后，在这里预览|Add action files to preview here|アクションファイルを追加するとここに表示されます|동작 파일을 추가하면 여기에 표시됩니다
请先添加并选择要预览的动作。|Add and select an action to preview first.|先にプレビューするアクションを追加・選択してください。|먼저 미리 볼 동작을 추가하고 선택하세요.
最多添加 100 个动作。|Maximum 100 actions.|100アクションまで追加できます。|동작은 최대 100개입니다.
请选择 MP4、WebM 或动画 WebP。|Choose MP4, WebM or animated WebP.|MP4、WebM、アニメーションWebPを選択してください。|MP4, WebM 또는 애니메이션 WebP를 선택하세요.
单文件最大 512 MiB，动作总量最大 1 GiB。|Maximum 512 MiB per file and 1 GiB for all actions.|1ファイル512 MiB、アクション合計1 GiBまでです。|파일당 최대 512 MiB, 전체 동작은 1 GiB까지입니다.
ZIP 实际解压内容超过清单大小。|Extracted ZIP contents exceed the declared size.|ZIPの展開内容が宣言されたサイズを超えています。|ZIP 압축 해제 내용이 선언된 크기를 초과합니다.
只预览原包素材，不执行原逻辑|Preview original assets without executing project logic|元の素材のみを表示し、元の処理は実行しません|원본 소재만 미리 보며 프로젝트 로직은 실행하지 않습니다
本系统不能预览此格式，请按原项目说明在原宿主使用|This format cannot be previewed here. Use the original host as documented|この形式はプレビューできません。元プロジェクトの説明に従い、元のホストを利用してください|이 형식은 미리 볼 수 없습니다. 원본 안내에 따라 원본 호스트를 사용하세요
原包缺少预览文件。|The original package lacks preview files.|元のパッケージにプレビューファイルがありません。|원본 패키지에 미리 보기 파일이 없습니다.
原包待机素材预览|Original package idle preview|元パッケージの待機素材プレビュー|원본 패키지 대기 소재 미리 보기
正在预览待机动作。|Previewing idle action.|待機アクションを表示中。|대기 동작을 미리 보는 중입니다.
封面图片无法解码显示，原文件仍保留。请重新选择可打开的 PNG、JPEG 或 WebP 图片。|Cover could not be decoded. The original file is retained. Choose a readable PNG, JPEG or WebP.|表紙を読み込めません。元ファイルは保持されます。開けるPNG、JPEG、WebPを選び直してください。|표지를 디코딩할 수 없습니다. 원본 파일은 유지됩니다. 읽을 수 있는 PNG, JPEG 또는 WebP를 다시 선택하세요.
插件封面最大 10 MB。|Plugin cover maximum: 10 MB.|プラグイン表紙は10 MBまでです。|플러그인 표지는 최대 10 MB입니다.
封面已加入作品，右侧显示实际卡片布局。保存草稿或下载分享包会保留图片。|Cover added. The actual card layout appears on the right. Saving a draft or downloading the sharing package retains it.|表紙を追加しました。右側に実際のカード配置を表示します。下書きや共有パックに画像が保存されます。|표지를 추가했습니다. 오른쪽에 실제 카드 배치가 표시되며, 초안 또는 공유 패키지에 이미지가 유지됩니다.
正在读取作品文件…|Loading work files…|作品ファイルを読み込み中…|작품 파일을 읽는 중…
ZIP 最大 1 GiB；更大的作品请按投稿指南提交完整包链接。|ZIP maximum: 1 GiB. For larger works, submit a complete-package link using the submission guide.|ZIPは1 GiBまでです。大きい作品は投稿ガイドに従って完全なパッケージのリンクを提出してください。|ZIP은 최대 1 GiB입니다. 더 큰 작품은 제출 안내에 따라 전체 패키지 링크를 제출하세요.
最多导入 10000 个文件。|Import up to 10000 files.|10000ファイルまでインポートできます。|최대 10000개 파일을 가져올 수 있습니다.
单文件最大 512 MiB，总量最大 1 GiB。|Maximum 512 MiB per file, 1 GiB total.|1ファイル512 MiB、合計1 GiBまでです。|파일당 최대 512 MiB, 전체 1 GiB까지입니다.
存在同名文件，请使用文件夹或 ZIP 保留子目录。|Duplicate filenames found. Use a folder or ZIP to preserve subdirectories.|同名ファイルがあります。フォルダーまたはZIPでサブフォルダーを保持してください。|같은 이름의 파일이 있습니다. 폴더 또는 ZIP을 사용해 하위 폴더를 유지하세요.
作品文件已读取。填写作品信息后可保存草稿或下载完整分享包。|Files loaded. Fill in work information to save a draft or download the complete sharing package.|作品ファイルを読み込みました。作品情報を入力し、下書き保存や共有パックのダウンロードができます。|파일을 읽었습니다. 작품 정보를 입력한 후 초안을 저장하거나 전체 공유 패키지를 다운로드하세요.
清单未成功读取|Manifest could not be loaded|マニフェストを読み込めません|매니페스트를 읽지 못함
图集必须是完整单张 WebP。|Atlas must be a complete single WebP image.|シートは完全な単一WebP画像である必要があります。|시트는 완전한 단일 WebP 이미지여야 합니다.
图集需要透明背景和可见角色。|Atlas needs transparency and a visible character.|シートには透明背景と見えるキャラクターが必要です。|시트에는 투명 배경과 보이는 캐릭터가 필요합니다.
此浏览器无法完整检查动画 WebP。|This browser cannot fully inspect animated WebP.|このブラウザーはアニメーションWebPを完全に検査できません。|이 브라우저는 애니메이션 WebP를 완전히 검사할 수 없습니다.
请先上传完整作品文件。|Upload complete work files first.|先に完全な作品ファイルをアップロードしてください。|먼저 전체 작품 파일을 업로드하세요.
请先选择通过检查的图集。|Choose an atlas that passed validation first.|先に検査済みのシートを選択してください。|먼저 검사를 통과한 시트를 선택하세요.
分享 ZIP 已生成。|Sharing ZIP created.|共有ZIPを作成しました。|공유 ZIP을 생성했습니다.
正在生成投稿包，请勿重复提交。|Creating submission package. Please do not submit again.|投稿パックを作成中です。重複送信しないでください。|제출 패키지를 생성하고 있습니다. 중복 제출하지 마세요.
生成 ZIP 后打开本站 GitHub 投稿表单，附上文件并提交，等待审核收录。|After creating the ZIP, open this site's GitHub form, attach it and submit for review.|ZIP作成後、本サイトのGitHub投稿フォームを開き、ファイルを添付して審査へ提出します。|ZIP 생성 후 사이트 GitHub 양식을 열고 파일을 첨부해 검토를 요청하세요.
可提交作品；发布结果以服务确认为准。|Works can be submitted; publication requires service confirmation.|投稿できます。公開結果はサービスの確認に従います。|작품을 제출할 수 있습니다. 게시는 서비스 확인에 따릅니다.
可保存草稿或下载分享包，到公开共创平台查看投稿入口。|Save a draft or download the sharing package. Open the public community for submission.|下書き保存や共有パックのダウンロードができます。公開プラットフォームで投稿入口を確認してください。|초안을 저장하거나 공유 패키지를 다운로드하고, 공개 플랫폼에서 제출 메뉴를 확인하세요.
投稿入口尚未开放；可保存草稿或下载分享包。|Submission is not open yet. Save a draft or download the sharing package.|投稿はまだ開始されていません。下書き保存や共有パックのダウンロードをご利用ください。|제출 메뉴가 아직 열리지 않았습니다. 초안을 저장하거나 공유 패키지를 다운로드하세요.
正在打包…|Packaging…|パッケージ化中…|패키징 중…
网页导入与打包最大 1 GiB，单文件 512 MiB，最多 10000 文件。ZIP 超过 Issue 附件上限时，可上传到自己的 GitHub Release（每个文件小于 2 GiB）并在投稿中填写下载链接。|Web import and packaging: 1 GiB total, 512 MiB per file, up to 10000 files. If the ZIP exceeds Issue attachment limits, upload it to your own GitHub Release (less than 2 GiB per file) and include its download link.|ウェブのインポート・パッケージ化は合計1 GiB、1ファイル512 MiB、10000ファイルまで。Issueの添付上限を超えるZIPは自分のGitHub Release（1ファイル2 GiB未満）へアップロードし、投稿にリンクを記入してください。|웹 가져오기 및 패키징은 전체 1 GiB, 파일당 512 MiB, 10000개 파일까지입니다. Issue 첨부 한도를 넘는 ZIP은 본인 GitHub Release(파일당 2 GiB 미만)에 올리고 제출 시 링크를 기재하세요.
公开 ZIP 最大 32 MB；保存草稿与下载 ZIP 不会发布。|Public ZIP maximum: 32 MB. Saving a draft or downloading ZIP does not publish.|公開ZIPは32 MBまで。下書き保存やZIPダウンロードだけでは公開されません。|공개 ZIP은 최대 32 MB입니다. 초안 저장 및 ZIP 다운로드는 게시가 아닙니다.
提交投稿后待审核收录，不会自动在广场上线。|Submissions await review and are not automatically listed.|投稿後は審査・収録を待ちます。自動で広場に公開されません。|제출 후 검토 및 등록을 기다립니다. 갤러리에 자동 게시되지 않습니다.
发布结果以服务器确认为准。|Publication requires server confirmation.|公開結果はサーバーの確認に従います。|게시 결과는 서버 확인에 따릅니다.
制作插件需符合本系统 SDK 并补齐声明附件；原项目格式请使用“导入插件”。|Created plugins must follow this system's SDK and include declared attachments. Use “Import plugin” for original project formats.|制作するプラグインは本システムのSDKに準拠し、宣言した添付を揃えてください。元プロジェクト形式は「インポート」を利用します。|제작 플러그인은 시스템 SDK를 따르고 선언된 첨부 파일을 포함해야 합니다. 원본 형식에는 “플러그인 가져오기”를 사용하세요.
通过本系统静态包检查，实际运行由创作者测试。|Passed static package validation; runtime testing is the creator's responsibility.|静的パッケージ検査に合格しました。実際の動作は制作者がテストします。|정적 패키지 검사를 통과했습니다. 실제 실행은 제작자가 테스트합니다.
导入保持原项目，运行环境与行为以包内说明为准。|Import preserves the original project. Follow the package's runtime requirements and instructions.|インポートは元プロジェクトを保持します。実行環境と動作はパッケージ内の説明に従ってください。|가져오기는 원본 프로젝트를 유지합니다. 실행 환경과 동작은 패키지 설명을 따릅니다.
清单未请求权限。|The manifest requests no permissions.|マニフェストに権限要求はありません。|매니페스트가 권한을 요청하지 않습니다.
浏览器未打开新页，可点击上方“打开本站投稿表单”。|The browser did not open a new page. Use “Open submission form” above.|新しいページが開きませんでした。上の投稿フォームのリンクをご利用ください。|새 페이지가 열리지 않았습니다. 위의 제출 양식 링크를 이용하세요.
当前页面没有发布服务。文件仍在本浏览器，可保存草稿或下载分享 ZIP。|This page has no publication service. Files remain in this browser; save a draft or download the ZIP.|このページには公開サービスがありません。ファイルはブラウザー内に残るため、下書き保存やZIPダウンロードができます。|이 페이지에는 게시 서비스가 없습니다. 파일은 브라우저에 유지되므로 초안을 저장하거나 ZIP을 다운로드하세요.
投稿入口尚未开放。当前作品草稿已保存，可下载完整分享包。|Submission is not open. Draft saved; download the complete sharing package.|投稿はまだ開始されていません。下書きは保存済みで、完全な共有パックをダウンロードできます。|제출 메뉴가 아직 열리지 않았습니다. 초안은 저장되었으며 전체 공유 패키지를 다운로드할 수 있습니다.
公开插件 ZIP 最大 32 MB，请精简后再发布；完整分享包可在下方下载保留。|Public plugin ZIP maximum: 32 MB. Reduce it before publishing; keep the complete package by downloading below.|公開プラグインZIPは32 MBまでです。公開用を小さくし、完全版は下からダウンロードして保持してください。|공개 플러그인 ZIP은 최대 32 MB입니다. 게시 전에 줄이고 전체 패키지는 아래에서 다운로드해 보관하세요.
作品已发布到公开广场。|Work published to the public gallery.|作品を公開広場に掲載しました。|작품을 공개 갤러리에 게시했습니다.
预览超时|Preview timed out|プレビューがタイムアウトしました|미리 보기 시간 초과
预览无法解码|Preview could not be decoded|プレビューを読み込めません|미리 보기 디코딩 불가
公共统计暂时无法读取，请刷新重试。|Shared statistics could not be loaded. Refresh and retry.|公開統計を読み込めません。再読込してください。|공유 통계를 읽지 못했습니다. 새로 고침 후 다시 시도하세요.
发布服务暂时无法连接，请刷新页面重试。文件不会自动上传。|Publication service could not be reached. Refresh and retry. Files are not uploaded automatically.|公開サービスに接続できません。再読込してください。ファイルは自動アップロードされません。|게시 서비스에 연결할 수 없습니다. 새로 고침하세요. 파일은 자동 업로드되지 않습니다.
公开作品暂时无法读取，请刷新重试。|Public works could not be loaded. Refresh and retry.|公開作品を読み込めません。再読込してください。|공개 작품을 읽지 못했습니다. 새로 고침하세요.
草稿保存中断。|Draft saving interrupted.|下書きの保存が中断されました。|초안 저장이 중단되었습니다.
导入后读取清单，网页不会执行上传的代码。|The manifest is read after import; the website does not execute uploaded code.|インポート後にマニフェストを読みます。アップロードされたコードは実行しません。|가져온 후 매니페스트를 읽으며 웹은 업로드한 코드를 실행하지 않습니다.
作品信息与完整文件已保存到此浏览器草稿。没有上传；清理网站数据会删除草稿。|Work information and files saved in this browser's draft, without upload. Clearing site data removes the draft.|作品情報と全ファイルをブラウザーの下書きに保存しました。アップロードはされていません。サイトデータを消すと下書きも削除されます。|작품 정보와 전체 파일을 브라우저 초안에 저장했습니다. 업로드하지 않았으며 사이트 데이터를 삭제하면 초안도 삭제됩니다.
此浏览器尚无该类型草稿。|No draft of this type in this browser.|この種類の下書きはまだありません。|이 브라우저에 해당 유형의 초안이 없습니다.
已读取旧版草稿，旧记录保留。保存后写入当前独立入口，不覆盖旧草稿。|Legacy draft loaded and retained. Saving writes to the current workflow without overwriting it.|旧版の下書きを読み込みました。旧記録は保持し、保存時は現在の制作入口に記録します。|이전 초안을 읽고 유지했습니다. 저장하면 현재 제작 방식에 기록하며 이전 초안을 덮어쓰지 않습니다.
已恢复当前入口的作品草稿与文件，可继续编辑。插件发布以服务确认结果为准，桌宠仍可下载分享包。|Draft and files restored for this workflow. Continue editing. Plugin publication requires service confirmation; pet sharing packages remain downloadable.|この制作入口の下書きとファイルを復元しました。編集を続けられます。プラグイン公開はサービスの確認に従い、ペットは共有パックをダウンロードできます。|현재 제작 방식의 초안과 파일을 복원했습니다. 편집을 계속하세요. 플러그인 게시는 서비스 확인에 따르며 펫 공유 패키지는 다운로드할 수 있습니다.
浏览器未允许保存，制作需求与关注仅在当前页面保留。|Browser storage is unavailable; requests and follows stay on this page only.|ブラウザーが保存を許可していないため、リクエストとフォローは現在のページにのみ保持されます。|브라우저 저장 불가. 제작 요청과 팔로우는 현재 페이지에만 유지됩니다.
已保存 100 项需求，请先导出已有需求。|100 requests saved. Export existing requests first.|100件のリクエストを保存済みです。先に既存のものを出力してください。|요청 100개가 저장되었습니다. 먼저 기존 요청을 내보내세요.
需求草稿已保存。|Request draft saved.|リクエストの下書きを保存しました。|요청 초안을 저장했습니다.
需求保留在当前页面，浏览器未允许持久保存。|Request kept on this page; browser persistence is unavailable.|リクエストは現在のページに保持され、永続保存は許可されていません。|요청이 현재 페이지에 유지되며 브라우저 영구 저장은 불가합니다.
本机页面不提供公共投稿，草稿已保存。请到公开共创平台发布。|Local preview does not offer public submission. Draft saved; publish on the public community.|ローカル画面では公開投稿できません。下書きは保存済みです。公開プラットフォームから投稿してください。|로컬 화면은 공개 제출을 제공하지 않습니다. 초안은 저장되었습니다. 공개 플랫폼에서 게시하세요.
草稿已保存，投稿入口尚未开放。|Draft saved; submission is not open yet.|下書きは保存済みですが、投稿はまだ開始されていません。|초안이 저장되었으며 제출 메뉴는 아직 열리지 않았습니다.
制作需求已发布到需求广场。|Request published to the request gallery.|制作リクエストを広場に投稿しました。|제작 요청을 요청 갤러리에 게시했습니다.
制作需求已保存到此浏览器。可导出交给你选择的 AI；尚未公开投稿。|Request saved in this browser. Export it for your chosen AI; it has not been publicly submitted.|リクエストをブラウザーに保存しました。選んだAIに渡せます。公開投稿はまだ行っていません。|요청을 브라우저에 저장했습니다. 선택한 AI에 내보낼 수 있으며 공개 제출은 아직 하지 않았습니다.
需求已加入当前页面；浏览器未允许持久保存，请及时导出。|Request added to this page. Browser persistence is unavailable; export it soon.|リクエストを現在のページに追加しました。永続保存できないため、早めに出力してください。|요청을 현재 페이지에 추가했습니다. 영구 저장이 불가하므로 내보내세요.
先保存一项制作需求，或支持、关注一项提案，再导出。|Save a request or support/follow a proposal before exporting.|リクエストを保存するか、提案を応援・フォローしてから出力してください。|요청을 저장하거나 제안을 응원 또는 팔로우한 후 내보내세요.
制作需求说明已生成，下方可直接复制；保存链接用于下载 Markdown。|Request notes generated. Copy below or use the save link to download Markdown.|リクエスト説明を作成しました。下からコピーするか、保存リンクでMarkdownをダウンロードできます。|요청 설명을 생성했습니다. 아래에서 복사하거나 저장 링크로 Markdown을 다운로드하세요.
制作需求已复制，可以交给你选择的 AI。|Request copied for your chosen AI.|制作リクエストをコピーしました。選んだAIに渡せます。|제작 요청을 복사했습니다. 선택한 AI에 전달하세요.
本机合集链接已复制；其他电脑请分享作品 ZIP。|Local collection link copied; share work ZIPs for other computers.|ローカルコレクションのリンクをコピーしました。他のパソコンには作品ZIPを共有してください。|로컬 모음 링크를 복사했습니다. 다른 컴퓨터에는 작품 ZIP을 공유하세요.
合集链接已复制。|Collection link copied.|コレクションのリンクをコピーしました。|모음 링크를 복사했습니다.
`;
Object.assign(uiMessages, Object.fromEntries(feedbackRows.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); if (values.length !== 3) throw new Error('界面词典列数无效：'+key); return [key, values]; })));
// 动态模板整句匹配，作品名、署名及路径只做原样文本插值。
const templateRows = `
共 {0} 只宠物|{0} pets|ペット {0} 件|펫 {0}개
共 {0} 个插件|{0} plugins|プラグイン {0} 件|플러그인 {0}개
已收录 {0} 只精品宠物|{0} pets collected|ペット {0} 件を収録|펫 {0}개 등록
已展示 {0} 只宠物|Showing {0} pets|ペット {0} 件を表示|펫 {0}개 표시
已展示 {0} 个插件|Showing {0} plugins|プラグイン {0} 件を表示|플러그인 {0}개 표시
已展示 {0} 只宠物 · 匹配 {1} 个作品|Showing {0} pets · {1} matching works|ペット {0} 件を表示 · 一致作品 {1} 件|펫 {0}개 표시 · 일치 작품 {1}개
已展示 {0} 个插件 · 匹配 {1} 个作品|Showing {0} plugins · {1} matching works|プラグイン {0} 件を表示 · 一致作品 {1} 件|플러그인 {0}개 표시 · 일치 작품 {1}개
加载更多（剩余 {0}）|Load more ({0} remaining)|もっと見る（残り {0} 件）|더 보기 (남은 {0}개)
此浏览器发起 {0} 次下载|{0} downloads initiated by this browser|このブラウザーから {0} 回ダウンロード|이 브라우저에서 {0}회 다운로드
{0} 只宠物|{0} pets|ペット {0} 件|펫 {0}개
{0} 个插件|{0} plugins|プラグイン {0} 件|플러그인 {0}개
近 7 日 {0}|Last 7 days: {0}|直近7日 {0}|최근 7일 {0}
累计 {0}|All time: {0}|累計 {0}|누적 {0}
本站贡献 {0} 只桌宠|{0} pets contributed|ペット {0} 件を提供|펫 {0}개 기여
本站贡献 {0} 个插件|{0} plugins contributed|プラグイン {0} 件を提供|플러그인 {0}개 기여
本站贡献 {0} 件作品|{0} works contributed|作品 {0} 件を提供|작품 {0}개 기여
{0} 的桌宠|{0}'s pets|{0} のペット|{0}의 펫
{0} 的插件|{0}'s plugins|{0} のプラグイン|{0}의 플러그인
桌宠 {0}|Pets {0}|ペット {0}|펫 {0}
插件 {0}|Plugins {0}|プラグイン {0}|플러그인 {0}
作者 {0}|Author {0}|作者 {0}|작가 {0}
作者：{0}|Author: {0}|作者：{0}|작가: {0}
作者：{0} · V{1} · {2}|Author: {0} · V{1} · {2}|作者：{0} · V{1} · {2}|작가: {0} · V{1} · {2}
{0} · 动作预览|{0} · Action preview|{0} · アクションプレビュー|{0} · 동작 미리 보기
查看 {0}|View {0}|{0} を見る|{0} 보기
安装 {0}|Install {0}|{0} をインストール|{0} 설치
分享 {0}|Share {0}|{0} を共有|{0} 공유
浏览 {0}|Browse {0}|{0} を見る|{0} 둘러보기
{0} 预览|{0} preview|{0} のプレビュー|{0} 미리 보기
{0} 封面|{0} cover|{0} の表紙|{0} 표지
保存 {0}|Save {0}|{0} を保存|{0} 저장
正在预览：{0}|Previewing: {0}|プレビュー：{0}|미리 보기: {0}
桌宠预览：{0}|Pet preview: {0}|ペットのプレビュー：{0}|펫 미리 보기: {0}
正在预览：{0} · 原素材背景|Previewing: {0} · Original background|プレビュー：{0} · 元素材の背景|미리 보기: {0} · 원본 배경
绑定预览：{0} → {1}|Binding preview: {0} → {1}|対応プレビュー：{0} → {1}|연결 미리 보기: {0} → {1}
注视 {0}°{1}|Gaze {0}°{1}|視線 {0}°{1}|시선 {0}°{1}
{0}° · {1}|{0}° · {1}|{0}° · {1}|{0}° · {1}
V{0} 图集已通过尺寸、单图、透明与可见内容检查。|V{0} atlas passed dimension, single-image, transparency and visible-content checks.|V{0}シートの寸法・単一画像・透明・可視内容を確認しました。|V{0} 시트의 크기, 단일 이미지, 투명 및 가시 내용 검사를 통과했습니다.
已添加 {0} 个动作，可编辑名称与种类。|{0} actions added. Edit their names and types.|{0}アクションを追加しました。名前と種類を編集できます。|동작 {0}개를 추가했습니다. 이름 및 종류를 편집하세요.
{0} 个文件 · {1} MB|{0} files · {1} MB|{0} ファイル · {1} MB|파일 {0}개 · {1} MB
另有 {0} 个文件，导出时全部保留|{0} more files; all retained in export|他に {0} ファイルあり、すべて出力に保持|파일 {0}개 추가, 내보내기에 모두 유지
不支持：{0}|Unsupported: {0}|非対応：{0}|지원하지 않음: {0}
封面未更新：{0}|Cover not updated: {0}|表紙は未更新：{0}|표지 미갱신: {0}
请使用真实 WebP：{0}。|Use a valid WebP: {0}.|有効なWebPを使用してください：{0}。|유효한 WebP를 사용하세요: {0}.
图片尺寸与清单不符：{0}。|Image dimensions do not match the manifest: {0}.|画像の寸法がマニフェストと一致しません：{0}。|이미지 크기가 매니페스트와 일치하지 않습니다: {0}.
动画帧数无效：{0}。|Invalid animation frame count: {0}.|アニメーションのコマ数が無効です：{0}。|애니메이션 프레임 수가 유효하지 않습니다: {0}.
动画帧尺寸无效：{0}。|Invalid animation frame dimensions: {0}.|アニメーションのコマ寸法が無効です：{0}。|애니메이션 프레임 크기가 유효하지 않습니다: {0}.
未确认发布：{0}|Publication not confirmed: {0}|公開未確認：{0}|게시 미확인: {0}
草稿未保存：{0}。请下载分享包保留作品。|Draft not saved: {0}. Download the sharing package to retain your work.|下書き未保存：{0}。共有パックをダウンロードして保存してください。|초안 미저장: {0}. 공유 패키지를 다운로드하여 보관하세요.
「{0}」已发布到桌宠广场，可浏览和下载。|“{0}” published to the pet gallery for browsing and download.|「{0}」をペット広場に公開しました。閲覧・ダウンロードできます。|“{0}”을 펫 갤러리에 게시했습니다. 탐색 및 다운로드할 수 있습니다.
「{0}」已发布到插件广场，可浏览和下载。|“{0}” published to the plugin gallery for browsing and download.|「{0}」をプラグイン広場に公開しました。閲覧・ダウンロードできます。|“{0}”을 플러그인 갤러리에 게시했습니다. 탐색 및 다운로드할 수 있습니다.
请填写{0}。|Please enter {0}.|{0}を入力してください。|{0}을(를) 입력하세요.
{0}格式无效或超过 {1} 字。|{0} is invalid or exceeds {1} characters.|{0}の形式が無効、または{1}文字を超えています。|{0} 형식이 잘못되었거나 {1}자를 초과합니다.
公开作品的{0}格式无效。|Invalid public work {0}.|公開作品の{0}が無効です。|공개 작품의 {0} 형식이 유효하지 않습니다.
发布服务返回 {0}。|Publication service returned {0}.|公開サービスが{0}を返しました。|게시 서비스가 {0}을(를) 반환했습니다.
`;
export const uiTemplates = templateRows.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); if (values.length !== 3) throw new Error('界面模板列数无效：'+key); return [key, values]; });

const packageMessages = `
作品 ID 只能包含小写字母、数字、短横线和下划线，不能使用系统保留名。|Work ID allows lowercase letters, digits, hyphens and underscores; reserved names are forbidden.|作品IDは小文字・数字・ハイフン・下線のみで、予約名は使えません。|작품 ID는 소문자, 숫자, 하이픈, 밑줄만 허용하며 예약 이름은 사용할 수 없습니다.
请选择有效的 V1 或 V2 图集。|Choose a valid V1 or V2 atlas.|有効なV1またはV2シートを選択してください。|유효한 V1 또는 V2 시트를 선택하세요.
插件 ID 需为 3 至 64 位小写字母、数字、点、短横线或下划线，不能使用内置前缀和系统保留名。|Plugin ID requires 3–64 lowercase letters, digits, dots, hyphens or underscores; no built-in prefixes or reserved names.|プラグインIDは小文字・数字・ドット・ハイフン・下線の3～64文字で、内蔵接頭辞と予約名は使えません。|플러그인 ID는 소문자, 숫자, 점, 하이픈, 밑줄 3~64자이며 기본 접두사와 예약 이름은 사용할 수 없습니다.
台词|Dialogue|台詞|대사
请直接填写台词，不要使用未定义的翻译引用。|Enter dialogue directly; do not use undefined translation references.|未定義の翻訳参照を使わず台詞を直接入力してください。|정의되지 않은 번역 참조 대신 대사를 직접 입력하세요.
间隔必须为 5 至 1440 的整数分钟。|Interval must be an integer from 5 to 1440 minutes.|間隔は5～1440分の整数を指定してください。|간격은 5~1440의 정수 분이어야 합니다.
请选择支持的反应。|Choose a supported response.|対応する反応を選択してください。|지원하는 반응을 선택하세요.
分享说明过大。|Sharing notes are too large.|共有説明が大きすぎます。|공유 설명이 너무 큽니다.
素材包最多包含 10000 个文件。|Package maximum: 10000 files.|素材パックは10000ファイルまでです。|패키지에는 최대 10000개 파일을 포함할 수 있습니다.
包文件内容无效。|Invalid package file contents.|パッケージのファイル内容が無効です。|패키지 파일 내용이 유효하지 않습니다.
单文件超过 512 MiB。|File exceeds 512 MiB.|ファイルが512 MiBを超えています。|파일이 512 MiB를 초과합니다.
素材包超过 1 GiB；请按投稿指南使用完整包链接。|Package exceeds 1 GiB. Use a complete-package link per the submission guide.|素材パックが1 GiBを超えています。投稿ガイドに従い完全版のリンクを利用してください。|패키지가 1 GiB를 초과합니다. 제출 안내에 따라 전체 패키지 링크를 사용하세요.
文件路径无效：请使用不含上级目录、绝对地址或系统保留名的包内路径。|Invalid path. Use package-relative paths without parent traversal, absolute paths or reserved names.|無効なパスです。上位ディレクトリ・絶対パス・予約名を含まないパッケージ内パスを使用してください。|잘못된 경로입니다. 상위 폴더, 절대 경로 또는 예약 이름 없는 패키지 내부 경로를 사용하세요.
ZIP 超过 1 GiB；请按投稿指南使用完整包链接。|ZIP exceeds 1 GiB. Use a complete-package link per the submission guide.|ZIPが1 GiBを超えています。投稿ガイドに従い完全版のリンクを利用してください。|ZIP이 1 GiB를 초과합니다. 제출 안내에 따라 전체 패키지 링크를 사용하세요.
ZIP 目录损坏或不是受支持的 ZIP。|ZIP directory is corrupt or unsupported.|ZIPのディレクトリが破損しているか非対応です。|ZIP 디렉터리가 손상되었거나 지원하지 않는 ZIP입니다.
不支持分卷 ZIP，或文件数量超过 10000。|Split ZIPs are unsupported, or file count exceeds 10000.|分割ZIPは非対応、または10000ファイルを超えています。|분할 ZIP은 지원하지 않거나 파일 수가 10000개를 초과합니다.
ZIP 文件目录损坏。|ZIP file directory is corrupt.|ZIPのファイルディレクトリが破損しています。|ZIP 파일 디렉터리가 손상되었습니다.
ZIP 包含加密文件、链接或不支持的压缩方式。|ZIP contains encrypted files, links or unsupported compression.|ZIPに暗号化ファイル・リンク・非対応の圧縮方式が含まれています。|ZIP에 암호화 파일, 링크 또는 지원하지 않는 압축 방식이 있습니다.
ZIP 包含重名文件。|ZIP contains duplicate filenames.|ZIPに同名ファイルが含まれています。|ZIP에 중복 파일 이름이 있습니다.
ZIP 内文件大小或总量超过读取限制。|ZIP file or total size exceeds reading limits.|ZIP内のファイルまたは合計サイズが読み込み上限を超えています。|ZIP 파일 또는 전체 크기가 읽기 제한을 초과합니다.
ZIP 文件头损坏。|ZIP header is corrupt.|ZIPヘッダーが破損しています。|ZIP 헤더가 손상되었습니다.
ZIP 文件数据越界。|ZIP data is out of bounds.|ZIPのデータが範囲外です。|ZIP 데이터가 범위를 벗어납니다.
ZIP 文件校验失败。|ZIP verification failed.|ZIPの検証に失敗しました。|ZIP 검증에 실패했습니다.
请选择 1 至 10000 个文件。|Choose 1–10000 files.|1～10000ファイルを選択してください。|파일 1~10000개를 선택하세요.
文件内容无效。|Invalid file contents.|ファイル内容が無効です。|파일 내용이 유효하지 않습니다.
单文件超过 512 MiB 或文件总量超过 1 GiB。|A file exceeds 512 MiB or total exceeds 1 GiB.|1ファイルが512 MiB、または合計が1 GiBを超えています。|파일이 512 MiB 또는 전체가 1 GiB를 초과합니다.
存在大小写冲突的同名文件。|Filenames conflict when ignoring case.|大文字と小文字を区別しないと同名になるファイルがあります。|대소문자를 무시하면 충돌하는 파일 이름이 있습니다.
插件 assets 需要按素材种类声明文件。|Plugin assets must declare files by material type.|プラグインのassetsは素材種類ごとにファイルを宣言してください。|플러그인 assets는 소재 종류별로 파일을 선언해야 합니다.
插件素材种类或文件声明无效。|Invalid plugin material type or file declaration.|プラグインの素材種類またはファイル宣言が無効です。|플러그인 소재 종류 또는 파일 선언이 유효하지 않습니다.
插件 panels 需要声明对应页面文件。|Plugin panels must declare their page files.|プラグインのpanelsは対応するページファイルを宣言してください。|플러그인 panels는 해당 페이지 파일을 선언해야 합니다.
Shimeji 图像序列 · 桌面导入转换，Java 行为需专用引擎|Shimeji image sequence · Desktop import conversion; Java behavior requires a dedicated engine|Shimeji画像列 · デスクトップで変換、Javaの挙動には専用エンジンが必要|Shimeji 이미지 시퀀스 · 데스크톱에서 변환, Java 동작은 전용 엔진 필요
自定义桌宠素材|Custom pet material|カスタムペット素材|사용자 지정 펫 소재
未识别宿主插件|Unrecognized host plugin|未認識のホストプラグイン|인식되지 않은 호스트 플러그인
清单超过 1 MB。|Manifest exceeds 1 MB.|マニフェストが1 MBを超えています。|매니페스트가 1 MB를 초과합니다.
作品清单不是有效的 JSON，请检查后重新导入。|Work manifest is not valid JSON. Check and import again.|作品マニフェストが有効なJSONではありません。確認して再インポートしてください。|작품 매니페스트가 유효한 JSON이 아닙니다. 확인 후 다시 가져오세요.
清单需要是 JSON 对象。|Manifest must be a JSON object.|マニフェストはJSONオブジェクトである必要があります。|매니페스트는 JSON 객체여야 합니다.
动作包需要 idle 待机动作，其他状态可绑定任意动作。|Action package requires idle; other states may bind to any action.|アクションパックにはidleが必要です。他の状態には任意のアクションを設定できます。|동작 패키지에는 idle이 필요하며 다른 상태는 아무 동작에 연결할 수 있습니다.
独立动作包|Individual-action package|個別アクションパック|개별 동작 패키지
WebP 图集包|WebP atlas package|WebPシートパック|WebP 시트 패키지
其他桌宠格式 · 可保存分享，运行需适配|Other pet format · Archive and share; runtime adaptation required|他のペット形式 · 保存・共有可能、実行には対応が必要|다른 펫 형식 · 보관 및 공유 가능, 실행은 호환 필요
声明式|Declarative|宣言型|선언형
SDK 1 · 声明式|SDK 1 · Declarative|SDK 1 · 宣言型|SDK 1 · 선언형
其他宿主插件 · 可保存分享，运行需适配|Other host plugin · Archive and share; runtime adaptation required|他のホストのプラグイン · 保存・共有可能、実行には対応が必要|다른 호스트 플러그인 · 보관 및 공유 가능, 실행은 호환 필요
插件清单超过 64 KB。|Plugin manifest exceeds 64 KB.|プラグインマニフェストが64 KBを超えています。|플러그인 매니페스트가 64 KB를 초과합니다.
JavaScript 插件需要声明入口文件。|JavaScript plugin must declare an entry file.|JavaScriptプラグインは入口ファイルを宣言してください。|JavaScript 플러그인은 진입 파일을 선언해야 합니다.
插件入口超过 1 MB。|Plugin entry exceeds 1 MB.|プラグイン入口が1 MBを超えています。|플러그인 진입 파일이 1 MB를 초과합니다.
`;
Object.assign(uiMessages, Object.fromEntries(packageMessages.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); if (values.length !== 3) throw new Error('界面词典列数无效：'+key); return [key, values]; })));
const moreMessages = `
超过 1 GiB 完整包导入上限；请保留原件并使用原宿主，不能直接运行导入。|Package exceeds the 1 GiB import limit. Keep the original and use its original host.|インポート上限1 GiBを超えています。原本を保持し元のホストを利用してください。|가져오기 한도 1 GiB를 초과합니다. 원본을 보관하고 원본 호스트를 사용하세요.
请上传 1 至 100 个独立动作。|Upload 1–100 individual actions.|1～100個の個別アクションをアップロードしてください。|개별 동작 1~100개를 업로드하세요.
动作 ID 需唯一，使用小写字母、数字、短横线和下划线，并避开系统保留标识。|Action IDs must be unique lowercase letters, digits, hyphens or underscores, without reserved identifiers.|アクションIDは小文字・数字・ハイフン・下線を使い、重複と予約識別子を避けてください。|동작 ID는 고유한 소문자, 숫자, 하이픈 또는 밑줄이며 예약 식별자를 피하세요.
动作需为 MP4、WebM 或动画 WebP。|Actions must be MP4, WebM or animated WebP.|アクションはMP4、WebM、アニメーションWebPを使用してください。|동작은 MP4, WebM 또는 애니메이션 WebP여야 합니다.
请选择待机动作。|Choose an idle action.|待機アクションを選択してください。|대기 동작을 선택하세요.
AI 与交互状态绑定无效。|Invalid AI or interaction-state binding.|AI・操作状態の対応が無効です。|AI 또는 상호작용 상태 연결이 유효하지 않습니다.
状态绑定的动作不存在。|The action bound to a state does not exist.|状態に設定したアクションが存在しません。|상태에 연결된 동작이 없습니다.
请选择透明通道或有效去背颜色。|Choose alpha transparency or a valid chroma-key color.|透明チャンネルまたは有効な背景除去色を選択してください。|투명 채널 또는 유효한 배경 제거 색상을 선택하세요.
MP4 没有透明通道，请选择纯色背景去背。|MP4 has no alpha channel. Choose solid-color background removal.|MP4には透明チャンネルがありません。単色背景除去を選択してください。|MP4에는 투명 채널이 없습니다. 단색 배경 제거를 선택하세요.
封面需为 10 MB 以内的 PNG、JPEG 或 WebP 图片。|Cover must be PNG, JPEG or WebP within 10 MB.|表紙は10 MB以下のPNG、JPEG、WebPを使用してください。|표지는 10 MB 이하 PNG, JPEG 또는 WebP여야 합니다.
封面需为 PNG、JPEG 或 WebP 图片，不支持 SVG 或网页文件。|Cover must be PNG, JPEG or WebP. SVG and webpages are unsupported.|表紙はPNG、JPEG、WebPを使用してください。SVGとウェブページは非対応です。|표지는 PNG, JPEG 또는 WebP여야 합니다. SVG와 웹페이지는 지원하지 않습니다.
清单或附件不完整|Incomplete manifest or attachments|マニフェストまたは添付が不足|매니페스트 또는 첨부 파일 불완전
发现多个作品目录，请单独选择需要运行的作品包；当前只保留整个目录归档，不自动选择其中一个。|Multiple work folders found. Select one to run. This import archives the entire folder without choosing automatically.|複数の作品フォルダーがあります。実行する作品を個別に選択してください。現在は全体を保存し、自動選択しません。|작품 폴더가 여러 개입니다. 실행할 작품을 선택하세요. 현재는 전체 폴더를 보관하며 자동 선택하지 않습니다.
本系统只支持 V1 或 V2 WebP 图集结构。|This system supports only V1 or V2 WebP atlases.|本システムはV1・V2のWebPシート構造のみ対応します。|이 시스템은 V1 또는 V2 WebP 시트 구조만 지원합니다.
SDK 清单缺少有效的编号、名称、版本或权限声明。|SDK manifest lacks a valid ID, name, version or permissions declaration.|SDKマニフェストに有効なID・名前・バージョン・権限声明がありません。|SDK 매니페스트에 유효한 ID, 이름, 버전 또는 권한 선언이 없습니다.
未识别格式|Unrecognized format|未認識の形式|인식되지 않은 형식
超过 1 GiB 或 10000 文件上限。|Exceeds 1 GiB or 10000 files.|1 GiBまたは10000ファイルの上限を超えています。|1 GiB 또는 10000개 파일 한도를 초과합니다.
原逻辑仍需专用引擎。|Original behavior requires a dedicated engine.|元の挙動には専用エンジンが必要です。|원본 동작에는 전용 엔진이 필요합니다.
需要原宿主。|Original host required.|元のホストが必要です。|원본 호스트가 필요합니다.
未识别运行格式。|Unrecognized runtime format.|実行形式を認識できません。|실행 형식을 인식할 수 없습니다.
完整原包归档与下载|Complete original archive and download|元の完全パッケージの保存・ダウンロード|전체 원본 패키지 보관 및 다운로드
已知桌宠清单与声明动作素材|Known pet manifest and declared action materials|既知のペットマニフェストと宣言された素材|알려진 펫 매니페스트 및 선언된 동작 소재
SDK 清单、入口与声明附件|SDK manifest, entry and declared attachments|SDKマニフェスト・入口・宣言された添付|SDK 매니페스트, 진입 파일 및 선언된 첨부
直接运行导入|Run imported work directly|インポート作品を直接実行|가져온 작품 직접 실행
本系统动作控制|System action controls|本システムのアクション制御|시스템 동작 제어
AI 状态绑定|AI-state bindings|AI状態との対応|AI 상태 연결
本系统运行配置|System runtime settings|本システムの実行設定|시스템 실행 설정
自动执行原项目逻辑|Automatically execute original project logic|元プロジェクトの処理を自動実行|원본 프로젝트 로직 자동 실행
作品封面附件缺失，可重新选择；原清单和其他文件仍会保留。|Cover attachment missing. Choose again; original manifest and other files are retained.|表紙がありません。選び直してください。元のマニフェストと他ファイルは保持されます。|표지 첨부 파일이 없습니다. 다시 선택하세요. 원본 매니페스트와 다른 파일은 유지됩니다.
作品封面附件无法读取，原包文件仍会保留。|Cover attachment cannot be read. Original files are retained.|表紙を読み込めません。元のファイルは保持されます。|표지 첨부 파일을 읽을 수 없습니다. 원본 파일은 유지됩니다.
封面文件扩展名与图片内容不一致。|Cover extension does not match image contents.|表紙の拡張子と画像内容が一致しません。|표지 확장자와 이미지 내용이 일치하지 않습니다.
封面路径与已有文件冲突，请重新选择封面。|Cover path conflicts with an existing file. Choose again.|表紙のパスが既存ファイルと競合します。選び直してください。|표지 경로가 기존 파일과 충돌합니다. 다시 선택하세요.
请选择制作或导入入口。|Choose a creation or import workflow.|制作またはインポートを選択してください。|제작 또는 가져오기 방식을 선택하세요.
制作包不符合本系统格式；原项目请使用导入入口。|Created package does not match this system. Use import for original projects.|制作パックが本システム形式に合いません。元プロジェクトにはインポートを使用してください。|제작 패키지가 시스템 형식에 맞지 않습니다. 원본 프로젝트는 가져오기를 사용하세요.
制作需求格式无效。|Invalid request format.|制作リクエストの形式が無効です。|제작 요청 형식이 유효하지 않습니다.
角色名称|Character name|キャラクター名|캐릭터 이름
创作说明|Creation notes|制作説明|제작 설명
请选择支持的角色分类。|Choose a supported character category.|対応するキャラクター分類を選択してください。|지원하는 캐릭터 분류를 선택하세요.
请选择 V1 或 V2 图集。|Choose a V1 or V2 atlas.|V1・V2シートを選択してください。|V1 또는 V2 시트를 선택하세요.
此合集不存在，请从列表重新选择。|Collection does not exist. Choose from the list.|コレクションがありません。一覧から選び直してください。|모음이 없습니다. 목록에서 다시 선택하세요.
`;
Object.assign(uiMessages, Object.fromEntries(moreMessages.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); if (values.length !== 3) throw new Error('界面词典列数无效：'+key); return [key, values]; })));
const serviceMessages = `
投稿仓库与本站配置不一致。|Submission repository does not match site configuration.|投稿リポジトリがサイト設定と一致しません。|제출 저장소가 사이트 설정과 일치하지 않습니다.
投稿仓库尚未配置。|Submission repository is not configured.|投稿リポジトリが未設定です。|제출 저장소가 설정되지 않았습니다.
投稿仓库地址无效。|Invalid submission repository address.|投稿リポジトリのアドレスが無効です。|제출 저장소 주소가 유효하지 않습니다.
制作需求图集版本无效。|Invalid requested atlas version.|リクエストのシートバージョンが無効です。|요청의 시트 버전이 유효하지 않습니다.
投稿作品类型无效。|Invalid submitted work type.|投稿作品の種類が無効です。|제출 작품 유형이 유효하지 않습니다.
分享包名称|Sharing package name|共有パック名|공유 패키지 이름
分享包摘要无效。|Invalid sharing package digest.|共有パックのハッシュが無効です。|공유 패키지 해시가 유효하지 않습니다.
公开插件编号无效。|Invalid public plugin ID.|公開プラグインのIDが無効です。|공개 플러그인 ID가 유효하지 않습니다.
公开插件文件地址无效。|Invalid public plugin file URL.|公開プラグインのファイルURLが無効です。|공개 플러그인 파일 URL이 유효하지 않습니다.
公开桌宠编号无效。|Invalid public pet ID.|公開ペットのIDが無効です。|공개 펫 ID가 유효하지 않습니다.
公开桌宠地址无效。|Invalid public pet URL.|公開ペットのURLが無効です。|공개 펫 URL이 유효하지 않습니다.
公开桌宠动作超过 128 个。|Public pet exceeds 128 actions.|公開ペットのアクションが128個を超えています。|공개 펫 동작이 128개를 초과합니다.
公开桌宠动作无效。|Invalid public pet actions.|公開ペットのアクションが無効です。|공개 펫 동작이 유효하지 않습니다.
公共互动数据无效。|Invalid shared interaction data.|公開の反応データが無効です。|공유 반응 데이터가 유효하지 않습니다.
公共互动记录无效。|Invalid shared interaction records.|公開の反応記録が無効です。|공유 반응 기록이 유효하지 않습니다.
公共每周互动记录无效。|Invalid shared weekly interaction records.|公開の週間反応記録が無効です。|공유 주간 반응 기록이 유효하지 않습니다.
贡献者统计无效。|Invalid contributor statistics.|貢献者統計が無効です。|기여자 통계가 유효하지 않습니다.
贡献者关注数量无效。|Invalid contributor follower count.|貢献者のフォロワー数が無効です。|기여자 팔로워 수가 유효하지 않습니다.
发布服务身份信息无效。|Invalid publication service identity.|公開サービスの識別情報が無効です。|게시 서비스 식별 정보가 유효하지 않습니다.
公开插件列表无效。|Invalid public plugin list.|公開プラグイン一覧が無効です。|공개 플러그인 목록이 유효하지 않습니다.
请选择作品制作或导入入口。|Choose a work creation or import workflow.|作品の制作またはインポートを選択してください。|작품 제작 또는 가져오기 방식을 선택하세요.
发布服务没有确认作品已保存。|Service did not confirm the work was saved.|サービスが作品保存を確認していません。|서비스가 작품 저장을 확인하지 않았습니다.
点赞参数无效。|Invalid like parameters.|いいねのパラメーターが無効です。|좋아요 매개변수가 유효하지 않습니다.
需求列表无效。|Invalid request list.|リクエスト一覧が無効です。|요청 목록이 유효하지 않습니다.
关注参数无效。|Invalid follow parameters.|フォローのパラメーターが無効です。|팔로우 매개변수가 유효하지 않습니다.
作者作品类型无效。|Invalid author work type.|作者の作品種類が無効です。|작가 작품 유형이 유효하지 않습니다.
作者关注信息无效。|Invalid author follow information.|作者のフォロー情報が無効です。|작가 팔로우 정보가 유효하지 않습니다.
公开需求无效。|Invalid public request.|公開リクエストが無効です。|공개 요청이 유효하지 않습니다.
筛选参数无效。|Invalid filter parameters.|絞り込みのパラメーターが無効です。|필터 매개변수가 유효하지 않습니다.
广场工具注册未完成|Gallery tool registration incomplete|広場ツールの登録が未完了|갤러리 도구 등록 미완료
当前浏览器不支持广场工具|This browser does not support gallery tools|このブラウザーは広場ツール非対応です|이 브라우저는 갤러리 도구를 지원하지 않습니다
。分享 ZIP 已生成，可先下载保留。|. Sharing ZIP created; download it to keep a copy.|。共有ZIPを作成しました。ダウンロードして保存できます。|. 공유 ZIP을 생성했습니다. 다운로드하여 보관하세요.
`;
Object.assign(uiMessages, Object.fromEntries(serviceMessages.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); if (values.length !== 3) throw new Error('界面词典列数无效：'+key); return [key, values]; })));

// 这些统计组合完全由界面代码产生；原作品文字不会进入该词表。
for (const kind of ['桌宠', '插件']) for (const scope of ['全站真实互动', '此浏览器记录']) for (const period of ['近 7 日', '累计', '统计暂不可用']) {
  const source = `${kind} · ${scope} · ${period}${period === '统计暂不可用' ? '' : '互动排序'}`;
  uiMessages[source] = [0, 1, 2].map(i => `${uiMessages[kind][i]} · ${uiMessages[scope][i]} · ${uiMessages[period][i]}${period === '统计暂不可用' ? '' : [' interaction ranking', 'の反応順', ' 반응 순위'][i]}`);
}
for (const scope of ['全站', '此浏览器']) for (const status of ['下载与点赞', '统计暂不可用']) uiMessages[`${scope}${status} · 当前作品类型 · 下载不代表安装成功`] = [0, 1, 2].map(i => `${uiMessages[scope][i]} · ${uiMessages[status][i]} · ${['Current work type · Downloads do not confirm installation', '現在の作品種類 · ダウンロードはインストール成功を意味しません', '현재 작품 유형 · 다운로드는 설치 성공을 의미하지 않습니다'][i]}`);
for (const title of ['桌宠广场', '插件广场', '共创工作台', '安装指南', '社区排行榜', '制作需求广场', '精选合集', '社区创作者']) uiMessages[`${title} · desktop pet`] = uiMessages[title].map(value => value + ' · desktop pet');

const fileTemplates = `
插件 {0} 附件超过大小上限：{1}。|Plugin {0} attachment exceeds size limit: {1}.|プラグイン{0}の添付が上限を超えています：{1}。|플러그인 {0} 첨부 파일이 한도를 초과합니다: {1}.
插件面板超过 1 MB：{0}。|Plugin panel exceeds 1 MB: {0}.|プラグインパネルが1 MBを超えています：{0}。|플러그인 패널이 1 MB를 초과합니다: {0}.
翻译附件超过 256 KB：{0}。|Translation attachment exceeds 256 KB: {0}.|翻訳添付が256 KBを超えています：{0}。|번역 첨부 파일이 256 KB를 초과합니다: {0}.
翻译附件不是有效 JSON：{0}。|Translation attachment is not valid JSON: {0}.|翻訳添付が有効なJSONではありません：{0}。|번역 첨부 파일이 유효한 JSON이 아닙니다: {0}.
翻译附件需要是文字键值表：{0}。|Translation attachment requires text key-value pairs: {0}.|翻訳添付は文字列のキーと値が必要です：{0}。|번역 첨부 파일에는 문자열 키와 값이 필요합니다: {0}.
翻译附件 locales/en.json 缺少文字键：{0}。请补充完整翻译文件。|Translation locales/en.json lacks text key: {0}. Include complete translations.|locales/en.jsonに文字列キーがありません：{0}。完全な翻訳を含めてください。|locales/en.json에 문자열 키가 없습니다: {0}. 전체 번역을 포함하세요.
{0} · 仅归档分享，运行需适配|{0} · Archive and share only; runtime adaptation required|{0} · 保存・共有のみ、実行には対応が必要|{0} · 보관 및 공유만 가능, 실행은 호환 필요
插件清单字段无效：{0}。|Invalid plugin manifest field: {0}.|プラグインマニフェストの項目が無効です：{0}。|플러그인 매니페스트 필드가 유효하지 않습니다: {0}.
缺少清单引用附件：{0}。请上传包含此文件的完整文件夹或 ZIP，或补选全部配套文件。|Referenced attachment missing: {0}. Upload the complete folder or ZIP, or select all companion files.|参照する添付がありません：{0}。完全なフォルダー・ZIPか、すべての関連ファイルを選択してください。|참조 첨부 파일이 없습니다: {0}. 전체 폴더 또는 ZIP이나 모든 관련 파일을 선택하세요.
文件超过 512 MiB 上限：{0}。|File exceeds 512 MiB: {0}.|ファイルが512 MiBを超えています：{0}。|파일이 512 MiB를 초과합니다: {0}.
动作素材缺失或超过 512 MiB：{0}。|Action material missing or over 512 MiB: {0}.|アクション素材がないか512 MiBを超えています：{0}。|동작 소재가 없거나 512 MiB를 초과합니다: {0}.
MP4 文件头无效：{0}。|Invalid MP4 header: {0}.|MP4ヘッダーが無効です：{0}。|MP4 헤더가 유효하지 않습니다: {0}.
WebM 文件头无效：{0}。|Invalid WebM header: {0}.|WebMヘッダーが無効です：{0}。|WebM 헤더가 유효하지 않습니다: {0}.
WebP 文件头无效：{0}。|Invalid WebP header: {0}.|WebPヘッダーが無効です：{0}。|WebP 헤더가 유효하지 않습니다: {0}.
WebP 内容不完整：{0}。|Incomplete WebP contents: {0}.|WebPの内容が不完全です：{0}。|WebP 내용이 불완전합니다: {0}.
WebP 动作需为 2 至 600 帧、单帧不超过 2048 × 2048 的动画：{0}。|WebP action requires 2–600 frames, each at most 2048 × 2048: {0}.|WebPは2～600コマ、各コマ2048 × 2048以下のアニメーションが必要です：{0}。|WebP 동작은 2~600프레임, 각 최대 2048 × 2048이어야 합니다: {0}.
WebP 动作没有透明通道：{0}。|WebP action has no alpha channel: {0}.|WebPに透明チャンネルがありません：{0}。|WebP 동작에 투명 채널이 없습니다: {0}.
完整 ZIP 与保存链接已生成。请在本站投稿表单附上「{0}」并提交，审核收录后才会上线。{1}|Complete ZIP and save link created. Attach “{0}” to this site's submission form. Listing requires review. {1}|完全なZIPと保存リンクを作成しました。投稿フォームに「{0}」を添付して提出してください。審査後に掲載されます。{1}|전체 ZIP 및 저장 링크를 생성했습니다. 사이트 양식에 “{0}”을 첨부하세요. 검토 후 게시됩니다. {1}
需求草稿已保存。请在本站 GitHub 投稿表单提交，处理收录后才会在网站显示；也可点击下方链接打开表单。|Request draft saved. Submit through this site's GitHub form below; it appears after review.|下書きを保存しました。下のGitHub投稿フォームから提出し、審査後に掲載されます。|요청 초안을 저장했습니다. 아래 사이트 GitHub 양식으로 제출하면 검토 후 표시됩니다.
需求保留在当前页面，浏览器未允许持久保存。请在本站 GitHub 投稿表单提交，处理收录后才会在网站显示；也可点击下方链接打开表单。|Request kept on this page; browser storage is unavailable. Submit through the GitHub form below for review.|保存が許可されていないため現在のページに保持します。下のGitHubフォームから提出し、審査を受けてください。|브라우저 저장 불가로 요청을 현재 페이지에 유지합니다. 아래 GitHub 양식으로 검토를 요청하세요.
`;
uiTemplates.push(...fileTemplates.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); if (values.length !== 3) throw new Error('界面模板列数无效：'+key); return [key, values]; }));
const actionMessages = `
安静陪伴|Quiet company|静かな付き添い|조용한 동행
向右溜达|Stroll right|右へ散歩|오른쪽 산책
向左溜达|Stroll left|左へ散歩|왼쪽 산책
跳跃|Jump|ジャンプ|점프
失败反应|Failure response|失敗への反応|실패 반응
`;
Object.assign(uiMessages, Object.fromEntries(actionMessages.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); return [key, values]; })));
uiTemplates.push(['注视 {0}°', ['Gaze {0}°', '視線 {0}°', '시선 {0}°']], ['注视 {0}° · {1}', ['Gaze {0}° · {1}', '視線 {0}° · {1}', '시선 {0}° · {1}']]);
const completeTemplates = `
原生兼容 · {0}|Native compatibility · {0}|ネイティブ対応 · {0}|기본 호환 · {0}
部分支持 · {0}|Partial support · {0}|部分対応 · {0}|부분 지원 · {0}
需原宿主 · {0}|Original host required · {0}|元のホストが必要 · {0}|원본 호스트 필요 · {0}
无法识别或直接兼容 · {0}|Unrecognized or incompatible · {0}|未認識・直接非対応 · {0}|인식 불가 또는 직접 비호환 · {0}
完整 ZIP 与保存链接已生成。请在本站投稿表单附上「{0}」并提交，审核收录后才会上线。|Complete ZIP and save link created. Attach “{0}” to this site's form for review.|完全なZIPと保存リンクを作成しました。投稿フォームに「{0}」を添付し、審査へ提出してください。|전체 ZIP 및 저장 링크를 생성했습니다. 사이트 양식에 “{0}”을 첨부해 검토를 요청하세요.
`;
uiTemplates.push(...completeTemplates.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); return [key, values]; }));
for (const category of ['原创角色', '游戏角色', '动漫角色', '吉祥物', '其他', '机器人', '人物头像', '动物伙伴', '幻想生物', '网络梗图', '物件与道具']) for (const version of [1, 2]) uiMessages[`${category} · V${version}`] = uiMessages[category].map(value => `${value} · V${version}`);

const adminMessages = `
语言|Language|言語|언어
搜索|Search|検索|검색
管理员|Administrator|管理者|관리자
作品管理|Work management|作品管理|작품 관리
作品管理 · desktop pet|Work management · desktop pet|作品管理 · desktop pet|작품 관리 · desktop pet
返回广场|Back to community|広場に戻る|광장으로 돌아가기
退出管理|Sign out|ログアウト|로그아웃
管理员登录|Administrator sign-in|管理者ログイン|관리자 로그인
管理员密钥|Administrator key|管理者キー|관리자 키
登录管理|Sign in|ログイン|로그인
密钥只用于本站验证，请勿分享。|The key is only for this site's verification. Do not share it.|キーはこのサイトの認証専用です。共有しないでください。|키는 이 사이트 인증에만 사용됩니다. 공유하지 마세요.
正在连接管理服务…|Connecting to administration…|管理サービスに接続中…|관리 서비스 연결 중…
作品管理列表|Managed works|管理作品一覧|관리 작품 목록
作品类型|Work type|作品種類|작품 유형
全部作品|All works|すべての作品|모든 작품
上架状态|Listing status|公開状態|공개 상태
全部状态|All statuses|すべての状態|모든 상태
已上架|Published|公開中|공개 중
已下架|Unlisted|非公開|비공개
作品分类|Work category|作品カテゴリ|작품 분류
搜索作品、作者或编号|Search works, authors or IDs|作品・作者・IDを検索|작품, 작가 또는 ID 검색
刷新列表|Refresh list|一覧を更新|목록 새로고침
保存分类|Save category|カテゴリを保存|분류 저장
恢复上架|Restore listing|再公開|다시 공개
下架作品|Unlist work|作品を非公開にする|작품 비공개
已登录，修改后立即同步到全站。|Signed in. Changes are saved for the whole site.|ログインしました。変更はサイト全体に保存されます。|로그인했습니다. 변경 사항은 사이트 전체에 저장됩니다.
已保存，访客刷新后可看到最新结果。|Saved. Visitors see the changes after refreshing.|保存しました。訪問者は再読み込みすると変更を確認できます。|저장했습니다. 방문자는 새로고침 후 변경 사항을 볼 수 있습니다.
已退出管理。|Signed out.|ログアウトしました。|로그아웃했습니다.
列表已刷新。|List refreshed.|一覧を更新しました。|목록을 새로고침했습니다.
请输入本机保存的管理员密钥。|Enter the administrator key saved on your device.|端末に保存した管理者キーを入力してください。|기기에 저장된 관리자 키를 입력하세요.
管理员密钥不正确。|Incorrect administrator key.|管理者キーが正しくありません。|관리자 키가 올바르지 않습니다.
请先登录管理员。|Sign in as administrator first.|管理者としてログインしてください。|먼저 관리자로 로그인하세요.
管理员服务尚未配置。|Administration is not configured yet.|管理サービスは未設定です。|관리 서비스가 아직 설정되지 않았습니다.
请从本站管理页面操作。|Use this site's administration page.|このサイトの管理ページで操作してください。|이 사이트의 관리 페이지에서 작업하세요.
登录尝试过多，请一小时后再试。|Too many sign-in attempts. Try again in one hour.|ログイン試行が多すぎます。1時間後に再試行してください。|로그인 시도가 너무 많습니다. 한 시간 후 다시 시도하세요.
作品已在其他窗口修改，请刷新后再保存。|This work changed in another window. Refresh before saving.|別のウィンドウで変更されています。再読み込みしてから保存してください。|다른 창에서 변경되었습니다. 새로고침 후 저장하세요.
分类须为 1 至 40 字，且不能含控制字符或 HTML。|Use 1–40 characters without control characters or HTML.|カテゴリは1〜40文字で、制御文字とHTMLは使用できません。|분류는 1~40자이며 제어 문자나 HTML을 사용할 수 없습니다.
作品管理状态暂时无法读取，请刷新重试。|Cannot load listing status. Refresh to retry.|公開状態を取得できません。再読み込みしてください。|공개 상태를 읽을 수 없습니다. 새로고침하세요.
作品管理状态无效，请刷新重试。|Invalid listing status. Refresh to retry.|公開状態が無効です。再読み込みしてください。|공개 상태가 올바르지 않습니다. 새로고침하세요.
操作失败，请重试。|Operation failed. Try again.|操作に失敗しました。再試行してください。|작업에 실패했습니다. 다시 시도하세요.
`;
Object.assign(uiMessages, Object.fromEntries(adminMessages.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); return [key, values]; })));
uiTemplates.push(['未确认发布：{0}。分享 ZIP 已生成，可先下载保留。', ['Publication not confirmed: {0}. Sharing ZIP created; download it to keep a copy.', '公開未確認：{0}。共有ZIPを作成しました。ダウンロードして保存できます。', '게시 미확인: {0}. 공유 ZIP을 생성했습니다. 다운로드하여 보관하세요.']]);

export const builtinCategoryNames = ['机器人伙伴', '原创伙伴', '可选工具', '健康提醒', '专注陪伴', '提醒与计时', '身心陪伴', '生活陪伴', '资源与工具', '学习与效率'];
const builtinCategoryMessages = `
机器人伙伴|Robot companions|ロボットの仲間|로봇 동반자
原创伙伴|Original companions|オリジナルの仲間|오리지널 동반자
可选工具|Optional tools|任意ツール|선택 도구
健康提醒|Health reminders|健康リマインダー|건강 알림
专注陪伴|Focus companion|集中の付き添い|집중 동반
提醒与计时|Reminders and timers|リマインダーとタイマー|알림과 타이머
身心陪伴|Wellbeing companion|心身の付き添い|심신 동반
生活陪伴|Everyday companion|日常の付き添い|일상 동반
资源与工具|Resources and tools|リソースとツール|자료와 도구
学习与效率|Learning and productivity|学習と効率化|학습과 생산성
下载 桌宠 ZIP|Download pet ZIP|ペットZIPをダウンロード|펫 ZIP 다운로드
下载 插件 ZIP|Download plugin ZIP|プラグインZIPをダウンロード|플러그인 ZIP 다운로드
`;
Object.assign(uiMessages, Object.fromEntries(builtinCategoryMessages.trim().split('\n').map(line => { const [key, ...values] = line.split('|'); if (values.length !== 3) throw new Error('界面词典列数无效：'+key); return [key, values]; })));
