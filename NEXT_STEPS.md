# AeroSync 개발 상태 및 차기 작업 가이드 (NEXT_STEPS)

이 프로젝트는 유튜브 동영상에서 고음질 MP3 음원을 추출하여 로컬에 저장하고, 이를 골전도 이어폰으로 편리하게 전송할 수 있는 웹 기반 도구입니다. 작업을 이어서 진행하실 수 있도록 현재 상태와 가이드를 정리해 두었습니다.

---

## 1. 현재 개발 완료된 상태 (Current Status)

### 기능 구성
* **고음질 변환**: `yt-dlp` 및 `ffmpeg`를 사용해 유튜브 동영상 음성을 최상위 음질(최대 320kbps MP3)로 변환해 저장합니다.
* **실시간 로딩 바**: Server-Sent Events(SSE) 스트리밍 기술로 변환율 및 단계(`분석 중` ➡️ `다운로드 중` ➡️ `MP3 변환 중` ➡️ `완료`)를 실시간 출력합니다.
* **웹 플레이어**: 다운로드 완료된 음악 리스트 옆의 **[재생(▶️) 버튼]**을 클릭해 브라우저 상에서 즉시 미리 들을 수 있습니다.
* **Finder 폴더 열기**: **[Finder에서 다운로드 폴더 열기]** 클릭 시 맥북의 실제 파일 저장 위치가 열립니다.

### 소스 코드 구조
* [server.js](file:///Users/user/Documents/mp3%20downloader/server.js): API 서버 (Express) 및 음원 추출 로직. 3001번 포트 사용.
* [public/index.html](file:///Users/user/Documents/mp3%20downloader/public/index.html): 메인 대시보드 마크업 및 골전도 전송 안내 영역.
* [public/style.css](file:///Users/user/Documents/mp3%20downloader/public/style.css): 글래스모피즘(Glassmorphism) 및 반응형 레이아웃 스타일.
* [public/app.js](file:///Users/user/Documents/mp3%20downloader/public/app.js): 이벤트 처리, 실시간 스트림 연결 및 오디오 재생 제어 스크립트.
* [.gitignore](file:///Users/user/Documents/mp3%20downloader/.gitignore): `node_modules/`, `downloads/` 등 불필요한 파일이 Git에 올라가지 않도록 예외 처리.

---

## 2. 작업 이어서 시작하는 방법 (How to Resume)

### 로컬에서 프로그램 실행
1. 터미널을 열고 프로젝트 폴더로 이동합니다.
2. 아래 명령어로 로컬 서버를 구동합니다:
   ```bash
   npm start
   ```
3. 브라우저에서 **[http://localhost:3001](http://localhost:3001)**로 접속합니다.

### 친구들과 공유하여 사용하기
1. 로컬 서버가 실행 중인 상태에서 새 터미널 창을 엽니다.
2. 아래의 SSH 연결 터널링 도구를 실행합니다:
   ```bash
   ssh -R 80:localhost:3001 nokey@localhost.run
   ```
3. 터미널에 나타나는 URL(예: `https://xxxx.localhost.run`)을 복사해서 친구들에게 전달합니다.

### 깃허브(GitHub) 업데이트
코드를 수정하고 깃허브에 다시 올리고 싶다면 아래 명령어를 수행합니다:
```bash
git add .
git commit -m "작업 내용 요약 입력"
git push origin main
```

---

## 3. 차기 개발 추천 사양 (Roadmap & Ideas)

나중에 기능을 더 확장하고 싶다면 아래 항목들을 시도해 보는 것을 추천합니다:

1. **유튜브 플레이리스트 다운로드 지원**:
   * 현재는 단일 곡 링크만 가능하나, 유튜브 재생목록 링크를 입력하면 통째로 한 번에 다운로드하는 기능 추가.
2. **MP3 태그 및 앨범 커버 자동 입력**:
   * 변환 시 파일 메타데이터(가수명, 곡 제목, 앨범 표지)를 자동으로 주입해 이어폰 화면이나 오디오 플레이어에서 깔끔하게 정보가 나오도록 업그레이드.
3. **다운로드 경로 맞춤 설정**:
   * 로컬 폴더 대신, 이어폰이 꽂혀 있는 USB 드라이브 경로로 직접 즉시 다운로드 및 저장하는 기능 구현.
