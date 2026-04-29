import React, { useState, useEffect, useCallback } from 'react';
import { User, LogOut, Heart, PlayCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const OTT_LOGOS = {
  "Netflix": "/logos/netflix.png",
  "TVING": "/logos/tving.png",
  "Disney+": "/logos/disneyplus.svg",
  "Coupang Play": "/logos/coupangplay.png",
  "Wavve": "/logos/wavve.png"
};

const OTT_LIST = [
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600', gradient: 'linear-gradient(135deg, #E50914, #B20710)', shadowColor: 'rgba(229, 9, 20, 0.4)' },
  { id: 'tving', name: 'TVING', color: 'bg-red-500', gradient: 'linear-gradient(135deg, #E6007E, #A3005A)', shadowColor: 'rgba(230, 0, 126, 0.4)' },
  { id: 'disneyplus', name: 'Disney+', color: 'bg-blue-700', gradient: 'linear-gradient(135deg, #011D75, #00124A)', shadowColor: 'rgba(1, 29, 117, 0.4)' },
  { id: 'coupangplay', name: 'Coupang Play', color: 'bg-sky-500', gradient: 'linear-gradient(135deg, #00A6DA, #00769A)', shadowColor: 'rgba(0, 166, 218, 0.4)' },
  { id: 'wavve', name: 'Wavve', color: 'bg-blue-500', gradient: 'linear-gradient(135deg, #2481F4, #185CBF)', shadowColor: 'rgba(36, 129, 244, 0.4)' },
];

const MyPage = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [recentHistory, setRecentHistory] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-500" : "text-slate-500";
  const cardClass = isDarkMode 
    ? "bg-white/5 backdrop-blur-3xl border-white/10 shadow-2xl" 
    : "bg-white/70 backdrop-blur-xl border-slate-200 shadow-lg";

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      setUserInfo({ name: savedUser.name, email: savedUser.email });
      fetchSubscriptions(savedUser.email);
      fetchWishlist(savedUser.email);
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/history');
        if (response.ok) {
          const data = await response.json();
          const top3History = data.reverse().slice(0, 3);
          const enrichedHistory = await Promise.all(
              top3History.map(async (item) => {
                try {
                  const tmdbResp = await fetch(
                      `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(item.title)}&include_adult=false&language=ko-KR&page=1`,
                      { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } }
                  );
                  const tmdbData = await tmdbResp.json();
                  const detail = tmdbData.results?.find(res => res.media_type === 'movie' || res.media_type === 'tv') || tmdbData.results?.[0] || {};
                  return {
                    ...item,
                    posterUrl: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
                    mediaType: detail.media_type || (item.subTitle ? 'tv' : 'movie')
                  };
                } catch (e) {
                  return item;
                }
              })
          );
          setRecentHistory(enrichedHistory);
        }
      } catch (error) {
        console.error("기록 로드 실패:", error);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchSubscriptions = async (email) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/subscriptions?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setMySubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error("구독 정보 불러오기 실패:", error);
    }
  };

  const fetchWishlist = async (email) => {
    try {
      const res = await fetch(`http://localhost:8080/api/wishlist?email=${encodeURIComponent(email)}`);
      if (res.ok) setWishlist(await res.json());
    } catch (err) {
      console.error("찜 목록 불러오기 실패:", err);
    }
  };

  const toggleSubscription = async (ottId) => {
    if (!userInfo.email) return;
    let updatedSubs = mySubscriptions.includes(ottId) ? mySubscriptions.filter(id => id !== ottId) : [...mySubscriptions, ottId];
    setMySubscriptions(updatedSubs);
    try {
      await fetch(`http://localhost:8080/api/users/subscriptions?email=${encodeURIComponent(userInfo.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions: updatedSubs })
      });
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const filterWhite = { filter: 'brightness(0) invert(1)' };

  return (
      <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="max-w-4xl space-y-12">
          {/* 사용자 정보 카드 */}
          <div className={`${cardClass} rounded-[3rem] p-12 flex items-center gap-10 group relative overflow-hidden border`}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform duration-500 shrink-0">
              <User size={64} className="drop-shadow-lg" />
            </div>
            <div className="relative z-10">
              <div className={`inline-block px-3 py-1 rounded-lg ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-blue-50 border-blue-100 text-blue-600'} text-[10px] font-black uppercase tracking-[0.2em] mb-3`}>정회원</div>
              <h2 className={`text-4xl font-black ${textPrimary} mb-2 tracking-tight`}>{userInfo.name || '사용자'} 님</h2>
              <p className={`${textSecondary} font-bold tracking-wider text-sm`}>{userInfo.email || '이메일 정보 없음'}</p>
            </div>
          </div>

          {/* 구독 플랫폼 관리 */}
          <div className={`${cardClass} rounded-[3rem] p-12 border`}>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className={`text-2xl font-black ${textPrimary} tracking-tight`}>OTT 구독 관리</h3>
                <p className={`text-sm ${textSecondary} font-bold mt-1`}>이용 중인 서비스를 선택하여 검색 결과를 최적화하세요.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-8 justify-center md:justify-start">
              {OTT_LIST.map((ott) => {
                const isSubscribed = mySubscriptions.includes(ott.id);
                return (
                    <button
                        key={ott.id}
                        onClick={() => toggleSubscription(ott.id)}
                        title={ott.name}
                        className={`flex items-center justify-center relative p-3 rounded-[2.2rem] transition-all duration-700 transform hover:scale-110 shadow-2xl ${isSubscribed ? `border-transparent` : isDarkMode ? 'bg-white/5 border border-white/10 hover:border-white/30' : 'bg-slate-50 border border-slate-200 hover:border-slate-300'}`}
                        style={{ width: '100px', height: '100px', ...(isSubscribed ? { background: ott.gradient, boxShadow: `0 20px 40px -10px ${ott.shadowColor}` } : {}) }}
                    >
                      <img src={OTT_LOGOS[ott.name]} alt={ott.name} className={`w-full h-full object-contain p-2 ${isDarkMode ? 'filter brightness-110' : ''}`} style={isSubscribed ? filterWhite : {}} />
                      {isSubscribed && (
                          <div className={`absolute -top-2 -right-2 bg-green-500 text-white rounded-2xl p-1.5 shadow-[0_0_15px_rgba(34,197,94,0.5)] border-2 ${isDarkMode ? 'border-[#020617]' : 'border-white'} animate-in zoom-in-50`}>
                            <CheckCircle2 size={16} />
                          </div>
                      )}
                    </button>
                );
              })}
            </div>
          </div>

          {/* 찜 및 기록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className={`${cardClass} p-10 rounded-[3rem] border`}>
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl ${isDarkMode ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-100'} flex items-center justify-center text-pink-500`}>
                  <Heart size={24} className={isDarkMode ? "fill-pink-500/20" : ""} />
                </div>
                <span className={`text-xl font-black ${textPrimary} tracking-tight`}>찜한 콘텐츠 ({wishlist.length})</span>
              </div>
              {wishlist.length > 0 ? (
                  <div className="space-y-5 max-h-[450px] overflow-y-auto pr-4">
                    {wishlist.map((item) => (
                        <div key={item.id} className={`flex items-center gap-6 group cursor-pointer p-3 rounded-[1.5rem] ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-all`} onClick={() => navigate(`/search?q=${encodeURIComponent(item.title)}`)}>
                          <img src={item.posterUrl || 'https://via.placeholder.com/100x150?text=No+Image'} className={`w-16 h-24 object-cover rounded-2xl shadow-2xl border ${isDarkMode ? 'border-white/5' : 'border-slate-200'} group-hover:scale-105 transition-transform`} alt="poster" />
                          <div className="flex flex-col">
                            <span className={`font-black ${textPrimary} text-lg line-clamp-1 group-hover:text-indigo-500 transition-colors tracking-tight`}>{item.title}</span>
                            <span className={`text-xs ${textSecondary} font-bold mt-2 uppercase tracking-widest`}>{item.releaseDate?.split('-')[0]} <span className="mx-2 opacity-30">•</span> {item.mediaType}</span>
                          </div>
                        </div>
                    ))}
                  </div>
              ) : (
                  <div className={`text-center py-24 ${isDarkMode ? 'bg-white/20' : 'bg-slate-50'} rounded-[2.5rem] border border-dashed ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <p className={`${textSecondary} font-black text-sm tracking-widest`}>저장된 콘텐츠가 없습니다</p>
                  </div>
              )}
            </div>

            <div className={`${cardClass} p-10 rounded-[3rem] border`}>
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-blue-50 border-blue-100'} flex items-center justify-center text-indigo-400`}>
                  <PlayCircle size={24} />
                </div>
                <span className={`text-xl font-black ${textPrimary} tracking-tight`}>최근 시청 기록</span>
              </div>
              {recentHistory.length > 0 ? (
                  <div className="space-y-5">
                    {recentHistory.map((item) => (
                        <div key={item.id} className={`flex items-center justify-between group cursor-pointer p-3 rounded-[1.5rem] ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-all`} onClick={() => navigate(item.subTitle ? '/tv' : '/movies')}>
                          <div className="flex items-center gap-6">
                            <img src={item.posterUrl || 'https://via.placeholder.com/100x150?text=No+Image'} className={`w-16 h-24 object-cover rounded-2xl shadow-2xl border ${isDarkMode ? 'border-white/5' : 'border-slate-200'} group-hover:scale-105 transition-transform`} alt="poster" />
                            <div className="flex flex-col">
                              <span className={`font-black ${textPrimary} text-lg line-clamp-1 group-hover:text-indigo-400 transition-colors tracking-tight`}>{item.title}</span>
                              <span className={`text-xs ${textSecondary} font-bold mt-2 uppercase tracking-widest`}>
                                {item.subTitle || '영화'} <span className="mx-2 opacity-30">|</span> <span className="text-indigo-400">{item.progress}% 시청 중</span>
                              </span>
                            </div>
                          </div>
                          <Clock size={20} className={`${isDarkMode ? 'text-slate-700' : 'text-slate-300'} group-hover:text-indigo-400 transition-colors shrink-0`} />
                        </div>
                    ))}
                  </div>
              ) : (
                  <div className={`text-center py-24 ${isDarkMode ? 'bg-white/20' : 'bg-slate-50'} rounded-[2.5rem] border border-dashed ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <p className={`${textSecondary} font-black text-sm tracking-widest`}>시청 기록이 없습니다</p>
                  </div>
              )}
            </div>
          </div>

          <button onClick={handleLogout} className={`flex items-center gap-4 px-10 py-5 ${isDarkMode ? 'bg-white/5 text-slate-400 border-white/10 shadow-2xl' : 'bg-red-50 text-red-600 border-red-100 shadow-md'} rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all active:scale-95 border group`}>
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 로그아웃 하기
          </button>
        </div>
      </div>
  );
};

export default MyPage;
