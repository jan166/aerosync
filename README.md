# AeroSync - YouTube to MP3 Downloader for Bone Conduction Earphones

AeroSync is a sleek, modern, and local web dashboard to download YouTube music as high-quality MP3 files, designed to easily load songs onto your standalone bone conduction earphones (supporting standalone MP3 mode).

골전도 이어폰(MP3 단독 재생 지원)에 음악을 손쉽게 복사해 넣을 수 있도록 지원하는 고음질 유튜브 MP3 다운로더 로컬 대시보드 애플리케이션입니다.

---

## Features (기능)

* **High Quality MP3 Extraction**: Extracts audio at maximum bitrate (up to 320kbps) using `yt-dlp` and `ffmpeg`. (최대 320kbps의 고음질 MP3 변환)
* **Real-time Progress Tracker**: Interactive loading bar indicating downloading rate and state. (다운로드 진행률 실시간 트래킹)
* **Built-in Audio Player**: Stream and preview your downloaded files directly on the web page. (브라우저 내 즉시 재생 플레이어 내장)
* **macOS Finder Shortcut**: Single-click button to open the download folder in Finder for quick drag & drop. (Finder 폴더 즉시 열기 단축키 지원)

---

## Prerequisites (요구 사항)

Ensure you have the following installed on your system:
* [Node.js](https://nodejs.org/) (v16 or higher)
* [yt-dlp](https://github.com/yt-dlp/yt-dlp)
* [ffmpeg](https://ffmpeg.org/)

---

## Setup & Run (설치 및 실행 방법)

1. Clone this repository (저장소 클론):
   ```bash
   git clone <your-repository-url>
   cd <repository-directory>
   ```

2. Install dependencies (패키지 설치):
   ```bash
   npm install
   ```

3. Start the application (애플리케이션 실행):
   ```bash
   npm start
   ```

4. Open your browser and navigate to (브라우저 접속):
   * **URL:** `http://localhost:3001`

---

## File Structure (파일 구조)

* `server.js`: Express.js backend handling API requests and `yt-dlp` spawning.
* `public/`: Web frontend.
  * `index.html`: Dashboard layout.
  * `style.css`: Modern glassmorphic styles.
  * `app.js`: SSE connection logic & frontend player.
* `downloads/`: Directory where MP3s are stored (excluded from Git).
