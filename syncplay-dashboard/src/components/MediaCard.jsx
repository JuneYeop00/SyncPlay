import React, { useState } from 'react';
import { Star, Play, X, Film, Trash2 } from 'lucide-react';

// [추가됨] 마이페이지와 완벽하게 동일한 로컬 로고 사전입니다.
const OTT_LOGOS = {
  "netflix": "/logos/netflix.png",
  "tving": "/logos/tving.png",
  "disneyplus": "/logos/disneyplus.svg",
  "disney+": "/logos/disneyplus.svg",     // 간혹 disney+로 넘어올 경우를 대비
  "coupangplay": "/logos/coupangplay.png",
  "coupang play": "/logos/coupangplay.png",
  "wavve": "/logos/wavve.png"
};

const MediaCard = ({ id, title, rawTitle, progress, posterUrl, overview, rating, url, platform, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayTitle = title || "제목 없음";
  const displayProgress = parseFloat(progress) || 0;
  const displayRating = typeof rating === 'number' ? rating.toFixed(1) : "0.0";
  const displayOverview = overview || "상세 정보가 등록되지 않은 콘텐츠입니다.";
  const defaultPoster = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=400';
  const finalPoster = posterUrl || defaultPoster;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(id, rawTitle);
  };

  const handlePlayClick = () => {
    if (url && url !== 'undefined') {
      window.open(url, '_blank');
    } else {
      alert("저장된 영상 주소가 없습니다. 확장 프로그램에서 다시 정보를 추출해주세요.");
    }
  };

  // [수정됨] 로컬에 저장된 로고를 최우선으로 불러오도록 변경했습니다.
  const getPlatformStyle = (plat) => {
    const platKey = plat?.toLowerCase();

    // 1. 우리가 로컬에 저장해둔 로고가 있는지 먼저 확인합니다.
    if (platKey && OTT_LOGOS[platKey]) {
      return {
        iconUrl: OTT_LOGOS[platKey],
        name: plat || platKey.toUpperCase()
      };
    }

    // 2. 만약 저장해둔 로고가 없는 기타 플랫폼이라면 텍스트로 처리합니다.
    return {
      text: 'OTT',
      name: plat || 'Unknown'
    };
  };

  const platStyle = getPlatformStyle(platform);

  return (
      <>
        <div
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col w-full transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group bg-white rounded-2xl p-2 border border-gray-100 relative"
        >
          <button
              onClick={handleDeleteClick}
              className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
              title="기록 삭제"
          >
            <Trash2 size={16} />
          </button>

          <div className="w-full aspect-[2/3] bg-slate-100 rounded-xl overflow-hidden relative shadow-sm">

            {/* [핵심 수정 부분] 포스터 위 로고 배지 디자인
              - 투박한 하얀 박스를 제거하고 세련된 반투명 유리 질감(backdrop-blur) 적용
              - 로고가 자연스럽게 스며들도록 크기와 배경 투명도를 미세 조정 */}
            <div className="absolute top-3 left-3 z-10 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-xl shadow-sm flex items-center justify-center border border-white/10">
              {platStyle.iconUrl ? (
                  // [수정됨] 이질감을 줄이기 위해 크기를 미세 조정하고 비율 유지 (object-contain)
                  <img src={platStyle.iconUrl} alt={platStyle.name} className="h-3.5 w-auto object-contain" />
              ) : (
                  <span className="text-gray-800 text-[10px] font-black">{platStyle.text}</span>
              )}
            </div>

            <img
                src={finalPoster}
                alt={displayTitle}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => { e.target.src = defaultPoster; }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
              <Play className="text-white fill-white" size={36} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50 z-10">
              <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${displayProgress}%` }} />
            </div>
          </div>
          <div className="mt-3 px-1 pb-1">
            <h3 className="text-sm font-bold text-slate-800 truncate">{displayTitle}</h3>
            <p className="text-[11px] font-bold text-red-600 mt-1">{Math.round(displayProgress)}% 시청 중</p>
          </div>
        </div>

        {isModalOpen && (
            <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                <div className="relative h-72 sm:h-96 bg-black flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0">
                    <img src={finalPoster} className="w-full h-full object-cover blur-2xl opacity-40 scale-110" alt="bg" />
                  </div>
                  <img src={finalPoster} className="relative h-[90%] object-contain rounded-lg shadow-2xl border border-white/10" alt="poster" />
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-10 h-10 flex-shrink-0 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all z-50 border border-white/20">
                    <X size={20} strokeWidth={3} />
                  </button>
                </div>

                <div className="p-8 bg-white relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">{displayTitle}</h2>
                      <div className="flex flex-wrap items-center gap-3">

                        {/* 모달 내부 로고 배지도 밝은 톤으로 통일 */}
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-800 rounded-full text-[12px] font-bold shadow-sm border border-gray-100 h-9">
                      {platStyle.iconUrl && <img src={platStyle.iconUrl} alt={platStyle.name} className="h-3.5 w-auto object-contain" />}
                          {platStyle.name}
                    </span>

                        <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold border border-slate-200">
                      <Film size={14} /> 4K ULTRA HD
                    </span>
                        <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                          <Star size={16} className="fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-black text-yellow-700">{displayRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-8">
                    <p className="text-slate-600 leading-relaxed text-[15px] bg-slate-50 p-5 rounded-2xl border border-slate-100 max-h-32 overflow-y-auto">
                      {displayOverview}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handlePlayClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-transform active:scale-95">
                      <Play size={20} className="fill-white" /> {platStyle.name}에서 이어보기
                    </button>
                    <button onClick={() => { setIsModalOpen(false); onDelete(id, rawTitle); }} className="px-6 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-red-100">
                      <Trash2 size={20} /> 삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </>
  );
};

export default MediaCard;