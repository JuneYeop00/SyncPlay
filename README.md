# OTT SyncPlay Project

> 여러 OTT 플랫폼의 시청 기록을 크롬 확장 프로그램으로 수집하고, 웹 대시보드에서 통합 관리하는 배포형 서비스

## 서비스 주소

- **웹 대시보드(Vercel)**: https://syncplay-backup.vercel.app
- **백엔드 상태 확인(Render)**: https://syncplay-server-8ovd.onrender.com/api/test
- **데이터베이스**: Neon PostgreSQL
- **크롬 확장 프로그램**: `extension` 폴더를 Chrome 개발자 모드에서 직접 로드

> Render 무료 인스턴스는 일정 시간 사용하지 않으면 대기 상태로 전환될 수 있습니다. 첫 요청은 서버가 다시 시작되는 동안 다소 느릴 수 있습니다.

---

## 프로젝트 소개

**OTT SyncPlay**는 Netflix, TVING, Disney+, Coupang Play, 왓챠, Wavve 등 여러 OTT 플랫폼에서 시청 중인 콘텐츠 정보를 추출하고, 사용자별 시청 기록을 하나의 대시보드에서 관리할 수 있도록 만든 프로젝트입니다.

사용자가 OTT 재생 화면에서 크롬 확장 프로그램 버튼을 누르면 다음 정보가 추출됩니다.

- OTT 플랫폼
- 작품 제목
- 시즌 및 회차 정보
- 현재 재생 시간과 전체 재생 시간
- 시청 진행률
- 시청 페이지 URL
- 최근 시청 시각

추출된 데이터는 Render에 배포된 Spring Boot API를 거쳐 Neon PostgreSQL에 저장됩니다. Vercel에 배포된 React 대시보드는 저장된 사용자별 데이터를 조회하여 시청 기록, 찜 목록, 구독 중인 OTT, 콘텐츠 검색 결과를 제공합니다.

---

## 배포 구조

```text
OTT 재생 페이지
    │
    │ Chrome Extension
    │ 제목·회차·진행률 추출
    ▼
Spring Boot API
Render + Docker
    │
    │ JPA
    ▼
Neon PostgreSQL
    ▲
    │ REST API
    │
React Dashboard
Vercel
```

### 서비스별 역할

| 구성 | 배포 서비스 | 역할 |
|---|---|---|
| React 대시보드 | Vercel | 로그인, 시청 기록, 검색, 찜 목록, 구독 관리 |
| Spring Boot 서버 | Render | REST API, 사용자 및 시청 데이터 처리, TMDB 연동 |
| PostgreSQL DB | Neon | 사용자, 시청 기록, 찜 목록, 구독 정보 저장 |
| Chrome Extension | 로컬 설치 | OTT 페이지에서 작품 정보 추출 및 서버 전송 |
| TMDB API | 외부 API | 콘텐츠 검색, 포스터, 평점, OTT 제공 정보 조회 |

---

## 주요 기능

### 1. 사용자 계정

- 회원가입 및 로그인
- 사용자 정보 수정
- 비밀번호 찾기 화면 제공
- 로그인 정보를 브라우저 `localStorage`에 저장
- 확장 프로그램이 열려 있는 SyncPlay 대시보드 탭에서 로그인 사용자 정보를 확인
- 서버 저장 기준은 이메일을 사용하고 팝업 화면에는 사용자 이름을 표시

### 2. 시청 기록 통합 관리

- 사용자 이메일 기준 시청 기록 저장 및 조회
- 같은 사용자의 같은 제목은 새 행을 계속 추가하지 않고 기존 기록 갱신
- 제목, 플랫폼, 회차, 진행률, 최근 시청 시각 표시
- 영화와 TV 시리즈를 구분해 별도 화면에서 관리
- 시청 기록 삭제 기능
- 진행률 바를 통한 시청 상태 확인

### 3. 통합 콘텐츠 검색

- TMDB 영화·TV 통합 검색
- 이번 주 트렌딩 콘텐츠 표시
- 인기 영화 및 인기 TV 시리즈 표시
- 포스터, 개봉 연도, 평점, 줄거리 제공
- 한국 지역 OTT 제공 정보 조회
- 사용자가 구독 중인 OTT와 콘텐츠 제공 플랫폼 비교
- Netflix, TVING, 왓챠, Wavve 등 OTT 검색 페이지로 연결
- 동일 콘텐츠 제공 정보의 중복 요청을 줄이기 위한 캐시 사용

### 4. 찜 목록과 구독 관리

- 콘텐츠 찜 추가 및 해제
- 사용자별 찜 목록 저장
- Netflix, TVING, Disney+, Coupang Play, Wavve, 왓챠, Apple TV+, Amazon Prime Video 구독 정보 관리
- 구독 중인 플랫폼을 기준으로 콘텐츠 시청 가능 여부 표시

### 5. 시청 캘린더

- 저장된 시청 기록을 날짜별로 확인
- 최근 시청 활동을 달력 형태로 표현
- `WatchCalendar.jsx` 컴포넌트로 분리하여 관리

### 6. 크롬 확장 프로그램

- Manifest V3 기반
- 사용자가 팝업 버튼을 눌렀을 때 현재 OTT 탭 분석
- 플랫폼별 브리지 파일로 추출 로직 분리
- 로그인된 SyncPlay 대시보드 탭에서 사용자 정보 확인
- Render 백엔드의 `/api/history`로 시청 기록 전송
- 전송 성공 시 사용자 이름, 제목, 상세 정보, 진행률 표시

#### 지원 플랫폼

- Netflix
- TVING
- Disney+
- Coupang Play
- 왓챠
- Wavve
- Apple TV+
- Amazon Prime Video

> OTT 사이트의 DOM 구조가 변경되면 일부 플랫폼의 제목·회차·진행률 추출 로직을 수정해야 할 수 있습니다.

---

## 기술 스택

### Frontend

- React 19
- Vite 8
- React Router DOM 7
- Tailwind CSS 4
- Lucide React

### Backend

- Java 17
- Spring Boot 4
- Spring Web
- Spring Data JPA
- Gradle
- Docker

### Database

- PostgreSQL
- Neon Serverless Postgres

### Deployment

- Vercel: React 대시보드
- Render: Docker 기반 Spring Boot 서버
- Neon: PostgreSQL 데이터베이스

### Extension / API

- Chrome Extension API
- Manifest V3
- TMDB API

---

## 프로젝트 구조

```text
WebProject1/
├─ extension/                         # Chrome Extension
│  ├─ manifest.json                   # 권한, 지원 URL, content script 설정
│  ├─ popup.html                      # 확장 프로그램 팝업 UI
│  ├─ popup.js                        # 사용자 확인, 플랫폼 판별, 데이터 전송
│  ├─ netflix-bridge.js               # Netflix 추출 로직
│  ├─ tiving-bridge.js                # TVING 추출 로직
│  ├─ disney-bridge.js                # Disney+ 추출 로직
│  ├─ coupang-bridge.js               # Coupang Play 추출 로직
│  ├─ watcha-bridge.js                # 왓챠 추출 로직
│  ├─ wave-bridge.js                  # Wavve 추출 로직
│  ├─ prime-bridge.js                 # Amazon Prime Video 추출 로직
│  ├─ appletv-bridge.js               # Apple TV+ 추출 로직
│  └─ README.md                       # 확장 프로그램 설명
│
├─ syncplay-dashboard/                # React + Vite Frontend
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ vercel.json                     # React Router 새로고침 대응
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  ├─ eslint.config.js
│  ├─ public/
│  │  └─ logos/                       # OTT 로컬 로고
│  │     ├─ netflix.png
│  │     ├─ tving.png
│  │     ├─ disneyplus.svg
│  │     ├─ coupangplay.png
│  │     ├─ wavve.png
│  │     ├─ watcha.png
│  │     ├─ amazonprime.png
│  │     └─ appletv.png
│  └─ src/
│     ├─ main.jsx                     # React 엔트리 포인트
│     ├─ App.jsx                      # 라우팅 및 전역 화면 구성
│     ├─ App.css
│     ├─ index.css
│     ├─ config/
│     │  └─ api.js                    # 로컬/배포 API 주소 통합 관리
│     ├─ hooks/
│     │  └─ useTmdbSearch.js          # 백엔드 TMDB 검색 훅
│     ├─ components/
│     │  ├─ MediaCard.jsx             # 공통 콘텐츠 카드
│     │  ├─ SkeletonCard.jsx          # 로딩 스켈레톤
│     │  └─ WatchCalendar.jsx         # 시청 기록 캘린더
│     └─ pages/
│        ├─ LoginPage.jsx             # 로그인
│        ├─ SignupPage.jsx            # 회원가입
│        ├─ FindPasswordPage.jsx      # 비밀번호 찾기
│        ├─ HomePage.jsx              # 홈 대시보드
│        ├─ MoviesPage.jsx            # 영화 시청 기록
│        ├─ TvShowsPage.jsx           # TV 시리즈 시청 기록
│        ├─ SearchPage.jsx            # 검색·트렌딩·인기 콘텐츠
│        ├─ MyPage.jsx                # 프로필·찜·구독 관리
│        └─ Settings.jsx              # 사용자 정보 및 테마 설정
│
├─ syncplay-server/                   # Spring Boot Backend
│  ├─ Dockerfile                      # Render 배포용 멀티 스테이지 빌드
│  ├─ build.gradle
│  ├─ settings.gradle
│  ├─ gradlew
│  ├─ gradlew.bat
│  └─ src/
│     ├─ main/
│     │  ├─ java/com/syncplay/server/
│     │  │  ├─ Application.java
│     │  │  ├─ WebConfig.java
│     │  │  ├─ HelloController.java
│     │  │  ├─ UserController.java
│     │  │  ├─ WatchHistoryController.java
│     │  │  ├─ UserSubscriptionController.java
│     │  │  ├─ WishlistController.java
│     │  │  ├─ TmdbSearchController.java
│     │  │  ├─ ProviderAvailabilityController.java
│     │  │  ├─ UserSubscriptionService.java
│     │  │  ├─ TmdbSearchService.java
│     │  │  ├─ ProviderAvailabilityService.java
│     │  │  ├─ User.java
│     │  │  ├─ WatchHistory.java
│     │  │  ├─ WishlistItem.java
│     │  │  ├─ UserSubscription.java
│     │  │  ├─ UserRepository.java
│     │  │  ├─ WatchHistoryRepository.java
│     │  │  ├─ WishlistRepository.java
│     │  │  ├─ UserSubscriptionRepository.java
│     │  │  └─ ProviderAvailabilityResponse.java
│     │  └─ resources/
│     │     ├─ application.properties       # 공통 설정 및 기본 프로필
│     │     ├─ application-prod.properties  # Render·Neon 배포 설정
│     │     └─ application-local.properties # 로컬 MySQL 설정, Git 제외
│     └─ test/
│        └─ java/com/syncplay/server/
│           └─ ApplicationTests.java
│
├─ .gitignore
└─ README.md
```

---

## 환경변수

실제 토큰과 비밀번호는 GitHub에 커밋하지 않습니다.

### Vercel

```env
VITE_API_BASE_URL=https://syncplay-server-8ovd.onrender.com
VITE_TMDB_ACCESS_TOKEN=TMDB_READ_ACCESS_TOKEN
```

### Render

```env
SPRING_PROFILES_ACTIVE=prod
PORT=8080
DATABASE_URL=jdbc:postgresql://HOST/neondb?sslmode=require
DATABASE_USERNAME=neondb_owner
DATABASE_PASSWORD=NEON_DATABASE_PASSWORD
TMDB_ACCESS_TOKEN=TMDB_READ_ACCESS_TOKEN
```

### 로컬 React

`syncplay-dashboard/.env.local`

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_TMDB_ACCESS_TOKEN=TMDB_READ_ACCESS_TOKEN
```

### 로컬 Spring Boot

`application-local.properties`는 로컬 MySQL과 개발용 토큰을 설정하는 파일이며 `.gitignore`로 제외합니다.

```properties
spring.datasource.url=jdbc:mysql://localhost:3308/syncplay?serverTimezone=Asia/Seoul
spring.datasource.username=LOCAL_DB_USERNAME
spring.datasource.password=LOCAL_DB_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

tmdb.access-token=TMDB_READ_ACCESS_TOKEN
```

---

## 배포 방법

### 1. Backend - Render

Render Web Service 설정:

```text
Runtime: Docker
Branch: main
Docker Build Context Directory: syncplay-server
Dockerfile Path: syncplay-server/Dockerfile
Health Check Path: /api/test
Instance Type: Free
```

환경변수를 등록한 뒤 배포하면 Dockerfile이 Gradle `bootJar`를 생성하고 Spring Boot 서버를 실행합니다.

### 2. Frontend - Vercel

Vercel 프로젝트 설정:

```text
Framework Preset: Vite
Root Directory: syncplay-dashboard
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

환경변수 `VITE_API_BASE_URL`, `VITE_TMDB_ACCESS_TOKEN`을 등록한 뒤 배포합니다.

### 3. Database - Neon

- Neon 프로젝트 및 PostgreSQL 데이터베이스 생성
- JDBC URL, 사용자 이름, 비밀번호를 Render 환경변수로 등록
- Spring JPA의 `ddl-auto=update` 설정으로 엔티티 기반 테이블 생성 및 갱신

### 4. Extension - Chrome

```text
1. chrome://extensions 접속
2. 개발자 모드 활성화
3. 압축해제된 확장 프로그램 로드 클릭
4. extension 폴더 선택
5. SyncPlay 대시보드에서 로그인
6. 대시보드 탭을 열어둔 상태로 OTT 재생 페이지 접속
7. 확장 프로그램 버튼을 눌러 시청 기록 전송
```

확장 프로그램은 배포된 대시보드 탭의 `localStorage`에서 로그인 사용자 정보를 확인하고, Render API로 시청 데이터를 전송합니다.

---

## 주요 API

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/test` | 서버 상태 확인 |
| POST | `/api/users/signup` | 회원가입 |
| POST | `/api/users/login` | 로그인 |
| PUT | `/api/users/update` | 회원 정보 수정 |
| POST | `/api/users/find-password` | 비밀번호 찾기 |
| GET | `/api/history?email={email}` | 사용자 시청 기록 조회 |
| POST | `/api/history` | 시청 기록 저장 및 갱신 |
| DELETE | `/api/history/{id}?email={email}` | 시청 기록 삭제 |
| GET | `/api/wishlist?email={email}` | 찜 목록 조회 |
| POST | `/api/wishlist?email={email}` | 찜 추가 및 해제 |
| GET | `/api/users/subscriptions?email={email}` | 구독 OTT 조회 |
| PUT | `/api/users/subscriptions?email={email}` | 구독 OTT 수정 |
| GET | `/api/tmdb/search` | TMDB 콘텐츠 검색 |
| GET | `/api/providers/availability` | OTT 제공 여부 조회 |

---

## 실행 및 빌드 확인

### Frontend

```bash
cd syncplay-dashboard
npm install
npm run dev
npm run build
```

### Backend

```bash
cd syncplay-server
./gradlew clean build -x test
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 전체 변경사항 배포

```bash
git add .
git commit -m "update deployed syncplay project"
git push origin main
```

`main` 브랜치에 push하면 Vercel과 Render의 자동 배포 설정에 따라 새 버전이 반영됩니다.

---

## 주의사항

- Render 무료 서버는 유휴 상태에서 중지되므로 첫 API 요청이 느릴 수 있습니다.
- 배포 환경변수를 수정한 경우 Vercel 또는 Render에서 재배포해야 반영됩니다.
- `VITE_`로 시작하는 프론트 환경변수는 브라우저 번들에 포함되므로 민감한 비밀값을 저장하는 용도로 사용하면 안 됩니다.
- TMDB 토큰과 DB 비밀번호는 소스코드 및 README에 실제 값으로 작성하지 않습니다.
- 확장 프로그램은 현재 Chrome Web Store 배포가 아닌 개발자 모드 설치 방식입니다.
- 대시보드 로그인 탭이 닫혀 있으면 확장 프로그램이 사용자 정보를 찾지 못할 수 있습니다.
- OTT 웹 페이지 구조가 변경되면 각 `*-bridge.js`의 선택자와 추출 로직을 수정해야 할 수 있습니다.

---

## 현재 배포 상태

- React 대시보드: Vercel 배포 완료
- Spring Boot API: Render Docker 배포 완료
- PostgreSQL: Neon 연결 완료
- Chrome Extension: 배포 서버와 대시보드 주소 연동 완료
- TMDB 검색 및 포스터 연동
- 사용자별 시청 기록·찜 목록·구독 정보 관리
