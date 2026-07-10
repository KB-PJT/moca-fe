# MOCA (moca-fe)

결제 순간 카드 혜택을 알려주는 스마트 카드지갑 — 가맹점·카테고리·결제금액을 기준으로 보유 카드 중 가장 유리한 카드를 추천하는 서비스의 프론트엔드입니다.

팀 I/O · 종합실무 프로젝트

## Tech Stack

- Vue 3 + Vite
- JavaScript (TypeScript 미사용)
- Vue Router
- Pinia
- Tailwind CSS
- ESLint + Prettier (+ oxlint)
- Vitest

## GitHub Flow

`main`에서 브랜치 생성 → 개발/커밋 → Push & PR 생성 → 코드 리뷰(최소 1인) → GitHub Actions 테스트 → `main` 병합 → 브랜치 삭제 순으로 진행합니다.

- `main`에서 직접 개발 금지, 항상 최신 `main`에서 브랜치 분기
- 하나의 브랜치 = 하나의 기능
- 작은 단위로 자주 커밋
- 리뷰 + 테스트 통과 후에만 Merge
- 커밋/PR 전 `npm run lint`, `npm run format` 실행

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

1. 작업 시작 전 - `git pull origin main` 필수!!
2. `git checkout -b 브랜치명`
3. `git add .` (커밋에 포함될 파일 선택)
4. `git commit -m "커밋 메시지"`
5. `git push origin 브랜치명`
