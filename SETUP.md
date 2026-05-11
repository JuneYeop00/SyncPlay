# OTT SyncPlay 프로젝트 실행 가이드

## 사전 준비 (필수 설치)

- **Docker Desktop** — https://www.docker.com/products/docker-desktop
- **Java 17** 이상
- **Node.js** 18 이상
- **Chrome** 브라우저

---

## 1. MySQL 컨테이너 실행 (PowerShell)

```powershell
# MySQL 이미지 다운로드
docker pull mysql:8.0

# 컨테이너 생성 및 실행
docker run -d `
  --name syncplay-mysql `
  -e MYSQL_ROOT_PASSWORD=1234 `
  -e MYSQL_DATABASE=syncplay `
  -e MYSQL_USER=syncplay `
  -e MYSQL_PASSWORD=1234 `
  -p 3308:3306 `
  mysql:8.0

# 실행 확인
docker ps

# 로그 확인 — "ready for connections" 문구 뜨면 정상
docker logs syncplay-mysql
```

---

## 2. 테이블 생성

```powershell
# MySQL 컨테이너 접속 (비밀번호: 1234)
docker exec -it syncplay-mysql mysql -u root -p
```

접속 후 아래 SQL 실행:

```sql
USE syncplay;

DROP TABLE IF EXISTS watch_history;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE watch_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255),
  current_time_sec INT,
  duration INT,
  platform VARCHAR(255),
  progress VARCHAR(255),
  sub_title VARCHAR(255),
  title VARCHAR(255),
  url VARCHAR(1000),
  watched_at VARCHAR(255)
);

-- 확인
SHOW TABLES;
DESC users;
DESC watch_history;
```

---

## 3. 서버 실행 (Spring Boot)

VS Code 터미널에서 서버 폴더로 이동 후 실행:

```bash
cd syncplay-server
./gradlew clean bootRun
```

→ `http://localhost:8080` 에서 실행됩니다.  
DB 연결 정보(`application.properties`)는 이미 세팅돼 있으므로 별도 수정 불필요.

---

## 4. 대시보드 실행 (React)

```bash
cd syncplay-dashboard
npm install
npm run dev
```

→ `http://localhost:5173` 에서 실행됩니다.  
TMDB 토큰도 서버 설정에 포함돼 있으므로 별도 `.env` 설정 불필요.

---

## 5. 크롬 익스텐션 설치

1. Chrome에서 `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** 활성화
3. **압축해제된 확장 프로그램 로드** 클릭
4. 프로젝트의 `extension/` 폴더 선택

---

## 실행 순서 요약

**Docker MySQL → 서버(bootRun) → 대시보드(npm run dev) → 익스텐션 설치**
