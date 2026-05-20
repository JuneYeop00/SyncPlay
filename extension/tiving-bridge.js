(() => {
  // 중복 설치 방지
  // 기존 코드가 이미 주입되어 있어도 수정 버전이면 다시 덮어쓰기 위해 version 사용
  const TVING_BRIDGE_VERSION = "2026-05-18-leading-number-dot-fix-v2";

  if (window.__OTT_TVING_BRIDGE_VERSION__ === TVING_BRIDGE_VERSION) return;

  window.__OTT_TVING_BRIDGE_INSTALLED__ = true;
  window.__OTT_TVING_BRIDGE_VERSION__ = TVING_BRIDGE_VERSION;

  // 플랫폼 bridge 저장소
  window.OTTPlatformBridges = window.OTTPlatformBridges || {};

  function normalizeTvingText(rawText, cleanText) {
    return cleanText(rawText || "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/티빙|TVING/gi, "")
      .replace(/\|/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // "1. 제목", "1 . 제목", "1) 제목", "1 ) 제목" 형태의 앞 번호 제거
  // 단, "7번방의 선물", "1987", "1박 2일", "대탈출 2"처럼
  // 숫자 뒤에 . 또는 )가 없는 진짜 제목 숫자는 제거하지 않음
  function removeLeadingListNumber(title, cleanText) {
    return cleanText(title || "")
      .replace(/^[\s\u200B-\u200D\uFEFF]*\d+[\s\u200B-\u200D\uFEFF]*[\.)][\s\u200B-\u200D\uFEFF]*/, "")
      .trim();
  }

  // 회차 패턴 분리
  // 예:
  // "경도를 기다리며 11회" -> title: "경도를 기다리며", subTitle: "11회"
  // "경도를 기다리며 Ep.11" -> title: "경도를 기다리며", subTitle: "Ep.11"
  // "1. 취사병 전설이 되다 1화" -> title: "취사병 전설이 되다", subTitle: "1화"
  function splitTvingEpisodeText(rawText, cleanText) {
    const value = normalizeTvingText(rawText, cleanText);

    if (!value) {
      return {
        title: "",
        subTitle: "",
      };
    }

    // 예: "[395회] 무한도전 <형.광.팬 캠프> 마지막 이야기"
    const leadingBracketEpisodeMatch = value.match(/^\[\s*(\d+)\s*(화|회)\s*\]\s*(.+)$/i);

    if (leadingBracketEpisodeMatch) {
      const episodeNo = `${leadingBracketEpisodeMatch[1]}${leadingBracketEpisodeMatch[2]}`;
      const rest = normalizeTvingText(leadingBracketEpisodeMatch[3], cleanText);

      const detailStartIndex = rest.search(/[<《「『\[]/);

      if (detailStartIndex > 0) {
        const title = normalizeTvingText(rest.slice(0, detailStartIndex), cleanText);
        const detail = normalizeTvingText(rest.slice(detailStartIndex), cleanText);

        return {
          title: removeLeadingListNumber(title, cleanText),
          subTitle: normalizeTvingText(`${episodeNo} ${detail}`, cleanText),
        };
      }

      return {
        title: removeLeadingListNumber(rest, cleanText),
        subTitle: episodeNo,
      };
    }

    // 예: "395회 무한도전 <형.광.팬 캠프> 마지막 이야기"
    const leadingEpisodeMatch = value.match(/^(\d+)\s*(화|회)\s+(.+)$/i);

    if (leadingEpisodeMatch) {
      const episodeNo = `${leadingEpisodeMatch[1]}${leadingEpisodeMatch[2]}`;
      const rest = normalizeTvingText(leadingEpisodeMatch[3], cleanText);

      const detailStartIndex = rest.search(/[<《「『\[]/);

      if (detailStartIndex > 0) {
        const title = normalizeTvingText(rest.slice(0, detailStartIndex), cleanText);
        const detail = normalizeTvingText(rest.slice(detailStartIndex), cleanText);

        return {
          title: removeLeadingListNumber(title, cleanText),
          subTitle: normalizeTvingText(`${episodeNo} ${detail}`, cleanText),
        };
      }

      return {
        title: removeLeadingListNumber(rest, cleanText),
        subTitle: episodeNo,
      };
    }

    // 예: "사랑과 전쟁 시즌1 139회"
    const seasonEpisodeMatch = value.match(/^(.+?)\s*시즌\s*(\d+)\s*(\d+)\s*(화|회)$/i);

    if (seasonEpisodeMatch) {
      return {
        title: removeLeadingListNumber(seasonEpisodeMatch[1], cleanText),
        subTitle: `시즌 ${seasonEpisodeMatch[2]} ${seasonEpisodeMatch[3]}${seasonEpisodeMatch[4]}`,
      };
    }

    // 예: "대탈출 2 4화", "1. 취사병 전설이 되다 1화"
    const episodeMatch = value.match(/^(.+?)\s+(\d+)\s*(화|회)$/i);

    if (episodeMatch) {
      return {
        title: removeLeadingListNumber(episodeMatch[1], cleanText),
        subTitle: `${episodeMatch[2]}${episodeMatch[3]}`,
      };
    }

    // 예: "경도를 기다리며 Ep.11", "제목 EP 11"
    const epMatch = value.match(/^(.+?)\s*(Ep\.?|EP|에피소드)\s*(\d+)$/i);

    if (epMatch) {
      return {
        title: removeLeadingListNumber(epMatch[1], cleanText),
        subTitle: `EP ${epMatch[3]}`,
      };
    }

    return {
      title: removeLeadingListNumber(value, cleanText),
      subTitle: "",
    };
  }

  const bridge = {
    extract({ state, video, helpers }) {
      const { cleanText, splitTitle, getMetaContent } = helpers;

      // 티빙 플레이어 내부 제목 요소 우선
      const programTitleEl =
        document.querySelector(".player-program-title") ||
        document.querySelector(".program-title") ||
        document.querySelector("h1");

      const episodeTitleEl =
        document.querySelector(".player-episode-title") ||
        document.querySelector(".episode-title");

      // ------------------------------
      // 제목 / 상세 추출
      // ------------------------------

      if (
        programTitleEl &&
        normalizeTvingText(programTitleEl.innerText || programTitleEl.textContent || "", cleanText) !== ""
      ) {
        const rawProgramTitle = normalizeTvingText(
          programTitleEl.innerText || programTitleEl.textContent || "",
          cleanText
        );

        const parsedProgramTitle = splitTvingEpisodeText(rawProgramTitle, cleanText);

        // programTitle 안에 회차가 섞여 있으면 분리
        state.mainTitle = parsedProgramTitle.title || removeLeadingListNumber(rawProgramTitle, cleanText);

        // episodeTitleEl 있으면 그걸 우선 subTitle로 사용
        const rawEpisodeTitle = normalizeTvingText(
          episodeTitleEl?.innerText || episodeTitleEl?.textContent || "",
          cleanText
        );

        if (rawEpisodeTitle) {
          state.subTitle = rawEpisodeTitle;
        } else if (parsedProgramTitle.subTitle) {
          state.subTitle = parsedProgramTitle.subTitle;
        }
      } else {
        // 셀렉터 실패 시 브라우저 탭 제목(document.title) / meta 에서 추출 및 분리
        let rawDocTitle =
          document.title ||
          getMetaContent('meta[property="og:title"]') ||
          getMetaContent('meta[name="twitter:title"]') ||
          "";

        rawDocTitle = normalizeTvingText(rawDocTitle, cleanText);

        const parsed = splitTvingEpisodeText(rawDocTitle, cleanText);

        if (parsed.title) state.mainTitle = parsed.title;

        if (parsed.subTitle) {
          state.subTitle = parsed.subTitle;
        } else {
          // 그래도 안 나뉘면 공통 splitTitle 한 번 더
          const fallbackParsed = splitTitle(rawDocTitle);

          if (fallbackParsed.title) {
            state.mainTitle = removeLeadingListNumber(fallbackParsed.title, cleanText);
          }

          if (fallbackParsed.subTitle) {
            state.subTitle = fallbackParsed.subTitle;
          }
        }
      }

      // ------------------------------
      // 제목 정제
      // ------------------------------

      // "1. 제목", "1) 제목" 형태의 앞 번호 제거
      // 단, "7번방의 선물", "1987", "1박 2일"처럼 숫자 뒤에 . 또는 )가 없으면 제거하지 않음
      if (state.mainTitle) {
        state.mainTitle = removeLeadingListNumber(state.mainTitle, cleanText);
      }

      // 끝에 남은 대시 / 공백 제거
      if (state.mainTitle) {
        state.mainTitle = state.mainTitle.replace(/[-\s]+$/, "").trim();
      }

      // popup.js가 state.title을 볼 수도 있으니 같이 맞춤
      if (state.mainTitle) {
        state.title = state.mainTitle;
      }

      // ------------------------------
      // 진도 추출
      // ------------------------------

      if (video) {
        if (Number.isFinite(video.currentTime)) {
          state.extractedCurrentTime = Math.floor(video.currentTime);
        }

        if (Number.isFinite(video.duration) && video.duration > 0) {
          state.extractedDuration = Math.floor(video.duration);
        }

        if (
          state.extractedCurrentTime !== null &&
          state.extractedDuration !== null &&
          state.extractedDuration > 0
        ) {
          state.progress = ((state.extractedCurrentTime / state.extractedDuration) * 100).toFixed(2);
        }
      }
    },
  };

  // popup.js에서 TVING / Tving / tving 중 어떤 키로 찾든 동작하게 등록
  window.OTTPlatformBridges.TVING = bridge;
  window.OTTPlatformBridges.Tving = bridge;
  window.OTTPlatformBridges.tving = bridge;
})();