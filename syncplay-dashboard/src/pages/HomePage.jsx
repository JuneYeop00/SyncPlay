import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, ChevronRight, Heart, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkeletonCard from '../components/SkeletonCard';

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
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600' },
  { id: 'tving', name: 'TVING', color: 'bg-red-500' },
  { id: 'disneyplus', name: 'Disney+', color: 'bg-blue-700' },
  { id: 'coupangplay', name: 'Coupang Play', color: 'bg-sky-500' },
  { id: 'wavve', name: 'Wavve', color: 'bg-blue-500' },
];

const HomePage = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardClass = isDarkMode 
    ? "bg-white/5 backdrop-blur-3xl border-white/10 shadow-2xl hover:bg-white/10" 
    : "bg-white/70 backdrop-blur-xl border-slate-200 shadow-lg hover:bg-white/90";
  
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const textMuted = isDarkMode ? "text-slate-500" : "text-slate-400";

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      setUserInfo({ name: savedUser.name, email: savedUser.email });
      fetchAllData(savedUser.email);
    }
  }, []);

  const fetchAllData = async (email) => {
    setLoading(true);
    try {
      const subRes = await fetch(`http://localhost:8080/api/users/subscriptions?email=${encodeURIComponent(email)}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        setMySubscriptions(subData.subscriptions || []);
      }

      const wishRes = await fetch(`http://localhost:8080/api/wishlist?email=${encodeURIComponent(email)}`);
      if (wishRes.ok) {
        const wishData = await wishRes.json();
        setWishlist(wishData.slice(0, 4));
      }

      const historyRes = await fetch('http://localhost:8080/api/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const top3History = historyData.reverse().slice(0, 3);
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
            } catch (e) { return item; }
          })
        );
        setRecentHistory(enrichedHistory);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const activeServices = OTT_LIST.filter(ott => mySubscriptions.includes(ott.id));

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000">
      <section className="relative group overflow-hidden rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-700 hover:shadow-indigo-500/10">
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-indigo-900/40 via-blue-900/40 to-indigo-950/40' : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700'} backdrop-blur-xl group-hover:scale-105 transition-transform duration-700`} />
        <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/10' : 'border-white/20'} rounded-[3rem]`} />
        <div className="relative z-10 p-12 lg:p-20 text-white flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="max-w-xl">
            <div className={`inline-block px-4 py-1.5 rounded-full ${isDarkMode ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-white/20 border-white/30 text-white'} text-xs font-black uppercase tracking-widest mb-6`}>다시 만나서 반가워요</div>
            <h2 className="text-6xl font-black mb-6 tracking-tight leading-tight">안녕하세요, <span className={`${isDarkMode ? 'bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent' : 'text-blue-100'}`}>{userInfo.name}</span>님!</h2>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-blue-50'} text-xl font-medium leading-relaxed max-w-md`}>즐겨 찾는 콘텐츠들이 준비되어 있습니다. <br />나만의 통합 OTT 라이브러리를 탐색해 보세요.</p>
            <button onClick={() => navigate('/search')} className={`mt-12 ${isDarkMode ? 'bg-white text-[#020617]' : 'bg-white text-indigo-600'} px-10 py-5 rounded-[2rem] font-black hover:scale-105 transition-all flex items-center space-x-3 shadow-2xl active:scale-95 group/btn`}>
              <TrendingUp size={22} className="group-hover/btn:translate-y-[-2px] transition-transform" />
              <span>전체 콘텐츠 통합 검색</span>
            </button>
          </div>
          <div className={`hidden md:flex w-56 h-56 ${isDarkMode ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white/20 border-white/30 shadow-xl'} backdrop-blur-3xl rounded-[2.5rem] items-center justify-center relative group-hover:rotate-6 transition-transform duration-700`}>
            <Play size={100} className={`${isDarkMode ? 'fill-indigo-500/80 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'fill-white drop-shadow-lg'}`} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="flex justify-between items-end px-4">
            <div>
              <h3 className={`text-2xl font-black ${textPrimary}`}>내 서비스</h3>
              <p className={`text-sm ${textMuted} font-bold mt-1`}>연동된 OTT 플랫폼</p>
            </div>
            <button onClick={() => navigate('/mypage')} className={`text-xs font-black px-4 py-2 rounded-xl border transition-colors ${isDarkMode ? 'text-slate-300 bg-white/5 border-white/10 hover:text-white' : 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}>관리하기</button>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {loading ? [...Array(4)].map((_, i) => <div key={i} className={`${cardClass} p-8 rounded-[2.5rem] border animate-pulse h-32`} />) : 
             activeServices.length > 0 ? activeServices.map((ott) => (
                <div key={ott.id} className={`${cardClass} p-8 rounded-[2.5rem] border transition-all group relative`}>
                  <img src={OTT_LOGOS[ott.name]} alt={ott.name} className={`h-10 mb-6 object-contain ${isDarkMode ? 'filter brightness-110 drop-shadow-lg' : ''}`} />
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
                    <span className={`text-[10px] font-black ${textMuted} uppercase tracking-widest`}>연동됨</span>
                  </div>
                </div>
              )) : (
              <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} col-span-2 backdrop-blur-md border-2 border-dashed rounded-[3rem] p-12 text-center group cursor-pointer hover:border-indigo-500/50 transition-colors`} onClick={() => navigate('/mypage')}>
                <p className={`${textMuted} font-black text-sm mb-6`}>연동된 서비스가 없습니다</p>
                <div className="text-indigo-500 font-black text-xs">서비스 추가하기 +</div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end px-4">
            <div>
              <h3 className={`text-2xl font-black ${textPrimary}`}>최근 시청 중</h3>
              <p className={`text-sm ${textMuted} font-bold mt-1`}>이어서 감상해 보세요</p>
            </div>
            <button onClick={() => navigate('/movies')} className={`text-xs font-black px-4 py-2 rounded-xl border transition-colors flex items-center ${isDarkMode ? 'text-slate-300 bg-white/5 border-white/10 hover:text-white' : 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}>전체 보기 <ChevronRight size={14} className="ml-1" /></button>
          </div>
          <div className="space-y-5">
            {loading ? [...Array(3)].map((_, i) => (
              <div key={i} className={`${cardClass} p-6 rounded-[2.5rem] border animate-pulse flex items-center gap-8 h-32`}>
                <div className={`w-16 h-24 rounded-2xl ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                <div className="flex-1 space-y-4">
                  <div className={`h-6 w-1/2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                  <div className={`h-3 w-1/4 rounded-md ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                </div>
              </div>
            )) : recentHistory.length > 0 ? recentHistory.map((watch) => (
                <div key={watch.id} className={`${cardClass} p-6 rounded-[2.5rem] border transition-all group cursor-pointer flex items-center justify-between`} onClick={() => navigate(watch.subTitle ? '/tv' : '/movies')}>
                  <div className="flex items-center space-x-8">
                    <div className="relative shrink-0">
                      <img src={watch.posterUrl || 'https://via.placeholder.com/100x150?text=No+Image'} alt={watch.title} className={`w-20 h-28 object-cover rounded-2xl shadow-2xl border ${isDarkMode ? 'border-white/10' : 'border-slate-200'} group-hover:scale-105 transition-transform duration-500`} />
                      <div className="absolute inset-0 bg-indigo-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Play size={24} className="text-white fill-white shadow-2xl" /></div>
                    </div>
                    <div>
                      <h4 className={`font-black ${textPrimary} text-xl line-clamp-1 mb-2 tracking-tight group-hover:text-indigo-500 transition-colors`}>{watch.title}</h4>
                      <p className={`text-sm ${textSecondary} font-bold`}>{watch.subTitle || '영화'} <span className={`mx-3 opacity-20 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>|</span> <span className="text-indigo-500">{watch.progress}% 시청 중</span></p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right w-40 px-6">
                    <div className={`w-full ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} h-2.5 rounded-full overflow-hidden border ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{ width: `${watch.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              )) : (
              <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} py-24 text-center backdrop-blur-md rounded-[3rem] border border-dashed`}>
                <Play size={48} className={`${isDarkMode ? 'text-slate-700' : 'text-slate-300'} mx-auto mb-6 opacity-30`} />
                <p className={`${textMuted} font-black text-sm uppercase tracking-widest`}>시청 활동이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-10">
        <div className="flex justify-between items-end px-4">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${isDarkMode ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-100'} border flex items-center justify-center text-pink-500`}>
              <Heart size={28} className={isDarkMode ? "fill-pink-500/20" : ""} />
            </div>
            <div>
              <h3 className={`text-2xl font-black ${textPrimary} tracking-tight`}>찜한 콘텐츠</h3>
              <p className={`text-sm ${textMuted} font-bold mt-1`}>나중에 볼 작품들</p>
            </div>
          </div>
          <button onClick={() => navigate('/mypage')} className={`text-xs font-black px-4 py-2 rounded-xl border transition-colors ${isDarkMode ? 'text-slate-300 bg-white/5 border-white/10 hover:text-white' : 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}>전체 보기</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {loading ? [...Array(4)].map((_, i) => <SkeletonCard key={i} isDarkMode={isDarkMode} />) : 
           wishlist.length > 0 ? wishlist.map((item) => (
              <div key={item.id} className="group cursor-pointer" onClick={() => navigate(`/search?q=${encodeURIComponent(item.title)}`)}>
                <div className={`relative aspect-[2/3] rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 hover:-translate-y-3 ${isDarkMode ? 'shadow-black/40 hover:shadow-indigo-500/20' : 'shadow-slate-200 hover:shadow-indigo-200'}`}>
                  <img src={item.posterUrl || 'https://via.placeholder.com/300x450?text=No+Image'} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-[#020617]' : 'from-slate-900/80'} via-transparent to-transparent opacity-60`} />
                  <div className={`absolute top-6 right-6 ${isDarkMode ? 'bg-black/40' : 'bg-white/80'} backdrop-blur-xl p-4 rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-slate-200'} shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0`}><Heart size={24} fill="#f472b6" className="text-pink-500" /></div>
                  <div className="absolute bottom-8 left-8 right-8">
                    <h4 className="font-black text-white text-xl line-clamp-1 mb-2 group-hover:text-indigo-300 transition-colors">{item.title}</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-200'} font-black uppercase tracking-widest`}>{item.releaseDate?.split('-')[0]} <span className="mx-2 opacity-30">•</span> {item.mediaType}</p>
                  </div>
                </div>
              </div>
            )) : (
            <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} col-span-full py-28 text-center backdrop-blur-md rounded-[4rem] border border-dashed`}>
              <Heart size={64} className={`${isDarkMode ? 'text-slate-800' : 'text-slate-300'} mx-auto mb-8 opacity-20`} />
              <p className={`${textMuted} font-black text-sm uppercase tracking-widest`}>찜한 목록이 비어 있습니다</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
