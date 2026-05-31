document.addEventListener('DOMContentLoaded', () => {
  const downloadForm = document.getElementById('download-form');
  const youtubeUrlInput = document.getElementById('youtube-url');
  const btnSubmit = document.getElementById('btn-submit');
  const btnOpenFolder = document.getElementById('btn-open-folder');
  
  const progressContainer = document.getElementById('progress-container');
  const progressStatus = document.getElementById('progress-status');
  const progressPercent = document.getElementById('progress-percent');
  const progressBar = document.getElementById('progress-bar');
  const downloadTitle = document.getElementById('download-title');
  const downloadsList = document.getElementById('downloads-list');

  let eventSource = null;
  let activeAudio = null;
  let activePlayBtn = null;

  // Initialize: Load download list
  loadDownloads();

  // Handle Form Submission
  downloadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = youtubeUrlInput.value.trim();
    if (!url) return;

    startDownload(url);
  });

  // Open Downloads Folder in Finder
  btnOpenFolder.addEventListener('click', async () => {
    try {
      btnOpenFolder.disabled = true;
      btnOpenFolder.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 폴더 여는 중...';
      
      const response = await fetch('/api/open-folder', { method: 'POST' });
      const data = await response.json();
      
      if (!data.success) {
        alert('다운로드 폴더를 열 수 없습니다: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류로 다운로드 폴더를 열 수 없습니다.');
    } finally {
      btnOpenFolder.disabled = false;
      btnOpenFolder.innerHTML = '<i class="fa-solid fa-folder-open"></i> Finder에서 다운로드 폴더 열기';
    }
  });

  // Start Downloading via SSE
  function startDownload(url) {
    // UI Reset & Locking
    btnSubmit.disabled = true;
    youtubeUrlInput.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중...';
    
    progressContainer.classList.remove('hidden');
    progressStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 유튜브 링크 분석 중...';
    progressPercent.textContent = '0%';
    progressBar.style.width = '0%';
    downloadTitle.textContent = '다운로드 정보 불러오는 중...';

    // Close any existing SSE stream
    if (eventSource) {
      eventSource.close();
    }

    // Connect to EventSource (SSE)
    const encodedUrl = encodeURIComponent(url);
    eventSource = new EventSource(`/api/download-stream?url=${encodedUrl}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'title':
            downloadTitle.textContent = data.title;
            break;

          case 'progress':
            progressStatus.innerHTML = `<i class="fa-solid fa-cloud-arrow-down fa-bounce"></i> 음악 다운로드 중...`;
            progressPercent.textContent = `${Math.round(data.percent)}%`;
            progressBar.style.width = `${data.percent}%`;
            break;

          case 'status':
            progressStatus.innerHTML = `<i class="fa-solid fa-compact-disc fa-spin"></i> ${data.status}`;
            break;

          case 'complete':
            eventSource.close();
            onDownloadSuccess(data.file);
            break;

          case 'error':
            eventSource.close();
            onDownloadError(data.message);
            break;
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
      onDownloadError('서버 연결 중 오류가 발생했거나 중단되었습니다.');
    };
  }

  function onDownloadSuccess(file) {
    btnSubmit.disabled = false;
    youtubeUrlInput.disabled = false;
    btnSubmit.innerHTML = '<span>변환 시작</span> <i class="fa-solid fa-chevron-right"></i>';
    
    progressStatus.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--success-color)"></i> 완료!`;
    progressPercent.textContent = '100%';
    progressBar.style.width = '100%';
    youtubeUrlInput.value = '';

    if (file) {
      downloadTitle.innerHTML = `<strong>저장됨:</strong> ${file.name} (${file.size})`;
    } else {
      downloadTitle.textContent = '다운로드가 성공적으로 완료되었습니다!';
    }

    loadDownloads();
  }

  function onDownloadError(errorMsg) {
    btnSubmit.disabled = false;
    youtubeUrlInput.disabled = false;
    btnSubmit.innerHTML = '<span>변환 시작</span> <i class="fa-solid fa-chevron-right"></i>';
    
    progressStatus.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color: var(--danger-color)"></i> 오류 발생`;
    progressBar.style.backgroundColor = 'var(--danger-color)';
    downloadTitle.innerHTML = `<span style="color: var(--danger-color)">${errorMsg}</span>`;
  }

  // Load and Render Downloaded Files
  async function loadDownloads() {
    try {
      const response = await fetch('/api/downloads');
      const data = await response.json();

      if (data.success) {
        renderDownloads(data.downloads);
      }
    } catch (err) {
      console.error('Error fetching downloads:', err);
    }
  }

  function renderDownloads(downloads) {
    downloadsList.innerHTML = '';

    if (downloads.length === 0) {
      downloadsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-compact-disc"></i>
          <p>아직 다운로드한 음악이 없습니다.</p>
        </div>
      `;
      return;
    }

    downloads.forEach(file => {
      const item = document.createElement('div');
      item.className = 'music-item';

      const fileDate = new Date(file.createdAt).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      item.innerHTML = `
        <div class="music-info">
          <button class="music-icon play-btn" title="재생">
            <i class="fa-solid fa-play"></i>
          </button>
          <div class="music-details">
            <div class="music-title" title="${file.name}">${file.name}</div>
            <div class="music-meta">
              <span>${file.size}</span>
              <span>•</span>
              <span>${fileDate}</span>
            </div>
          </div>
        </div>
        <div class="music-actions">
          <a href="/api/download-file/${encodeURIComponent(file.name)}" class="btn-icon download" title="브라우저로 다운로드">
            <i class="fa-solid fa-circle-down"></i>
          </a>
          <button class="btn-icon delete" title="파일 삭제" data-filename="${file.name}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      // Bind Play action
      const playBtn = item.querySelector('.play-btn');
      playBtn.addEventListener('click', () => {
        const fileUrl = `/api/download-file/${encodeURIComponent(file.name)}`;
        
        if (activeAudio && activePlayBtn === playBtn) {
          // Toggle play/pause for currently active audio
          if (activeAudio.paused) {
            activeAudio.play();
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
          } else {
            activeAudio.pause();
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
          }
        } else {
          // Play new audio track
          if (activeAudio) {
            activeAudio.pause();
            if (activePlayBtn) {
              activePlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
          }
          
          activeAudio = new Audio(fileUrl);
          activePlayBtn = playBtn;
          
          activeAudio.addEventListener('ended', () => {
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            activeAudio = null;
            activePlayBtn = null;
          });
          
          activeAudio.play().then(() => {
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
          }).catch(err => {
            console.error('Audio play error:', err);
            alert('음악 재생 실패: 브라우저가 자동 재생을 차단했거나 파일이 손상되었습니다.');
          });
        }
      });

      // Bind delete action
      const deleteBtn = item.querySelector('.delete');
      deleteBtn.addEventListener('click', () => {
        const filename = deleteBtn.getAttribute('data-filename');
        if (confirm(`정말 '${filename}' 음악을 컴퓨터에서 삭제하시겠습니까?`)) {
          if (activePlayBtn === playBtn && activeAudio) {
            activeAudio.pause();
            activeAudio = null;
            activePlayBtn = null;
          }
          deleteDownload(filename);
        }
      });

      downloadsList.appendChild(item);
    });
  }

  // Delete a Downloaded File
  async function deleteDownload(filename) {
    try {
      const response = await fetch(`/api/download/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        loadDownloads();
      } else {
        alert('삭제 실패: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  }
});
