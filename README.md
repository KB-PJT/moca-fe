# MOCA (moca-fe)

결제 순간 카드 혜택을 알려주는 스마트 카드지갑 — 가맹점·카테고리·결제금액을 기준으로 보유 카드 중 가장 유리한 카드를 추천하는 서비스의 프론트엔드입니다.

팀 I/O · 종합실무 프로젝트

## Tech Stack

- Vue 3 + Vite
- TypeScript
- Vue Router
- Pinia, Vue Query
- Tailwind CSS, shadcn-vue
- ESLint + Prettier (+ oxlint)
- Vitest

## 품질 검증 / 사용자 분석

| 구분      | 항목       | 용도                             |
| --------- | ---------- | -------------------------------- |
| 품질 검증 | ESLint     | 코드 스타일                      |
| 품질 검증 | Lighthouse | 성능/접근성/SEO 자동 점수 측정   |
| 사용자 분석 | PostHog  | 사용자 행동 분석 (퍼널·세션 리플레이) |

## 외부 라이브러리

| 구분        | API             | 용도                                          |
| ----------- | --------------- | --------------------------------------------- |
| 지도        | Kakao Map API   | 지도 표시, 반경 검색, 마커                    |
| 지도        | Kakao Local API | 가맹점 검색, 좌표 ↔ 주소 변환                 |
| 사용자 분석 | PostHog         | 사용자 행동 분석 (퍼널·세션 리플레이)         |
| UI 컴포넌트 | shadcn-vue      | Sheet, Dialog, Form, Toast 등 인터랙션 뼈대 컴포넌트 |

## GitHub Flow

`develop`에서 브랜치 생성 → 개발/커밋 → Push & PR 생성 → 코드 리뷰(최소 1인) → GitHub Actions 테스트 → `develop` 병합 → 브랜치 삭제 순으로 진행합니다.

- `develop`에서 직접 개발 금지, 항상 최신 `develop`에서 브랜치 분기
- 하나의 브랜치 = 하나의 기능
- 작은 단위로 자주 커밋
- 리뷰 + 테스트 통과 후에만 Merge
- 커밋/PR 전 `npm run lint`, `npm run format` 실행
- `main`은 배포 전용 브랜치이며 직접 분기/커밋하지 않고, `develop`에서 배포 시점에만 병합

### 브랜치 네이밍

`접두사/기능-이름` 형태로 작성합니다.

| 접두사      | 용도         | 예시                     |
| ----------- | ------------ | ------------------------ |
| `feature/`  | 새 기능 개발 | `feature/login-page`     |
| `fix/`      | 버그 수정    | `fix/router-guard-error` |
| `refactor/` | 구조 개선    | `refactor/auth-store`    |
| `docs/`     | 문서 수정    | `docs/update-readme`     |

## 커밋 컨벤션

```
type(scope): subject
```

**type**

| type       | 용도           |
| ---------- | -------------- |
| `feat`     | 새 기능        |
| `fix`      | 버그 수정      |
| `refactor` | 구조 개선      |
| `test`     | 테스트 코드    |
| `docs`     | 문서 수정      |
| `style`    | 포맷팅         |
| `chore`    | 빌드/환경 설정 |

**scope**: 기능/도메인 단위로 작성 — `auth`, `user`, `router`, `store`, `api`, `ui`, `config` 등

**작성 규칙**

- 제목은 간결한 동작 설명으로 시작
- 끝에 마침표 금지
- 짧고 명확하게 작성

**예시**

```
feat(auth): 로그인 페이지 추가
feat(store): 인증 스토어 추가
fix(router): 인증 가드 리다이렉트 오류 수정
refactor(auth): 로그인 로직을 컴포저블로 분리
test(auth): 로그인 폼 테스트 추가
chore(config): vite 설정 업데이트
style(prettier): 컴포넌트 포맷팅
```

## Pull Request

PR 템플릿은 `.github/pull_request_template.md`에 정의하며, 다음 항목을 포함합니다.

- 📌 개요 — 구현한 화면/기능 요약
- 🛠️ 주요 변경 사항 — 컴포넌트/라우터/store/API 변경점
- 🧪 테스트 결과 — 동작 확인 방식
- 📸 화면 확인 — UI 변경 시 스크린샷
- ❓ 리뷰어에게 — 고민한 부분, 집중 리뷰 요청 사항

## Git 명령어

1. 작업 시작 전 - `git pull origin develop` 필수!!
2. `git checkout -b 브랜치명`
3. `git add .` (커밋에 포함될 파일 선택)
4. `git commit -m "커밋 메시지"`
5. `git push origin 브랜치명`
