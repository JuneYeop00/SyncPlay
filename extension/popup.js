const API_BASE_URL = "http://localhost:8080";

// 플랫폼별 bridge 파일 매핑
const PLATFORM_BRIDGE_FILES = {
  Netflix: "netflix-bridge.js",
  DisneyPlus: "disney-bridge.js",
  CoupangPlay: "coupang-bridge.js",
  Watcha: "watcha-bridge.js",
  Wavve: "wave-bridge.js",
  TVING: "tiving-bridge.js",
};

// 시즌 정보가 늦게 로드되는 플랫폼 목록
const PLATFORMS_WITH_RETRY = ["Netflix"];

// 팝업 버튼 클릭 시 실행
document.getElementById("extractBtn").addEventListener("click", handleExtract);

// SyncPlay(localhost) 탭에서 로그인 이메일 읽기
async function getUserEmailFromSyncPlayTab() {
  try {
    const tabs = await chrome.tabs.query({});

    const candidateTabs = tabs.filter((tab) => {
      if (!tab.url) return false;

      try {
        const u = new URL(tab.url);
        const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";
        if (!isLocal) return false;

        // API 응답 탭 제외
        if (u.pathname.startsWith("/api/")) return false;

        return true;
      } catch (e) {
        return false;
      }
    });

    for (const tab of candidateTabs) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            try {
              const user = JSON.parse(localStorage.getItem("user") || "null");
              return user?.email || "";
            } catch (e) {
              return "";
            }
          },
        });

        const email = results?.[0]?.result || "";
        if (email) return email;
      } catch (e) {
        // 다음 탭 검사
      }
    }

    return "";
  } catch (e) {
    console.error("사용자 이메일 읽기 실패:", e);
    return "";
  }
}

async function handleExtract() {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "영상 정보 추출 중...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab?.url) {
      resultDiv.innerText = "현재 탭 정보를 가져오지 못했습니다.";
      return;
    }

    const platform = detectPlatform(tab.url);

    if (!platform) {
      resultDiv.innerText = "지원하지 않는 OTT 페이지입니다.";
      return;
    }

    const bridgeFile = PLATFORM_BRIDGE_FILES[platform];
    if (bridgeFile) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [bridgeFile],
      });
    }

    const MAX_RETRY = PLATFORMS_WITH_RETRY.includes(platform) ? 15 : 1;
    const RETRY_INTERVAL = 300;

    let injectionResults;
    let data;

    for (let i = 0; i < MAX_RETRY; i++) {
      injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractVideoInfo,
        world: "MAIN",
      });

      data = injectionResults?.[0]?.result;

      if (!data || !PLATFORMS_WITH_RETRY.includes(platform)) break;
      if (/시즌/.test(data.subTitle || "")) break;
      if (data.title && data.title !== "제목 인식 실패" && data.title !== "넷플릭스") break;

      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }

    if (!data) {
      resultDiv.innerText = "데이터를 가져오지 못했습니다. 새로고침 후 다시 시도해주세요.";
      return;
    }

    const userEmail = await getUserEmailFromSyncPlayTab();

    if (!userEmail) {
      resultDiv.innerText =
        "SyncPlay 탭에서 로그인 사용자 이메일을 찾지 못했습니다. SyncPlay를 열어 로그인한 상태로 다시 시도해주세요.";
      return;
    }

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

    const resp = await fetch(`${API_BASE_URL}/api/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (resp.ok) {
      resultDiv.innerHTML = `
        <div style="color: #2563eb; font-weight: bold;">✅ 전송 성공!</div>
        <div style="font-size: 13px; margin-top: 5px;">
          👤 사용자: ${payload.userEmail}<br>
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

      return { video, score, index };
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
      return { title: "", subTitle: "" };
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

    return { title: value, subTitle: "" };
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
    extractedCurrentTime: video && Number.isFinite(video.currentTime) ? Math.floor(video.currentTime) : null,
    extractedDuration: video && Number.isFinite(video.duration) && video.duration > 0 ? Math.floor(video.duration) : null,
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