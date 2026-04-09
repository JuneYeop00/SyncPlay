import React, { useState, useEffect, useCallback } from 'react';
import { Film } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import SkeletonCard from '../components/SkeletonCard';

const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_BASE_URL = 'http://localhost:8080';

const MoviesPage = ({ searchTerm = '', isDarkMode }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userEmail = currentUser?.email || '';

  // 테마별 색상 설정
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-500" : "text-slate-400";

  const fetchProviderAvailability = useCallback(async (title) => {
    if (!userEmail) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/api/providers/availability?title=${encodeURIComponent(title)}&email=${encodeURIComponent(userEmail)}&region=KR`);
      if (response.ok) {
        const data = await response.json();
        return data.providers || [];
      }
    } catch (error) {
      console.error('플랫폼 정보 로드 실패:', error);
    }
    return [];
  }, [userEmail]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`);
      if (!response.ok) throw new Error('서버 연결 실패');
      const historyData = await response.json();

      const enrichedMovies = await Promise.all(
        historyData.map(async (movie) => {
          try {
            const tmdbResp = await fetch(
              `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(movie.title)}&include_adult=false&language=ko-KR&page=1`,
              { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } }
            );
            const tmdbData = await tmdbResp.json();
            const detail = tmdbData.results?.find(res => res.media_type === 'movie' || res.media_type === 'tv') || tmdbData.results?.[0] || {};
            const providerStatuses = await fetchProviderAvailability(movie.title);

            let calculatedType = detail?.media_type || (movie.subTitle ? 'tv' : 'movie');

            return {
              ...movie,
              posterUrl: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
              overview: detail.overview || '상세 정보가 없습니다.',
              rating: detail.vote_average || 0,
              mediaType: calculatedType,
              providerStatuses
            };
          } catch (e) {
            return { ...movie, mediaType: movie.subTitle ? 'tv' : 'movie' };
          }
        })
      );

      const moviesOnly = enrichedMovies.filter(item => item.mediaType === 'movie');
      moviesOnly.sort((a, b) => b.id - a.id);
      setMovies(moviesOnly);
    } catch (error) {
      console.error("데이터 로드 에러:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchProviderAvailability]);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`'${title}' 시청 기록을 삭제하시겠습니까?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${id}`, { method: 'DELETE' });
      if (response.ok) setMovies(movies.filter((movie) => movie.id !== id));
    } catch (error) {
      console.error("삭제 에러:", error);
    }
  };

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="w-full p-4 animate-in fade-in duration-1000">
      <div className="flex items-center gap-4 mb-10 px-2">
        <div className="w-1.5 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
        <h2 className={`text-3xl font-black ${textPrimary} tracking-tight uppercase`}>영화 보관함</h2>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {[...Array(10)].map((_, i) => (
            <SkeletonCard key={i} isDarkMode={isDarkMode} />
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className={`p-32 text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} backdrop-blur-3xl rounded-[4rem] border-2 border-dashed flex flex-col items-center gap-6`}>
          <Film size={64} className={`${isDarkMode ? 'text-slate-700' : 'text-slate-300'} opacity-20`} />
          <p className={`${textMuted} font-black text-lg`}>
            보관함에 저장된 영화가 없습니다
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {filteredMovies.map((movie) => (
            <MediaCard 
              key={movie.id} 
              id={movie.id}
              title={movie.title} 
              rawTitle={movie.title}
              progress={movie.progress || 0} 
              posterUrl={movie.posterUrl}
              overview={movie.overview} 
              rating={movie.rating}
              url={movie.url}
              platform={movie.platform}
              providerStatuses={movie.providerStatuses}
              onDelete={handleDelete}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MoviesPage;
