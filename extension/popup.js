const API_BASE_URL = "https://syncplay-server-8ovd.onrender.com";

const SYNCPLAY_FRONT_URLS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
   "https://ott-syncplay.vercel.app",
];

// Vercel은 기본 도메인 외에도 preview/deployment 주소가 생길 수 있어서 hostname 기준으로도 검사
function isSyncPlayFrontTabUrl(url) {
  try {
    if (!url) return false;

    if (SYNCPLAY_FRONT_URLS.some((frontUrl) => url.startsWith(frontUrl))) {
      return true;
    }

    const { hostname } = new URL(url);

    return (
      hostname === "ott-syncplay.vercel.app" ||
      (hostname.startsWith("ott-syncplay-") && hostname.endsWith(".vercel.app"))
    );
  } catch (e) {
    return false;
  }
}

// 플랫폼별 bridge 파일 매핑
const PLATFORM_BRIDGE_FILES = {
  Netflix: "netflix-bridge.js",
  DisneyPlus: "disney-bridge.js",
  CoupangPlay: "coupang-bridge.js",
  Watcha: "watcha-bridge.js",
  Wavve: "wave-bridge.js",
  TVING: "tiving-bridge.js",
};

// 팝업 버튼 클릭 시 실행
document.getElementById("extractBtn").addEventListener("click", handleExtract);

// SyncPlay 프론트 탭들 중 localStorage.user 정보가 실제로 있는 탭을 찾음
async function getUserFromSyncPlayTab() {
  try {
    const tabs = await chrome.tabs.query({});
    const syncplayTabs = tabs.filter((tab) => isSyncPlayFrontTabUrl(tab.url));

    for (const tab of syncplayTabs) {
      if (!tab.id) continue;

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            try {
              const raw = localStorage.getItem("user");
              if (!raw) return null;

              const user = JSON.parse(raw);

              return {
                email: user?.email || "",
                name: user?.name || "",
              };
            } catch (e) {
              return null;
            }
          },
        });

        const user = results?.[0]?.result || null;

        if (user?.email) {
          return user;
        }
      } catch (e) {
        console.error("탭 검사 실패:", tab.url, e);
      }
    }

    return null;
  } catch (e) {
    console.error("사용자 정보 읽기 실패:", e);
    return null;
  }
}

async function handleExtract() {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "영상 정보 추출 중...";

  try {
    // 현재 활성 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab?.url) {
      resultDiv.innerText = "현재 탭 정보를 가져오지 못했습니다.";
      return;
    }

    // 현재 URL 기준 플랫폼 판별
    const platform = detectPlatform(tab.url);

    if (!platform) {
      resultDiv.innerText = "지원하지 않는 OTT 페이지입니다.";
      return;
    }

    // 플랫폼별 bridge 파일 먼저 주입
    const bridgeFile = PLATFORM_BRIDGE_FILES[platform];
    if (bridgeFile) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [bridgeFile],
      });
    }

    // 현재 페이지에 extractVideoInfo 함수 주입 후 결과 받기
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractVideoInfo,
    });

    const data = injectionResults?.[0]?.result;

    // 추출 실패 시 안내 문구 출력
    if (!data) {
      resultDiv.innerText = "데이터를 가져오지 못했습니다. 새로고침 후 다시 시도해주세요.";
      return;
    }

    // SyncPlay 프론트 탭에서 로그인 사용자 정보 읽기
    const loginUser = await getUserFromSyncPlayTab();

    if (!loginUser?.email) {
      resultDiv.innerText =
        "SyncPlay 대시보드 탭에서 로그인 사용자 정보를 찾지 못했습니다. https://syncplay-backup.vercel.app 또는 로컬 프론트를 열고 로그인한 뒤 다시 시도해주세요.";
      return;
    }

    const userEmail = loginUser.email;
    const userDisplayName = loginUser.name || loginUser.email;

    // 서버로 보낼 payload 구성
    const payload = {
      userEmail,
      platform: data.platform,
      title: data.title,
      subTitle: data.subTitle,
      progress: data.progress !== null ? String(data.progress) : "0",
      currentTime: data.currentTime,
      duration: data.duration,
      url: data.url,
      watchedAt: new Date().toISOString(),
    };

    // 백엔드 서버로 시청 기록 전송
    const resp = await fetch(`${API_BASE_URL}/api/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 전송 성공 시 팝업에 표시
    if (resp.ok) {
      resultDiv.innerHTML = `
        <div style="color: #2563eb; font-weight: bold;">✅ 전송 성공!</div>
        <div style="font-size: 13px; margin-top: 5px;">
          👤 사용자: ${userDisplayName}<br>
          🎬 제목: ${payload.title}<br>
          📝 상세: ${payload.subTitle || "없음"}<br>
          📊 진도: ${payload.progress}%
        </div>
      `;
    } else {
      const errorText = await resp.text();
      resultDiv.innerText = `서버 전송 실패: ${errorText || resp.status}`;
    }
  } catch (err) {
    resultDiv.innerText = "에러 발생: " + err.message;
  }
}

// URL 기준 플랫폼 판별
function detectPlatform(url) {
  try {
    const host = new URL(url).hostname;

    if (host.includes("netflix.com")) return "Netflix";
    if (host.includes("disneyplus.com")) return "DisneyPlus";
    if (host.includes("coupangplay.com")) return "CoupangPlay";
    if (host.includes("watcha.com")) return "Watcha";
    if (host.includes("wavve.com")) return "Wavve";
    if (host.includes("tving.com")) return "TVING";

    return null;
  } catch (e) {
    return null;
  }
}

function extractVideoInfo() {
  const host = location.hostname;
  let platform = "Unknown";

  if (host.includes("netflix.com")) platform = "Netflix";
  else if (host.includes("disneyplus.com")) platform = "DisneyPlus";
  else if (host.includes("coupangplay.com")) platform = "CoupangPlay";
  else if (host.includes("watcha.com")) platform = "Watcha";
  else if (host.includes("wavve.com")) platform = "Wavve";
  else if (host.includes("tving.com")) platform = "TVING";

  const bridges = window.OTTPlatformBridges || {};

  function parseTimeToSeconds(text) {
    if (!text) return null;

    const clean = String(text).trim().replace(/[^\d:]/g, "");
    const parts = clean.split(":").map(Number);

    if (!clean || parts.some(isNaN)) return null;

    if (parts.length === 2) {
      const [mm, ss] = parts;
      return mm * 60 + ss;
    }

    if (parts.length === 3) {
      const [hh, mm, ss] = parts;
      return hh * 3600 + mm * 60 + ss;
    }

    return null;
  }

  function getShadowElement(hostEl, selector) {
    try {
      if (!hostEl || !hostEl.shadowRoot) return null;
      return hostEl.shadowRoot.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function cleanText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function getMetaContent(selector) {
    return cleanText(document.querySelector(selector)?.content || "");
  }

  function readBridgeMeta(attributeName) {
    try {
      const raw = document.documentElement?.getAttribute(attributeName);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function isVisible(el) {
    if (!el) return false;

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function getBestVideoElement() {
    const videos = [...document.querySelectorAll("video")];
    if (!videos.length) return null;

    const scoredVideos = videos.map((video, index) => {
      const rect = video.getBoundingClientRect();
      const area = rect.width * rect.height;

      let score = 0;

      if (isVisible(video)) score += 1000000;
      if (Number.isFinite(video.currentTime) && video.currentTime > 0) score += 300000;
      if (Number.isFinite(video.duration) && video.duration > 0) score += 300000;
      if (video.paused === false) score += 200000;

      score += area;

      return {
        video,
        score,
        index,
      };
    });

    scoredVideos.sort((a, b) => b.score - a.score);
    return scoredVideos[0]?.video || videos[0] || null;
  }

  function splitTitle(rawTitle) {
    let value = cleanText(rawTitle);

    value = value
      .replace(/\|\s*Netflix\s*$/i, "")
      .replace(/\|\s*넷플릭스\s*$/i, "")
      .replace(/\|\s*Disney\+\s*$/i, "")
      .replace(/\|\s*디즈니\+\s*$/i, "")
      .replace(/\|\s*Coupang Play\s*$/i, "")
      .replace(/\|\s*쿠팡플레이\s*$/i, "")
      .replace(/\|\s*WATCHA\s*$/i, "")
      .replace(/\|\s*왓챠\s*$/i, "")
      .replace(/\|\s*wavve\s*$/i, "")
      .replace(/\|\s*웨이브\s*$/i, "")
      .replace(/\|\s*TVING\s*$/i, "")
      .replace(/\|\s*티빙\s*$/i, "")
      .trim();

    if (!value) {
      return {
        title: "",
        subTitle: "",
      };
    }

    if (value.includes(":")) {
      const parts = value.split(":");
      return {
        title: cleanText(parts[0]),
        subTitle: cleanText(parts.slice(1).join(":")),
      };
    }

    const splitRegex = /(시즌\s*\d+|파트\s*\d+|제\s*\d+\s*화|\d+화|S\d+E\d+|Episode\s*\d+)/i;
    const match = value.match(splitRegex);

    if (match && match.index > 0) {
      return {
        title: cleanText(value.substring(0, match.index)),
        subTitle: cleanText(value.substring(match.index)),
      };
    }

    return {
      title: value,
      subTitle: "",
    };
  }

  function applyCommonSliderProgress(state) {
    const sliderCandidates = [
      ...document.querySelectorAll(".scrubber-slider"),
      ...document.querySelectorAll("[role='slider']"),
      ...document.querySelectorAll("[aria-valuenow][aria-valuemax]"),
      ...document.querySelectorAll("input[type='range']"),
    ];

    for (const slider of sliderCandidates) {
      const now = parseFloat(slider.getAttribute("aria-valuenow") || slider.value);
      const max = parseFloat(slider.getAttribute("aria-valuemax") || slider.max);

      if (isNaN(now) || isNaN(max) || max <= 0) continue;

      if (max <= 100) {
        state.progress = now.toFixed(2);
        return;
      }

      state.extractedCurrentTime = Math.floor(now);
      state.extractedDuration = Math.floor(max);
      state.progress = ((now / max) * 100).toFixed(2);
      return;
    }
  }

  const video = getBestVideoElement();

  const state = {
    mainTitle: "",
    subTitle: "",
    progress: null,
    extractedCurrentTime:
      video && Number.isFinite(video.currentTime) ? Math.floor(video.currentTime) : null,
    extractedDuration:
      video && Number.isFinite(video.duration) && video.duration > 0
        ? Math.floor(video.duration)
        : null,
  };

  if (
    state.extractedCurrentTime !== null &&
    state.extractedDuration !== null &&
    state.extractedDuration > 0
  ) {
    state.progress = ((state.extractedCurrentTime / state.extractedDuration) * 100).toFixed(2);
  }

  applyCommonSliderProgress(state);

  const defaultTitle = splitTitle(document.title || "");
  if (defaultTitle.title) state.mainTitle = defaultTitle.title;
  if (defaultTitle.subTitle) state.subTitle = defaultTitle.subTitle;

  if (bridges[platform] && typeof bridges[platform].extract === "function") {
    try {
      bridges[platform].extract({
        state,
        video,
        helpers: {
          parseTimeToSeconds,
          getShadowElement,
          cleanText,
          getMetaContent,
          readBridgeMeta,
          splitTitle,
        },
      });
    } catch (e) {
      console.error(`${platform} bridge error:`, e);
    }
  }

  if (!state.mainTitle) {
    const fallback = splitTitle(document.title || "");
    state.mainTitle = fallback.title || "";
    if (!state.subTitle) state.subTitle = fallback.subTitle || "";
  }

  if (state.subTitle) {
    state.subTitle = state.subTitle.replace(
      /(화|시즌\s*\d+|파트\s*\d+|S\d+E\d+|Episode\s*\d+)(?=[^\s:])/gi,
      "$1 "
    );
    state.subTitle = state.subTitle.replace(/\s{2,}/g, " ").trim();
  }

  if (!state.mainTitle || state.mainTitle === "") {
    state.mainTitle = "제목 인식 실패";
    state.subTitle = "영상 화면을 클릭한 뒤 다시 시도해주세요";
  }

  if (!Number.isFinite(state.extractedCurrentTime)) state.extractedCurrentTime = null;
  if (!Number.isFinite(state.extractedDuration) || state.extractedDuration <= 0) {
    state.extractedDuration = null;
  }

  if (
    (state.progress === null || isNaN(parseFloat(state.progress))) &&
    state.extractedCurrentTime !== null &&
    state.extractedDuration !== null &&
    state.extractedDuration > 0
  ) {
    state.progress = ((state.extractedCurrentTime / state.extractedDuration) * 100).toFixed(2);
  }

  if (state.progress !== null && !isNaN(parseFloat(state.progress))) {
    let numericProgress = parseFloat(state.progress);

    if (numericProgress < 0) numericProgress = 0;
    if (numericProgress > 100) numericProgress = 100;

    state.progress = numericProgress.toFixed(2);
  }

  if (state.progress === null) {
    state.progress = "0";
  }

  return {
    platform: platform,
    title: state.mainTitle,
    subTitle: state.subTitle,
    progress: state.progress,
    currentTime: state.extractedCurrentTime,
    duration: state.extractedDuration,
    url: location.href,
  };
}