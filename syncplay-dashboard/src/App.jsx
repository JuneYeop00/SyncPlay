import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Search, Clapperboard, Tv, Settings, UserCircle } from 'lucide-react';

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
  // 로그인, 회원가입, 랜딩 페이지는 사이드바를 보여주지 않습니다.
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';
  
  // 우측 패널 검색창 상태 (필터링 전용)
  const [searchTerm, setSearchTerm] = useState('');

  // 공통적인 아이콘 스타일
  const getIconClass = (path) => {
    const isActive = location.pathname === path;
    return `p-3 rounded-2xl transition-all duration-300 ${
      isActive 
        ? 'text-blue-600 bg-blue-50 shadow-inner' 
        : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50'
    }`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* 1. 사이드바 네비게이션 */}
      {!isAuthPage && (
        <div className="w-24 bg-white border-r border-gray-100 flex flex-col items-center py-10 sticky top-0 h-screen z-50">
          <div className="flex flex-col items-center space-y-6 flex-1">
            {/* 글로벌 검색 전용 메뉴 */}
            <Link title="전체 OTT 검색" to="/search" className={getIconClass('/search')}>
              <Search size={26} strokeWidth={2.5} />
            </Link>
            
            <div className="w-12 h-px bg-gray-100" /> {/* 구분선 */}

            <Link title="내 영화 목록" to="/movies" className={getIconClass('/movies')}>
              <Clapperboard size={26} />
            </Link>
            
            <Link title="내 TV 쇼 목록" to="/tv" className={getIconClass('/tv')}>
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

      {/* 2. 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 lg:p-12">
            {!isAuthPage && (
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-extrabold text-gray-950 tracking-tighter">
                  {location.pathname === '/movies' ? '내 영화 기록' : 
                   location.pathname === '/tv' ? '내 TV 쇼 기록' : 
                   location.pathname === '/mypage' ? '마이페이지' : 
                   location.pathname === '/search' ? '전체 OTT 검색' : '설정'}
                </h1>
              </div>
            )}
            
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* searchTerm은 오직 내 목록 필터링 용도로만 사용됩니다 */}
              <Route path="/movies" element={<MoviesPage searchTerm={searchTerm} />} />
              <Route path="/tv" element={<TvShowsPage searchTerm={searchTerm} />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/settings" element={<SettingsPage />} /> 
              <Route path="/search" element={<SearchPage />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* 3. 우측 퀵 패널 (내 기록 필터링 전용 검색창) */}
          {!isAuthPage && location.pathname !== '/settings' && location.pathname !== '/mypage' && location.pathname !== '/search' && (
            <div className="w-80 bg-white border-l border-gray-100 p-8 hidden xl:block overflow-y-auto z-40">
              <div className="flex items-center space-x-4 mb-10">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/mypage')}>
                  U
                </div>
                {/* 필터링 전용 검색창 */}
                <div className="flex-1 bg-slate-100 rounded-2xl px-5 py-3 flex items-center border border-slate-200 focus-within:border-blue-300 focus-within:bg-white transition-all">
                  <Search size={20} className="text-gray-400 mr-3" />
                  <input 
                    type="text" 
                    placeholder="내 시청 목록 필터링..." 
                    className="bg-transparent text-sm outline-none w-full text-gray-800 placeholder:text-gray-400" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    /* 엔터키 이동 기능(onKeyDown) 완전 삭제 */
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;