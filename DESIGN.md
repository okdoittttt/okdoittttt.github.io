# 블로그 초기 설계 (Astro + GitHub Pages)

## 목표

마크다운으로 글을 쓰고 `main`에 push하면 GitHub Pages에 자동 배포되는 개인 블로그.
첫 단계는 "글 목록, 글 상세, 태그, RSS, 배포"까지만 만든다. 나머지는 글이 쌓인 뒤 붙인다.

## 핵심 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Astro 공식 `blog` 템플릿에서 시작 | MDX, sitemap, RSS, 코드 하이라이트(Shiki)가 이미 연결되어 있다. 직접 조립할 이유가 없다. |
| 렌더링 | 정적 빌드 (`output: 'static'`, 기본값) | GitHub Pages는 정적 파일만 서빙한다. |
| 글 저장 | `src/content/posts/*.md(x)` + Content Collections | frontmatter를 zod 스키마로 빌드 시점에 검증한다. 오타 난 날짜나 빠진 제목이 배포 전에 실패한다. |
| 배포 | GitHub Actions (`withastro/action` + `actions/deploy-pages`) | `gh-pages` 브랜치를 따로 관리하지 않아도 된다. |
| 저장소 이름 | `okdoittttt.github.io` 권장 | 주소가 `https://okdoittttt.github.io/`가 되고 `base` 설정이 필요 없다. 아래 "저장소 이름" 참고. |
| 스타일 | 템플릿 기본 CSS를 다듬어 사용 | Tailwind 등은 필요해질 때 추가한다. |
| 패키지 매니저 | npm | 로컬에 이미 있고 Action이 lockfile로 자동 감지한다. |

### 저장소 이름

- **`okdoittttt.github.io` (권장)**: 사용자 사이트. 루트 경로에서 서빙된다.
  ```js
  // astro.config.mjs
  site: 'https://okdoittttt.github.io',
  ```
- **`blog-okdoittttt` (현재 폴더명 그대로)**: 프로젝트 사이트. 주소가 `https://okdoittttt.github.io/blog-okdoittttt/`가 된다.
  ```js
  site: 'https://okdoittttt.github.io',
  base: '/blog-okdoittttt',
  ```
  이 경우 모든 내부 링크와 이미지 경로에 `import.meta.env.BASE_URL`을 붙여야 한다. 실수하기 쉬운 지점이라 사용자 사이트를 권장한다.
- **기존 `okdoittttt.github.io` 저장소 처리 (결정: 삭제 후 새 블로그로 교체, 백업 안 함)**:
  1. 기존 저장소 Settings → General → Danger Zone → **Delete this repository**.
  2. 같은 이름 `okdoittttt.github.io`로 새 빈 저장소를 만들고 이 프로젝트를 push한다.
  3. 새 저장소의 Pages Source를 GitHub Actions로 설정한다.
- 나중에 커스텀 도메인을 쓰면 `public/CNAME`을 추가하고 `site`만 바꾸면 된다.

## 데이터 모델 (글 frontmatter)

모든 페이지는 이 스키마 하나에서 파생된다.

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      heroImage: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };
```

- 파일명이 곧 slug다. `src/content/posts/astro-github-pages.md` → `/posts/astro-github-pages/`.
- 이미지는 글과 같은 폴더에 두고 상대 경로로 참조한다 (`image()`가 최적화한다).
- `draft: true`인 글은 프로덕션 빌드에서 제외한다. 이 필터는 `src/lib/posts.ts` 한 곳에만 둔다.

```ts
// src/lib/posts.ts
import { getCollection } from 'astro:content';

export async function getPublishedPosts() {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
```

목록, 태그, RSS 페이지는 전부 `getPublishedPosts()`만 호출한다. 초안 필터와 정렬 규칙이 여러 파일에 흩어지지 않는다.

## 디렉터리 구조

```
.
├── .github/workflows/deploy.yml
├── astro.config.mjs
├── public/                  # favicon, robots.txt, (CNAME)
└── src/
    ├── content.config.ts
    ├── content/posts/       # 글
    ├── lib/posts.ts         # 글 조회 단일 진입점
    ├── consts.ts            # 사이트 제목, 설명, 작성자
    ├── layouts/
    │   ├── BaseLayout.astro # <head>, 헤더, 푸터
    │   └── PostLayout.astro
    ├── components/          # Header, Footer, PostCard, TagList, FormattedDate
    ├── pages/
    │   ├── index.astro              # 최근 글
    │   ├── posts/index.astro        # 전체 글 목록
    │   ├── posts/[...slug].astro    # 글 상세
    │   ├── tags/index.astro         # 태그 목록
    │   ├── tags/[tag].astro         # 태그별 글
    │   ├── about.astro
    │   └── rss.xml.js
    └── styles/global.css
```

## 배포 워크플로

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

action 버전은 셋업 시점의 최신 major로 맞춘다.
저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿔야 배포된다.

## 진행 순서

각 단계는 끝날 때 확인할 수 있는 결과가 있다.

1. **스캐폴드**: `npm create astro@latest . -- --template blog`, `git init`, `site` 설정.
   확인: `npm run dev`에서 템플릿 블로그가 뜬다.
2. **배포 먼저**: GitHub 저장소 생성, workflow 추가, Pages Source 설정, push.
   확인: `https://okdoittttt.github.io/`에서 템플릿 그대로 보인다. 글을 쓰기 전에 배포 경로를 뚫어 둔다.
3. **콘텐츠 모델**: `blog` 컬렉션을 위 `posts` 스키마로 교체, `src/lib/posts.ts` 추가, 샘플 글을 실제 첫 글로 교체.
   확인: frontmatter에서 `title`을 지우면 `npm run build`가 실패한다.
4. **페이지**: 태그 페이지, 글 목록, about, 한국어 `lang="ko"`, 날짜 포맷(`ko-KR`).
   확인: 빌드 결과의 `dist/tags/<tag>/index.html` 존재, RSS 검증.
5. **디자인 다듬기**: 타이포그래피, 다크 모드, 모바일 폭.

## 나중에 (지금은 하지 않음)

- 댓글: giscus (GitHub Discussions 기반, 서버 불필요)
- 검색: Pagefind (빌드 후 정적 인덱스 생성)
- 분석: Google Analytics 또는 Cloudflare Web Analytics
- OG 이미지 자동 생성, 시리즈, 목차(TOC), 읽기 시간
- 커스텀 도메인
