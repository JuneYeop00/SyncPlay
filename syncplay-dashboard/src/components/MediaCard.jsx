import React, { useState } from 'react';
import { Star, Play, X, Film, Trash2 } from 'lucide-react';

const OTT_LOGOS = {
  "netflix": "/logos/netflix.png",
  "tving": "/logos/tving.png",
  "disneyplus": "/logos/disneyplus.svg",
  "disney+": "/logos/disneyplus.svg",
  "coupangplay": "/logos/coupangplay.png",
  "coupang play": "/logos/coupangplay.png",
  "wavve": "/logos/wavve.png"
};

const MediaCard = ({ id, title, rawTitle, progress, posterUrl, overview, rating, url, platform, onDelete, isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayTitle = title || "제목 없음";
  const displayProgress = parseFloat(progress) || 0;
  const displayRating = typeof rating === 'number' ? rating.toFixed(1) : "0.0";
  const displayOverview = overview || "상세 정보가 등록되지 않은 콘텐츠입니다.";
  const defaultPoster = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=400';
  const finalPoster = posterUrl || defaultPoster;

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const cardBg = isDarkMode ? "bg-white/5 border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-md";

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

  const getPlatformStyle = (plat) => {
    const platKey = plat?.toLowerCase();
    if (platKey && OTT_LOGOS[platKey]) {
      return { iconUrl: OTT_LOGOS[platKey], name: plat || platKey.toUpperCase() };
    }
    return { text: 'OTT', name: plat || '알 수 없음' };
  };

  const platStyle = getPlatformStyle(platform);

  return (
      <>
        <div
            onClick={() => setIsModalOpen(true)}
            className={`flex flex-col w-full transition-all duration-500 hover:scale-105 cursor-pointer group ${cardBg} backdrop-blur-3xl rounded-[2.5rem] p-3 border relative overflow-hidden`}
        >
          <button
              onClick={handleDeleteClick}
              className={`absolute top-5 right-5 z-20 p-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-xl border ${isDarkMode ? "bg-black/40 hover:bg-red-500 text-white border-white/10" : "bg-white/80 hover:bg-red-500 hover:text-white border-slate-200"}`}
              title="시청 기록 삭제"
          >
            <Trash2 size={18} />
          </button>

          <div className={`w-full aspect-[2/3] rounded-[2rem] overflow-hidden relative shadow-2xl border ${isDarkMode ? "bg-black/20 border-white/5" : "bg-slate-100 border-slate-200"}`}>
            <div className={`absolute top-4 left-4 z-10 backdrop-blur-xl px-3 py-1.5 rounded-xl shadow-2xl flex items-center justify-center border ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white/80 border-slate-200"}`}>
              {platStyle.iconUrl ? (
                  <img src={platStyle.iconUrl} alt={platStyle.name} className={`h-3.5 w-auto object-contain ${isDarkMode ? 'filter brightness-110' : ''}`} />
              ) : (
                  <span className={`${isDarkMode ? 'text-white' : 'text-slate-900'} text-[10px] font-black tracking-widest uppercase`}>{platStyle.text}</span>
              )}
            </div>

            <img src={finalPoster} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            
            <div className={`absolute inset-0 ${isDarkMode ? 'bg-indigo-600/20' : 'bg-blue-600/10'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10 backdrop-blur-[2px]`}>
              <div className={`w-16 h-16 ${isDarkMode ? 'bg-white/10' : 'bg-white/40'} backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl`}>
                <Play className={`${isDarkMode ? 'text-white fill-white' : 'text-blue-600 fill-blue-600'} translate-x-0.5`} size={28} />
              </div>
            </div>
            
            <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'} z-10`}>
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-700" style={{ width: `${displayProgress}%` }} />
            </div>
          </div>
          
          <div className="mt-5 px-3 pb-2 relative z-10">
            <h3 className={`text-base font-black ${textPrimary} truncate tracking-tight group-hover:text-indigo-500 transition-colors`}>{displayTitle}</h3>
            <p className={`text-[11px] font-black ${textSecondary} mt-1 uppercase tracking-widest flex items-center gap-2`}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {Math.round(displayProgress)}% 시청 중
            </p>
          </div>
        </div>

        {isModalOpen && (
            <div onClick={() => setIsModalOpen(false)} className={`fixed inset-0 z-[999] flex items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in duration-500 ${isDarkMode ? 'bg-[#020617]/80' : 'bg-slate-900/40'}`}>
              <div onClick={(e) => e.stopPropagation()} className={`rounded-[4rem] overflow-hidden max-w-5xl w-full shadow-[0_40px_100px_rgba(0,0,0,0.6)] border relative animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ${isDarkMode ? 'bg-white/5 backdrop-blur-[80px] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-[45%] bg-[#020617] relative group overflow-hidden">
                    <img src={finalPoster} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="poster" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#020617]/20" />
                  </div>
                  
                  <div className="p-16 md:w-[55%] flex flex-col justify-between relative">
                    <button onClick={() => setIsModalOpen(false)} className={`absolute top-8 right-10 p-4 rounded-[1.5rem] transition-all border group ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-500 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-900'}`}><X size={24} /></button>
                    
                    <div>
                      <div className="flex items-center gap-4 mb-8">
                        <span className={`flex items-center gap-3 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          {platStyle.iconUrl && <img src={platStyle.iconUrl} alt={platStyle.name} className={`h-3.5 w-auto object-contain ${isDarkMode ? 'filter brightness-110' : ''}`} />}
                          {platStyle.name}
                        </span>
                        
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border ${isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                          <Star size={18} className="fill-yellow-500" />
                          <span className="text-base font-black">{displayRating}</span>
                        </div>
                      </div>
                      
                      <h2 className={`text-5xl font-black ${textPrimary} mb-8 tracking-tighter leading-tight drop-shadow-2xl`}>{displayTitle}</h2>
                      
                      <div className={`mb-10 p-8 rounded-[2.5rem] border shadow-inner ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <h4 className={`text-[10px] font-black ${textSecondary} uppercase tracking-[0.3em] mb-4`}>줄거리 요약</h4>
                        <p className={`leading-relaxed font-medium text-lg max-h-48 overflow-y-auto pr-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>                          {displayOverview}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-5 mt-4">
                      <button onClick={handlePlayClick} className={`flex-1 font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all group ${isDarkMode ? 'bg-white text-[#020617] shadow-white/10 hover:bg-indigo-50' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}>
                        <Play size={28} className={isDarkMode ? "fill-[#020617]" : "fill-white"} />
                        <span className="text-xl">바로 시청하기</span>
                      </button>
                      <button onClick={() => { setIsModalOpen(false); onDelete(id, rawTitle); }} className={`px-8 rounded-[2.5rem] flex items-center justify-center transition-all border ${isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-600 hover:text-white'}`}>
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </>
  );
};

export default MediaCard;
