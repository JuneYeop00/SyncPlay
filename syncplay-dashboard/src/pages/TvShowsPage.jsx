import React, { useState, useEffect } from 'react';
import { Tv } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import SkeletonCard from '../components/SkeletonCard';

const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const TvShowsPage = ({ searchTerm = '', isDarkMode }) => {
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 테마별 색상 설정
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-500" : "text-slate-400";

  const fetchMovieDetail = async (title) => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(title)}&include_adult=false&language=ko-KR&page=1`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`
          }
        }
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const item = data.results.find(res => res.media_type === 'movie' || res.media_type === 'tv') || data.results[0];
        return {
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          overview: item.overview,
          rating: item.vote_average,
          mediaType: item.media_type
        };
      }
    } catch (error) { console.error(error); }
    return null;
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/history');
      if (!response.ok) throw new Error('서버 연결 실패');
      const historyData = await response.json();
      const enrichedShows = await Promise.all(
        historyData.map(async (show) => {
          const detail = await fetchMovieDetail(show.title);
          let calculatedType = detail?.mediaType || (show.subTitle ? 'tv' : 'movie');
          return {
            ...show,
            posterUrl: detail?.posterUrl || null,
            overview: detail?.overview || '상세 정보가 없습니다.',
            rating: detail?.rating || 0,
            mediaType: calculatedType
          };
        })
      );
      const tvOnly = enrichedShows.filter(item => item.mediaType === 'tv');
      tvOnly.sort((a, b) => b.id - a.id);
      setTvShows(tvOnly);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`'${title}' 시청 기록을 삭제하시겠습니까?`)) return;
    try {
      const response = await fetch(`http://localhost:8080/api/history/${id}`, { method: 'DELETE' });
      if (response.ok) setTvShows(tvShows.filter((show) => show.id !== id));
    } catch (error) { console.error(error); }
  };

  const filteredShows = tvShows.filter((show) =>
    show.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="w-full p-4 animate-in fade-in duration-1000">
      <div className="flex items-center gap-4 mb-10 px-2">
        <div className="w-1.5 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
        <h2 className={`text-3xl font-black ${textPrimary} tracking-tight uppercase`}>TV 시리즈 보관함</h2>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {[...Array(10)].map((_, i) => (
            <SkeletonCard key={i} isDarkMode={isDarkMode} />
          ))}
        </div>
      ) : filteredShows.length === 0 ? (
        <div className={`p-32 text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} backdrop-blur-3xl rounded-[4rem] border-2 border-dashed flex flex-col items-center gap-6`}>
          <Tv size={64} className={`${isDarkMode ? 'text-slate-700' : 'text-slate-300'} opacity-20`} />
          <p className={`${textMuted} font-black text-lg`}>
            보관함에 저장된 TV 시리즈가 없습니다
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {filteredShows.map((show) => (
            <MediaCard 
              key={show.id} 
              id={show.id}
              title={show.subTitle ? `${show.title} : ${show.subTitle}` : show.title} 
              rawTitle={show.title}
              progress={show.progress} 
              posterUrl={show.posterUrl}
              overview={show.overview} 
              rating={show.rating}
              url={show.url}
              platform={show.platform}
              onDelete={handleDelete}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default TvShowsPage;
