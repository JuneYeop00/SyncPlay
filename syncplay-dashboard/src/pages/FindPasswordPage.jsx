import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, CheckCircle2, Mail } from 'lucide-react';
import API_BASE_URL from '../config/api';

const FindPasswordPage = ({ isDarkMode }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false); // 메일 발송 성공 여부 상태
  const navigate = useNavigate();

  const handleFindPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email) {
      setError('이름과 이메일 주소를 모두 입력해주세요.');
      return;
    }

    // 올바른 정규식 리터럴로 이메일 형식 검사 (\. 하나만 사용)
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setLoading(true);
    try {
      // ────────────────────────────────────────────────────────
      // 백엔드 @PostMapping 명세에 맞춰 method와 body 구조 전면 수정
      // ────────────────────────────────────────────────────────
      const res = await fetch(`${API_BASE_URL}/api/users/find-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }), 
      });
      
      const data = await res.json();

      if (!res.ok) {
        // 백엔드에서 보낸 에러 메시지("등록되지 않은 이름 또는 이메일 입니다." 등) 출력
        setError(data?.message || '등록되지 않은 이름 또는 이메일 입니다.');
        return;
      }

      // 발송 성공 시 완료 화면 상태값 true 변경
      setIsSent(true);
    } catch {
      setError('서버에 연결할 수 없습니다. 백엔드 코드를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // SyncPlay 공통 디자인 테마 변수
  const bg = isDarkMode ? 'bg-[#050507]' : 'bg-[#eef1f8]';
  const cardBg = isDarkMode
    ? 'bg-white/5 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]'
    : 'bg-white/75 border-white/50 shadow-[0_40px_100px_rgba(15,23,42,0.08)]';
  
  const inputClass = isDarkMode
    ? 'bg-black/20 border-white/[0.08] text-white focus:ring-indigo-500/30 focus:border-indigo-500/50'
    : 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500';

  const titleColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const descColor = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const labelColor = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const footerColor = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  
  const btnClass = isDarkMode
    ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-indigo-500/20'
    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20';
  
  const linkColor = isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700';

  return (
    <div className={`min-h-screen w-full flex items-center justify-center ${bg} p-6 font-sans transition-colors duration-500`}>
      <div className={`w-full max-w-[480px] p-10 md:p-14 rounded-[3rem] border backdrop-blur-3xl transition-all duration-500 ${cardBg} relative overflow-hidden`}>
        
        {/* 뒤로가기 버튼 */}
        <button 
          onClick={() => navigate(-1)} 
          className={`absolute top-8 left-8 p-3 rounded-full transition-all group ${
            isDarkMode ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
        </button>

        {!isSent ? (
          /* 1단계: 이름 및 이메일 입력 폼 */
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col items-center text-center mt-4">
              <div className={`p-4 rounded-[1.5rem] mb-6 ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <KeyRound size={32} />
              </div>
              <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${titleColor}`}>비밀번호 찾기</h2>
              <p className={`mt-3 text-sm font-medium leading-relaxed max-w-[280px] ${descColor}`}>
                가입할 때 등록한 이름과 이메일 주소를 입력해 주세요.
              </p>
            </div>

            <form onSubmit={handleFindPassword} className="space-y-5 mt-10">
              {/* 이름 입력 필드 */}
              <div className="space-y-2.5">
                <label className={`text-[10px] font-black ${labelColor} uppercase tracking-[0.3em] ml-2 block`}>이름</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  className={`w-full px-8 py-5 rounded-[2rem] border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* 이메일 입력 필드 */}
              <div className="space-y-2.5">
                <label className={`text-[10px] font-black ${labelColor} uppercase tracking-[0.3em] ml-2 block`}>이메일 주소</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`w-full px-8 py-5 rounded-[2rem] border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm font-bold text-center pt-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-black py-5 rounded-[2rem] shadow-lg hover:-translate-y-1 transition-all active:scale-95 mt-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed ${btnClass}`}
              >
                {loading ? '메일 발송 요청 중...' : '임시 비밀번호 발송'}
              </button>
            </form>
          </div>
        ) : (
          /* 2단계: 임시 비밀번호 이메일 발송 완료 안내 화면 */
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center">
              <div className="p-4 rounded-[1.5rem] bg-emerald-500/10 text-emerald-400 mb-6">
                <Mail size={36} />
              </div>
              <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${titleColor}`}>메일 발송 완료</h2>
              <p className={`mt-4 text-sm font-medium leading-relaxed max-w-[290px] ${descColor}`}>
                <span className={`${isDarkMode ? 'text-white' : 'text-slate-900'} font-bold`}>{email}</span> 메일함으로 임시 비밀번호가 전송되었습니다.
              </p>
              
              <p className={`text-xs mt-6 px-4 py-3 rounded-xl border font-medium ${
                isDarkMode ? 'bg-white/[0.02] border-white/[0.05] text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}>
                ⚠️ 메일이 도착하지 않았다면 스팸 메일함을 확인해 주세요.
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className={`w-full font-black py-5 rounded-[2rem] shadow-lg hover:-translate-y-1 transition-all active:scale-95 mt-10 text-lg ${btnClass}`}
            >
              로그인하러 가기
            </button>
          </div>
        )}

        {/* 푸터 하단 고정 링크 */}
        <p className={`mt-12 text-center text-sm ${footerColor} font-bold`}>
          계정이 기억나셨나요?{' '}
          <Link to="/login" className={`${linkColor} transition-colors underline-offset-4 hover:underline`}>
            로그인하기
          </Link>
        </p>

      </div>
    </div>
  );
};

export default FindPasswordPage;