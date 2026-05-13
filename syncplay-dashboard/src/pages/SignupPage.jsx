import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignupPage = ({ isDarkMode }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('모든 항목을 입력해주세요.'); return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 서로 일치하지 않습니다.'); return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{10,}$/.test(password)) {
      setError('비밀번호는 대소문자, 숫자, 특수문자 포함 10자 이상이어야 합니다.'); return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError('올바른 이메일 형식이 아닙니다. (예: example@email.com)'); return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || '회원가입에 실패했습니다.'); return; }
      navigate('/login');
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const bg = isDarkMode ? 'bg-[#050507]' : 'bg-[#eef1f8]';
  const cardBg = isDarkMode
    ? 'bg-white/5 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]'
    : 'bg-white/70 border-white/60 shadow-[0_40px_100px_rgba(99,102,241,0.08)] shadow-slate-200/60';
  const titleColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const subtitleColor = isDarkMode ? 'text-slate-500' : 'text-slate-500';
  const labelColor = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const inputClass = isDarkMode
    ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus:border-indigo-500/50 focus:ring-indigo-500/10 focus:bg-white/10'
    : 'bg-white/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400/60 focus:ring-indigo-400/10 focus:bg-white';
  const btnClass = isDarkMode
    ? 'bg-white text-[#050507] hover:shadow-indigo-500/20'
    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20';
  const linkColor = isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500';
  const footerColor = isDarkMode ? 'text-slate-500' : 'text-slate-500';

  return (
    <div className={`min-h-screen flex items-center justify-center ${bg} font-sans relative overflow-hidden p-6 py-12`}>
      <div className={`absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none ${isDarkMode ? 'bg-indigo-600/20 animate-pulse' : 'bg-indigo-400/10'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none ${isDarkMode ? 'bg-emerald-600/10' : 'bg-violet-400/8'}`} />

      <div className={`backdrop-blur-[80px] p-12 lg:p-16 rounded-[4rem] border w-full max-w-2xl relative z-10 animate-in fade-in zoom-in-95 duration-1000 ${cardBg}`}>
        <div className="flex justify-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[1.8rem] shadow-[0_0_40px_rgba(79,70,229,0.4)] flex items-center justify-center text-white text-3xl font-black cursor-default">
            SP
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className={`text-4xl font-black ${titleColor} mb-3 tracking-tighter`}>계정 생성</h2>
          <p className={`${subtitleColor} font-bold uppercase tracking-[0.2em] text-xs`}>스마트한 OTT 생활의 시작</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className={`text-[10px] font-black ${labelColor} uppercase tracking-[0.3em] ml-2 block`}>사용자 이름</label>
              <input
                type="text"
                placeholder="성함 입력"
                className={`w-full px-6 py-4 rounded-2xl border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2.5">
              <label className={`text-[10px] font-black ${labelColor} uppercase tracking-[0.3em] ml-2 block`}>이메일 주소</label>
              <input
                type="email"
                placeholder="example@email.com"
                className={`w-full px-6 py-4 rounded-2xl border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className={`text-[10px] font-black ${labelColor} uppercase tracking-[0.3em] ml-2 block`}>비밀번호 설정</label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full px-6 py-4 rounded-2xl border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2.5">
            <label className={`text-[10px] font-black ${labelColor} uppercase tracking-[0.3em] ml-2 block`}>비밀번호 확인</label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full px-6 py-4 rounded-2xl border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <p className={`text-[10px] font-bold ml-2 mt-1 ${labelColor}`}>* 대소문자, 숫자, 특수문자(@$!%*?&) 포함 10자 이상</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-black py-5 rounded-[2rem] shadow-lg hover:-translate-y-1 transition-all active:scale-95 mt-8 text-lg disabled:opacity-50 disabled:cursor-not-allowed ${btnClass}`}
          >
            {loading ? '가입 중...' : '회원가입 완료'}
          </button>
        </form>

        <p className={`mt-12 text-center text-sm ${footerColor} font-bold`}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className={`${linkColor} transition-colors underline-offset-4 hover:underline`}>
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
