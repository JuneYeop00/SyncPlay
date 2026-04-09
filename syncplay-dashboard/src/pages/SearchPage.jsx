import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle2, AlertCircle, X, Star, Heart, Play } from 'lucide-react';

const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_BASE_URL = 'http://localhost:8080';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [myWishlist, setMyWishlist] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userEmail = currentUser?.email || '';

  useEffect(() => {
    if (!userEmail) return;
    fetch(`${API_BASE_URL}/api/wishlist?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => setMyWishlist(data))
      .catch(err => console.error("찜 목록 불러오기 실패:", err));
  }, [userEmail]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const tmdbRes = await fetch(`${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=ko-KR&page=1`, {
          headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` }
        });
        const tmdbData = await tmdbRes.json();
        
        const enrichedResults = await Promise.all(
          (tmdbData.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv').map(async (item) => {
            const title = item.title || item.name;
            let providerStatuses = [];
            
            try {
              const provRes = await fetch(`${API_BASE_URL}/api/providers/availability?title=${encodeURIComponent(title)}&email=${encodeURIComponent(userEmail)}&region=KR`);
              if (provRes.ok) {
                const provData = await provRes.json();
                providerStatuses = provData.providers || [];
              }
            } catch (err) { console.error("Provider fetch error:", err); }

            return {
              id: item.id,
              title: title,
              mediaType: item.media_type,
              posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              overview: item.overview || '상세 정보가 없습니다.',
              releaseDate: item.release_date || item.first_air_date,
              rating: item.vote_average || 0,
              providerStatuses
            };
          })
        );
        setResults(enrichedResults);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchSearchResults();
  }, [query, userEmail]);

  const toggleWishlist = async (item) => {
    if (!userEmail) return alert("로그인이 필요합니다.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist?email=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        const updated = await res.json();
        setMyWishlist(updated);
      }
    } catch (err) { console.error(err); }
  };

  const isWished = (id) => myWishlist.some(w => w.id === id);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setSelectedItem(null);
    }
  };

  const getSubscribed = (providers) => providers.filter(p => p.status === 'SUBSCRIBED');
  const getRequired = (providers) => providers.filter(p => p.status === 'PURCHASE_REQUIRED');

  // 디즈니와 쿠팡을 메인 홈으로 원상 복구한 접속 링크 생성 함수
  const handlePlayDirectly = (item) => {
    const subscribed = getSubscribed(item.providerStatuses);
    if (subscribed.length === 0) return;

    const platformName = subscribed[0].providerName.toLowerCase().replace(/\s/g, '');
    const encodedTitle = encodeURIComponent(item.title);
    
    // 기본 검색용 구글 주소
    let targetUrl = `https://www.google.com/search?q=${encodedTitle}+보러가기`;

    if (platformName.includes('netflix')) {
      targetUrl = `https://www.netflix.com/search?q=${encodedTitle}`;
    } else if (platformName.includes('tving')) {
      targetUrl = `https://www.tving.com/search?keyword=${encodedTitle}`;
    } else if (platformName.includes('wavve')) {
      targetUrl = `https://www.wavve.com/search?searchWord=${encodedTitle}`;
    } else if (platformName.includes('coupang')) {
      // 쿠팡플레이 에러 방지 -> 기본 접속 주소로 원상 복구
      targetUrl = `https://www.coupangplay.com`;
    } else if (platformName.includes('disney')) {
      // 디즈니플러스 에러 방지 -> 기본 접속 주소로 원상 복구
      targetUrl = `https://www.disneyplus.com`; 
    } else if (platformName.includes('watcha')) {
      targetUrl = `https://watcha.com/search?query=${encodedTitle}`;
    }

    window.open(targetUrl, '_blank');
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 relative">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate(-1)} className="p-4 bg-white rounded-2xl shadow-sm hover:bg-gray-50 text-gray-600 transition-colors border border-gray-100 shrink-0">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 bg-white rounded-2xl px-6 py-4 flex items-center border border-gray-200 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
          <Search size={24} className="text-blue-500 mr-4 shrink-0" />
          <input type="text" className="bg-transparent text-lg outline-none w-full font-medium text-gray-900 placeholder:text-gray-400" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleSearch} placeholder="영화나 TV 프로그램 제목을 검색 후 Enter를 누르세요..." autoFocus />
        </div>
      </div>

      {query && !loading && (
        <h2 className="text-xl font-bold text-gray-800 mb-6 px-2">
          "<span className="text-blue-600">{query}</span>" 검색 결과
        </h2>
      )}

      {loading ? <div className="flex justify-center py-20 text-gray-400 font-bold items-center gap-3"><Search className="animate-bounce" /> 전 세계 OTT를 검색 중입니다...</div> : 
      query && results.length === 0 ? <div className="p-20 text-center border-2 border-dashed rounded-3xl text-gray-400 bg-white">해당 키워드에 대한 작품을 찾을 수 없습니다.</div> :
      !query ? <div className="p-20 text-center border-2 border-dashed rounded-3xl text-gray-400 bg-white">검색창에 제목을 입력해 주세요.</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {results.map((item) => {
            const subscribedProviders = getSubscribed(item.providerStatuses);
            const requiredProviders = getRequired(item.providerStatuses);

            return (
              <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md cursor-pointer hover:-translate-y-1 transition-all duration-200">
                 <div className="flex h-48 border-b border-gray-50">
                    <div className="w-32 bg-slate-100 flex-shrink-0">
                      {item.posterUrl ? <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>}
                    </div>
                    <div className="p-5 flex flex-col justify-between w-full">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                          {item.mediaType === 'movie' ? 'MOVIE' : 'TV SHOW'}
                        </span>
                        <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-gray-500">{item.releaseDate?.substring(0, 4) || '미상'}</p>
                      </div>
                      {isWished(item.id) && <Heart size={16} className="text-pink-500 fill-pink-500 ml-auto" />}
                    </div>
                 </div>
                 
                 {/* 사라졌던 OTT 상태 뱃지 완벽 복구 */}
                 <div className="p-4 bg-slate-50 flex-1 flex flex-col justify-center">
                   {item.providerStatuses.length === 0 ? (
                     <p className="text-xs text-gray-400 text-center">현재 한국 스트리밍 서비스 정보가 없습니다.</p>
                   ) : (
                     <div className="space-y-3">
                       {subscribedProviders.length > 0 && (
                         <div className="flex items-center gap-2">
                           <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                           <div className="flex flex-wrap gap-1.5">
                             {subscribedProviders.map(p => (
                               <span key={p.providerId} className="text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                                 {p.providerName}
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                       
                       {requiredProviders.length > 0 && (
                         <div className="flex items-center gap-2">
                           <AlertCircle size={16} className="text-gray-400 shrink-0" />
                           <div className="flex flex-wrap gap-1.5">
                             {requiredProviders.map(p => (
                               <span key={p.providerId} className="text-[11px] font-medium bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-md">
                                 {p.providerName}
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedItem && (
        <div onClick={() => setSelectedItem(null)} className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            <div className="relative h-72 sm:h-96 bg-black flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0">
                {selectedItem.posterUrl && <img src={selectedItem.posterUrl} className="w-full h-full object-cover blur-2xl opacity-40 scale-110" alt="bg" />}
              </div>
              {selectedItem.posterUrl ? <img src={selectedItem.posterUrl} className="relative h-[90%] object-contain rounded-lg shadow-2xl border border-white/10" alt="poster" /> : <span className="relative text-white/50 font-bold text-xl">포스터 이미지 없음</span>}
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 w-10 h-10 flex-shrink-0 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all z-50 border border-white/20"><X size={20} strokeWidth={3} /></button>
            </div>
            
            <div className="p-8 bg-white relative">
              <div className="flex justify-between items-start mb-6 gap-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md mb-3 inline-block">
                    {selectedItem.mediaType === 'movie' ? 'MOVIE' : 'TV SHOW'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight leading-tight">{selectedItem.title}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-gray-500">출시: {selectedItem.releaseDate || '미상'}</span>
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                      <Star size={16} className="fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-black text-yellow-700">{selectedItem.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-slate-600 leading-relaxed text-[15px] bg-slate-50 p-5 rounded-2xl border border-slate-100 max-h-32 overflow-y-auto">{selectedItem.overview}</p>
              </div>

              <div className="flex gap-3">
                {getSubscribed(selectedItem.providerStatuses).length > 0 ? (
                  <button onClick={() => handlePlayDirectly(selectedItem)} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    <Play size={20} className="fill-white" /> {getSubscribed(selectedItem.providerStatuses)[0].providerName} 접속하기
                  </button>
                ) : (
                  <button disabled className="flex-1 bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <AlertCircle size={20} /> 추가 결제 필요 / 제공되지 않음
                  </button>
                )}
                
                <button onClick={() => toggleWishlist(selectedItem)} className={`px-8 py-4 font-bold rounded-2xl flex items-center gap-2 border transition-all ${isWished(selectedItem.id) ? 'bg-pink-500 text-white border-transparent' : 'bg-white text-pink-500 border-pink-100 hover:bg-pink-50'}`}>
                  <Heart size={20} className={isWished(selectedItem.id) ? "fill-white" : ""} /> {isWished(selectedItem.id) ? '찜 완료' : '찜하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;