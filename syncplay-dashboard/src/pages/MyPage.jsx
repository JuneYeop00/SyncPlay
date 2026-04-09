import React, { useState, useEffect, useCallback } from 'react';
import { User, LogOut, Heart, PlayCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 무비 페이지에서 사용하던 TMDB API 연동 정보 추가
const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 로컬 경로로 맞춘 로고 데이터 유지
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

const MyPage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [recentHistory, setRecentHistory] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      setUserInfo({ name: savedUser.name, email: savedUser.email });
      fetchSubscriptions(savedUser.email);
      fetchWishlist(savedUser.email);
    }

    // TMDB API 로직이 통합된 새로운 fetchHistory 함수
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/history');
        if (response.ok) {
          const data = await response.json();
          // 무비 페이지와 다르게 마이페이지는 3개만 필요하므로 먼저 자릅니다. (통신 낭비 방지)
          const top3History = data.reverse().slice(0, 3);

          // 3개의 시청 기록에 대해 TMDB에서 포스터를 검색합니다.
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
                    // TMDB에서 찾은 포스터 주소를 연결합니다.
                    posterUrl: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
                    mediaType: detail.media_type || (item.subTitle ? 'tv' : 'movie')
                  };
                } catch (e) {
                  console.error("TMDB 데이터 로드 에러:", e);
                  return item; // 에러 나면 기존 데이터라도 반환
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
    if (!userInfo.email) {
      alert("이메일 정보가 없어 구독 상태를 저장할 수 없습니다.");
      return;
    }

    let updatedSubs;
    if (mySubscriptions.includes(ottId)) {
      updatedSubs = mySubscriptions.filter(id => id !== ottId);
    } else {
      updatedSubs = [...mySubscriptions, ottId];
    }

    setMySubscriptions(updatedSubs);

    try {
      await fetch(`http://localhost:8080/api/users/subscriptions?email=${encodeURIComponent(userInfo.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions: updatedSubs })
      });
    } catch (error) {
      console.error("구독 정보 업데이트 실패:", error);
    }
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
      <div className="w-full">
        <div className="max-w-4xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex items-center gap-6">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <User size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{userInfo.name || 'gemini il'} 님</h2>
              <p className="text-gray-500 font-medium">이메일: {userInfo.email || '정보 없음'}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">내 구독 플랫폼 관리</h3>
            <p className="text-sm text-gray-500 mb-6">현재 구독 중인 OTT를 선택해두시면, 검색 시 시청 가능한 플랫폼을 빠르게 안내해 드립니다.</p>

            <div className="flex flex-wrap gap-5 justify-center">
              {OTT_LIST.map((ott) => {
                const isSubscribed = mySubscriptions.includes(ott.id);
                const logoUrl = OTT_LOGOS[ott.name] || "https://via.placeholder.com/32?text=OTT";

                return (
                    <button
                        key={ott.id}
                        onClick={() => toggleSubscription(ott.id)}
                        title={ott.name}
                        className={`flex items-center justify-center relative p-1 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-inner
                    ${isSubscribed ? `border-transparent shadow-lg` : 'bg-white border-2 border-gray-100 hover:border-gray-200'}`}
                        style={{
                          width: '80px',
                          height: '80px',
                          ...(isSubscribed ? {
                            background: ott.gradient,
                            boxShadow: `0 10px 15px -3px ${ott.shadowColor}, 0 4px 6px -2px ${ott.shadowColor}`
                          } : {})
                        }}
                    >
                      <img
                          src={logoUrl}
                          alt={`${ott.name} 로고`}
                          className="w-full h-full object-contain p-1.5"
                          style={isSubscribed ? filterWhite : {}}
                      />
                      {isSubscribed && (
                          <CheckCircle2
                              size={18}
                              className="absolute -bottom-1 -right-1 text-white bg-green-500 rounded-full p-0.5 shadow-sm border-2 border-white"
                          />
                      )}
                    </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-pink-500">
                <Heart size={20} className="fill-pink-500" />
                <span className="font-bold">찜한 콘텐츠 ({wishlist.length})</span>
              </div>
              {wishlist.length > 0 ? (
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {wishlist.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/search?q=${encodeURIComponent(item.title)}`)}>
                          <img src={item.posterUrl || 'https://via.placeholder.com/100x150?text=No+Image'} className="w-12 h-16 object-cover rounded-lg shadow-sm" alt="poster" />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-pink-600 transition-colors">{item.title}</span>
                            <span className="text-xs text-gray-400 mt-1">{item.releaseDate?.split('-')[0] || '미상'} · {item.mediaType?.toUpperCase()}</span>
                          </div>
                        </div>
                    ))}
                  </div>
              ) : (
                  <p className="text-gray-400 text-sm text-center py-10">찜한 영화가 없습니다.</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-blue-500">
                <PlayCircle size={20} />
                <span className="font-bold">최근 시청 기록</span>
              </div>
              {recentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {recentHistory.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group cursor-pointer" onClick={() => navigate(item.subTitle ? '/tv' : '/movies')}>
                          <div className="flex items-center gap-4">
                            {/* 포스터 이미지가 연결되어 잘 나오게 됩니다. */}
                            <img src={item.posterUrl || 'https://via.placeholder.com/100x150?text=No+Image'} className="w-12 h-16 object-cover rounded-lg shadow-sm" alt="poster" />
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</span>
                              <span className="text-xs text-gray-500 mt-1">
                          {item.subTitle || '영화'} · <span className="text-blue-600 font-medium">{item.progress}%</span> 시청
                        </span>
                            </div>
                          </div>
                          <Clock size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-4 shrink-0" />
                        </div>
                    ))}
                  </div>
              ) : (
                  <p className="text-gray-400 text-sm">시청 중인 콘텐츠가 없습니다.</p>
              )}
            </div>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-95 shadow-sm">
            <LogOut size={20} /> 로그아웃
          </button>
        </div>
      </div>
  );
};

export default MyPage;