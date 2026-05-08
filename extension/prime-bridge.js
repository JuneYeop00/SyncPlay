(() => {
  if (window.__OTT_PRIME_BRIDGE_INSTALLED__) return;
  window.__OTT_PRIME_BRIDGE_INSTALLED__ = true;

  window.OTTPlatformBridges = window.OTTPlatformBridges || {};

  function cleanText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  // "Season 1" 또는 "시즌 1" 추출 및 정규화
  function normalizeSeasonText(text) {
    if (!text) return "";
    const value = cleanText(text);

    let match = value.match(/(시즌\s*|\bSeason\s*)\s*(\d+)/i);
    if (match) return `시즌 ${match[2]}`;

    return "";
  }

  // 에피소드 번호 정규화 (예: "에피소드 3" 또는 "Ep. 3" -> "3화")
  function normalizeEpisodeText(text) {
    if (!text) return "";
    const value = cleanText(text);

    let match = value.match(/(에피소드|에피|화|Ep|Episode)\s*\.?\s*(\d+)/i);
    if (match) return `${match[2]}화`;

    return "";
  }

  window.OTTPlatformBridges.PrimeVideo = {
    extract({ state, video, helpers }) {
      const { splitTitle } = helpers;

      // 1. 진도율 계산 (Prime Video는 재생바 내부의 [role="slider"] 요소를 흔히 사용)
      const slider = document.querySelector(".scrubber-slider, [role='slider'], input[type='range']");
      if (slider) {
        const now = parseFloat(slider.getAttribute("aria-valuenow") || slider.value);
        const max = parseFloat(slider.getAttribute("aria-valuemax") || slider.max);

        if (!isNaN(now) && !isNaN(max) && max > 0) {
          if (max <= 100) {
            state.progress = now.toFixed(2);
          } else {
            state.progress = ((now / max) * 100).toFixed(2);
            state.extractedCurrentTime = Math.floor(now);
            state.extractedDuration = Math.floor(max);
          }
        }
      }

      // 비디오 태그 폴백
      if ((!state.progress || isNaN(parseFloat(state.progress))) && video && video.duration > 0) {
        state.progress = ((video.currentTime / video.duration) * 100).toFixed(2);
        state.extractedCurrentTime = Math.floor(video.currentTime);
        state.extractedDuration = Math.floor(video.duration);
      }

      // 2. 제목 및 에피소드 정보 추출
      // Prime Video 웹 플레이어 최상위 텍스트 레이어 타겟팅
      const primeTitleEl = document.querySelector(".atv-player-ui-title, .f18r8mpt, [data-testid='player-title']");
      const primeSubTitleEl = document.querySelector(".atv-player-ui-subtitle, .f1v7g9p3, [data-testid='player-subtitle']");

      let rawTitle = primeTitleEl ? cleanText(primeTitleEl.innerText) : "";
      let rawSubTitle = primeSubTitleEl ? cleanText(primeSubTitleEl.innerText) : "";

      // DOM 요소가 비어있을 경우 document.title 기반으로 폴백 시도
      if (!rawTitle) {
        let docTitle = cleanText(document.title);
        // "Amazon.co.jp: ...", "Prime Video: ..." 접두사 제거
        docTitle = docTitle.replace(/^(Amazon|Prime Video)\s*[:|-]\s*/i, "");
        const parsed = splitTitle(docTitle);
        rawTitle = parsed.title;
        if (!rawSubTitle) rawSubTitle = parsed.subTitle;
      }

      if (rawTitle) {
        state.mainTitle = rawTitle;
      }

      // 3. 서브타이틀(시즌, 화수, 에피소드명) 정밀 결합
      if (rawSubTitle) {
        const seasonText = normalizeSeasonText(rawSubTitle);
        const episodeText = normalizeEpisodeText(rawSubTitle);

        // 에피소드 이름 분리 시도 (보통 "시즌 1: 에피소드 3 - 에피소드제목" 형식 대응)
        let episodeName = rawSubTitle;
        if (seasonText) episodeName = episodeName.replace(/(시즌\s*|\bSeason\s*)\s*(\d+)/i, "");
        if (episodeText) episodeName = episodeName.replace(/(에피소드|에피|화|Ep|Episode)\s*\.?\s*(\d+)/i, "");
        episodeName = episodeName.replace(/^[:\-\s,·]+|[:\-\s,·]+$/g, "").trim();

        let formattedSub = "";
        if (seasonText && episodeText) {
          formattedSub = `${seasonText} : ${episodeText}`;
        } else if (seasonText || episodeText) {
          formattedSub = seasonText || episodeText;
        }

        if (episodeName) {
          formattedSub = formattedSub ? `${formattedSub} (${episodeName})` : episodeName;
        }

        state.subTitle = formattedSub || rawSubTitle;
      }
    }
  };
})();