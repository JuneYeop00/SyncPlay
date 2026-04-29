import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Search, Clapperboard, Tv, Settings, UserCircle, Home } from 'lucide-react';

import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import TvShowsPage from './pages/TvShowsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';
import SettingsPage from './pages/Settings';
import SearchPage from './pages/SearchPage';

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 테마 상태 관리 (기본값 다크모드)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // 테마 상태를 실제 DOM 클래스에 반영
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 테마 변경 함수
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // 로그인, 회원가입, 랜딩 페이지는 사이드바를 보여주지 않습니다.
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';
  
  // 우측 패널 검색창 상태 (필터링 전용)
  const [searchTerm, setSearchTerm] = useState('');

  // 공통적인 아이콘 스타일
  const getIconClass = (path) => {
    const isActive = location.pathname === path;
    if (isDarkMode) {
      return `p-3 rounded-2xl transition-all duration-300 ${
        isActive 
          ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
          : 'text-slate-500 hover:text-white hover:bg-white/5'
      }`;
    } else {
      return `p-3 rounded-2xl transition-all duration-300 ${
        isActive 
          ? 'text-blue-600 bg-blue-50 shadow-lg shadow-blue-100/50' 
          : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'
      }`;
    }
  };

  // 테마별 배경색 설정
  const bgClass = isDarkMode 
    ? "bg-[#020617] text-slate-200" 
    : "bg-[#f8fafc] text-slate-800";

  return (
    <div className={`flex min-h-screen ${bgClass} font-sans relative overflow-hidden transition-colors duration-500`}>
      {/* 🌌 오로라 배경 오브제 (테마에 따라 색상 변경) */}
      <div className={`absolute top-[-20%] left-[-10%] w-[800px] h-[800px] ${isDarkMode ? 'bg-indigo-600/20' : 'bg-blue-200/40'} rounded-full blur-[160px] animate-pulse pointer-events-none`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] ${isDarkMode ? 'bg-emerald-600/10' : 'bg-indigo-100/50'} rounded-full blur-[140px] pointer-events-none`} />
      <div className={`absolute top-[30%] right-[10%] w-[500px] h-[500px] ${isDarkMode ? 'bg-purple-600/15' : 'bg-purple-100/40'} rounded-full blur-[130px] animate-pulse pointer-events-none`} />
      
      {/* 1. 사이드바 네비게이션 (Dark/Light Glassmorphism) - 고정됨 */}
      {!isAuthPage && (
        <div className={`w-24 ${isDarkMode ? 'bg-black/20' : 'bg-white/60'} backdrop-blur-3xl border-r ${isDarkMode ? 'border-white/5' : 'border-slate-200/50'} flex flex-col items-center py-12 h-screen sticky top-0 z-50 shadow-2xl shrink-0`}>
          <div className="flex flex-col items-center space-y-8 flex-1">
            {/* 홈 대시보드 */}
            <Link title="홈 대시보드" to="/home" className={getIconClass('/home')}>
              <Home size={26} />
            </Link>

            {/* 글로벌 검색 전용 메뉴 */}
            <Link title="전체 OTT 통합 검색" to="/search" className={getIconClass('/search')}>
              <Search size={26} strokeWidth={2.5} />
            </Link>
            
            <div className={`w-10 h-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

            <Link title="영화 기록" to="/movies" className={getIconClass('/movies')}>
              <Clapperboard size={26} />
            </Link>
            
            <Link title="TV 쇼 기록" to="/tv" className={getIconClass('/tv')}>
              <Tv size={26} />
            </Link>
            
            <Link title="마이페이지" to="/mypage" className={getIconClass('/mypage')}>
              <UserCircle size={26} />
            </Link>
          </div>

          <Link title="설정" to="/settings" className={getIconClass('/settings')}>
            <Settings size={26} />
          </Link>
        </div>
      )}

      {/* 2. 메인 영역 컨테이너 */}
      <div className="flex-1 flex overflow-hidden h-screen relative z-10">
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          {!isAuthPage && (
            <div className="flex justify-between items-center mb-12">
              <h1 className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight drop-shadow-sm`}>
                {location.pathname === '/home' ? '홈 대시보드' :
                 location.pathname === '/movies' ? '영화 기록' : 
                 location.pathname === '/tv' ? 'TV 쇼 기록' : 
                 location.pathname === '/mypage' ? '마이페이지' : 
                 location.pathname === '/search' ? '전체 OTT 통합 검색' : '설정'}
              </h1>
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<LoginPage isDarkMode={isDarkMode} />} />
            <Route path="/login" element={<LoginPage isDarkMode={isDarkMode} />} />
            <Route path="/signup" element={<SignupPage isDarkMode={isDarkMode} />} />
            
            <Route path="/home" element={<HomePage isDarkMode={isDarkMode} />} />
            <Route path="/movies" element={<MoviesPage searchTerm={searchTerm} isDarkMode={isDarkMode} />} />
            <Route path="/tv" element={<TvShowsPage searchTerm={searchTerm} isDarkMode={isDarkMode} />} />
            <Route path="/mypage" element={<MyPage isDarkMode={isDarkMode} />} />
            <Route path="/settings" element={<SettingsPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} /> 
            <Route path="/search" element={<SearchPage isDarkMode={isDarkMode} />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* 3. 우측 퀵 패널 - 고정됨 */}
        {!isAuthPage && location.pathname !== '/settings' && location.pathname !== '/mypage' && location.pathname !== '/search' && (
          <div className={`w-80 ${isDarkMode ? 'bg-black/10' : 'bg-white/30'} backdrop-blur-2xl border-l ${isDarkMode ? 'border-white/5' : 'border-slate-200/50'} p-8 hidden xl:block z-40 h-screen sticky top-0`}>
            <div className="flex items-center mb-12">
              {/* 'U' 아이콘 삭제됨, 검색창만 남김 */}
              <div className={`flex-1 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-slate-200'} backdrop-blur-md rounded-2xl px-5 py-3.5 flex items-center border focus-within:border-indigo-500 transition-all shadow-xl`}>
                <Search size={18} className="text-slate-500 mr-3" />
                <input 
                  type="text" 
                  placeholder="목록 필터링..." 
                  className={`bg-transparent text-sm outline-none w-full ${isDarkMode ? 'text-white' : 'text-slate-800'} placeholder:text-slate-500 font-medium`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;