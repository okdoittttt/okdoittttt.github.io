# okdoittttt

okdoittttt의 개인 블로그. [Astro](https://astro.build)로 만들고 GitHub Pages에 배포한다.

https://okdoittttt.github.io

## 명령어

| 명령어 | 동작 |
| :-- | :-- |
| `npm install` | 의존성 설치 |
| `npm run dev` | 개발 서버 실행 (`localhost:4321`) |
| `npm run build` | `./dist/`에 정적 사이트 빌드 |
| `npm run preview` | 빌드 결과를 로컬에서 미리 보기 |

## 글 쓰기

`src/content/blog/`에 Markdown(`.md`) 또는 MDX(`.mdx`) 파일을 추가한다.

```md
---
title: '글 제목'
category: 'ai' # 'ai' 또는 'thoughts'
description: '한 줄 요약'
pubDate: '2026-11-23'
---
```

글 주소는 `/<category>/<파일명>/`이 된다. `main`에 push하면 GitHub Actions가 자동으로 배포한다.
