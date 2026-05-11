# SyncPlay Dashboard

OTT SyncPlay 프로젝트의 React 프론트엔드입니다.

## 기술 스택

- React 19 + Vite 8
- Tailwind CSS 4
- React Router DOM 7
- Lucide React (아이콘)

## 시작하기

```bash
npm install
npm run dev
```

## 환경 변수

루트에 `.env` 파일을 생성하고 아래 값을 설정하세요.

```
VITE_TMDB_ACCESS_TOKEN=your_tmdb_access_token
```

## 페이지 구성

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | LoginPage | 로그인 |
| `/signup` | SignupPage | 회원가입 |
| `/home` | HomePage | 홈 대시보드 (최근 기록, 구독 현황, 찜 목록) |
| `/movies` | MoviesPage | 영화 시청 기록 관리 |
| `/tv` | TvShowsPage | TV 시리즈 시청 기록 관리 |
| `/search` | SearchPage | TMDB 통합 검색 / 트렌딩 |
| `/mypage` | MyPage | 마이페이지 (구독 관리, 프로필) |
| `/settings` | Settings | 설정 (다크/라이트 모드) |

## 지원 OTT 플랫폼

Netflix, TVING, Disney+, Coupang Play, Wavve, 왓챠, Apple TV+, Amazon Prime Video
