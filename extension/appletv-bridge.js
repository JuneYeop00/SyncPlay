(() => {
  if (window.__OTT_APPLETV_BRIDGE_INSTALLED__) return;
  window.__OTT_APPLETV_BRIDGE_INSTALLED__ = true;

  window.OTTPlatformBridges = window.OTTPlatformBridges || {};

  function cleanText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function normalizeSeasonText(text) {
    if (!text) return "";
    const value = cleanText(text);
    // "시즌 1", "Season 1", "S1" 패턴 매칭
    let match = value.match(/(시즌\s*|\bSeason\s*|\bS)\s*(\d+)/i);
    if (match) return `시즌 ${match[2]}`;
    return "";
  }

  function normalizeEpisodeText(text) {
    if (!text) return "";
    const value = cleanText(text);
    // "1화", "Episode 1", "Ep 1", "E1" 패턴 매칭
    let match = value.match(/(에피소드|\bEpisode\s*|\bEp\s*|\bE|\b화)\s*\.?\s*(\d+)/i);
    if (match) return `${match[2]}화`;
    return "";
  }

  window.OTTPlatformBridges.AppleTV = {
    extract({ state, video, helpers }) {
      const { splitTitle } = helpers;

      // 1. 진도율 계산 (Apple TV는 자체 슬라이더 속성 기입 혹은 비디오 프로퍼티에 의존)
      const slider = document.querySelector("[role='slider'], .progress-bar, input[type='range']");
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

      if ((!state.progress || isNaN(parseFloat(state.progress))) && video && video.duration > 0) {
        state.progress = ((video.currentTime / video.duration) * 100).toFixed(2);
        state.extractedCurrentTime = Math.floor(video.currentTime);
        state.extractedDuration = Math.floor(video.duration);
      }

      // 2. 제목 추출 (플레이어 오버레이 UI 요소 탐색)
      // Apple TV 웹 레이아웃은 버전에 따라 '.video-title', '.show-title', '.episode-title' 등의 클래스를 가집니다.
      const showTitleEl = document.querySelector(".product-show-title, .show-title, .normalized-title");
      const metaTitleEl = document.querySelector(".product-title, .episode-title, .video-title");

      let mainTitle = showTitleEl ? cleanText(showTitleEl.innerText) : "";
      let subInfo = metaTitleEl ? cleanText(metaTitleEl.innerText) : "";

      // 플레이어 UI 텍스트 수집 실패 시 document.title 분석
      if (!mainTitle) {
        let docTitle = cleanText(document.title);
        // "Apple TV+" 또는 "Apple TV" 제거
        docTitle = docTitle.replace(/\s*-\s*Apple\s*TV\s*\+?$/i, "");
        const parsed = splitTitle(docTitle);
        mainTitle = parsed.title;
        if (!subInfo) subInfo = parsed.subTitle;
      }

      if (mainTitle) {
        state.mainTitle = mainTitle;
      }

      // 3. 서브타이틀 구조화 (시즌과 에피소드 정규화 및 결합)
      if (subInfo) {
        // Apple TV 오버레이에 "S1, E3" 또는 "시즌 1, 에피소드 3" 형태로 나타나는 경우가 많음
        const seasonPart = normalizeSeasonText(subInfo);
        const episodePart = normalizeEpisodeText(subInfo);

        // 정규화된 텍스트들을 제외한 순수 에피소드 부제목명 정제
        let pureSubTitle = subInfo;
        if (seasonPart) pureSubTitle = pureSubTitle.replace(/(시즌\s*|\bSeason\s*|\bS)\s*(\d+)/i, "");
        if (episodePart) pureSubTitle = pureSubTitle.replace(/(에피소드|\bEpisode\s*|\bEp\s*|\bE|\b화)\s*\.?\s*(\d+)/i, "");
        pureSubTitle = pureSubTitle.replace(/^[:\-\s,·]+|[:\-\s,·]+$/g, "").trim();

        let combinedSub = "";
        if (seasonPart && episodePart) {
          combinedSub = `${seasonPart} : ${episodePart}`;
        } else if (seasonPart || episodePart) {
          combinedSub = seasonPart || episodePart;
        }

        if (pureSubTitle) {
          combinedSub = combinedSub ? `${combinedSub} (${pureSubTitle})` : pureSubTitle;
        }

        state.subTitle = combinedSub || subInfo;
      }
    }
  };
})();