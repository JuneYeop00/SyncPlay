import React, { useState } from 'react';
import { Settings as SettingsIcon, Lock, Sun, Moon, Palette, ChevronRight, X, Eye, EyeOff, Check } from 'lucide-react';

const Settings = ({ isDarkMode, toggleTheme }) => {
  const [modalStep, setModalStep] = useState(null); // null | 'verify' | 'edit'
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-600" : "text-slate-400";

  const glass = isDarkMode
    ? "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]"
    : "bg-white/55 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-100/30";

  const accentBg = isDarkMode ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50/80 border-indigo-200/60";
  const accent = isDarkMode ? "text-indigo-400" : "text-indigo-600";

  const inputClass = isDarkMode
    ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus:border-indigo-500/50 focus:ring-indigo-500/10 focus:bg-white/10'
    : 'bg-white/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400/60 focus:ring-indigo-400/10 focus:bg-white';

  const modalBg = isDarkMode
    ? "bg-[#0d0d14] border-white/[0.1]"
    : "bg-white/95 border-slate-200/80";

  const openModal = () => {
    setModalStep('verify');
    setCurrentPassword('');
    setVerifyError('');
    setShowCurrentPw(false);
  };

  const closeModal = () => {
    setModalStep(null);
    setCurrentPassword('');
    setVerifyError('');
    setNewPassword('');
    setConfirmNewPassword('');
    setSaveError('');
    setSaveSuccess(false);
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
  };

  const handleVerify = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { setVerifyError('로그인 정보를 찾을 수 없습니다.'); return; }
    if (user.password !== currentPassword) { setVerifyError('비밀번호가 일치하지 않습니다.'); return; }
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setNewPassword('');
    setConfirmNewPassword('');
    setSaveError('');
    setSaveSuccess(false);
    setModalStep('edit');
  };

  const handleSave = async () => {
    if (!editName.trim()) { setSaveError('이름을 입력해주세요.'); return; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(editEmail)) { setSaveError('올바른 이메일 형식이 아닙니다.'); return; }

    if (newPassword) {
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{10,}/.test(newPassword)) {
        setSaveError('비밀번호는 대소문자, 숫자, 특수문자 포함 10자 이상이어야 합니다.');
        return;
      }
      if (newPassword !== confirmNewPassword) { setSaveError('새 비밀번호가 일치하지 않습니다.'); return; }
    }

    const currentUser = JSON.parse(localStorage.getItem('user'));

    try {
      const res = await fetch('http://localhost:8080/api/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail: currentUser.email,
          name: editName.trim(),
          newEmail: editEmail.trim().toLowerCase(),
          newPassword: newPassword || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setSaveError(data || '저장에 실패했습니다.'); return; }

      const updatedUser = {
        ...currentUser,
        name: data.user.name,
        email: data.user.email,
        password: data.password,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSaveSuccess(true);
      setSaveError('');
      setTimeout(closeModal, 1500);
    } catch {
      setSaveError('서버 연결에 실패했습니다.');
    }
  };

  const labelClass = `text-[10px] font-black ${textMuted} uppercase tracking-[0.3em] ml-1 block`;

  return (
    <div className="w-full animate-in fade-in duration-700">
      <div className="w-full space-y-5">

        {/* 화면 설정 */}
        <div className={`${glass} rounded-3xl p-10`}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accentBg} ${accent}`}>
                <Palette size={17} />
              </div>
              <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>화면 설정</h3>
            </div>
            <p className={`text-[10px] ${textMuted} font-bold uppercase tracking-[0.15em] ml-12`}>테마 및 디스플레이 옵션</p>
          </div>

          <div
            onClick={toggleTheme}
            className={`p-8 rounded-2xl border transition-all duration-300 cursor-pointer group flex items-center justify-between ${
              isDarkMode
                ? "bg-white/[0.04] border-white/[0.08] hover:border-indigo-500/40 hover:bg-indigo-500/5"
                : "bg-white/60 border-slate-200/60 hover:border-indigo-400/50 hover:bg-indigo-50/30"
            }`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDarkMode
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  : 'bg-amber-50 border-amber-200/60 text-amber-500'
              }`}>
                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <h4 className={`text-base font-bold ${textPrimary} tracking-tight`}>
                  {isDarkMode ? "다크 모드" : "라이트 모드"}
                </h4>
                <p className={`text-[10px] font-bold ${textMuted} mt-1 uppercase tracking-widest`}>클릭하여 테마 전환</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? "bg-indigo-500" : "bg-slate-300"}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? "translate-x-6" : "translate-x-0"}`} />
            </div>
          </div>
        </div>

        {/* 애플리케이션 설정 */}
        <div className={`${glass} rounded-3xl p-10`}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accentBg} ${accent}`}>
                <SettingsIcon size={17} />
              </div>
              <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>애플리케이션 설정</h3>
            </div>
            <p className={`text-[10px] ${textMuted} font-bold uppercase tracking-[0.15em] ml-12`}>보안 및 계정 관리</p>
          </div>

          <div
            onClick={openModal}
            className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer group flex items-center justify-between ${
              isDarkMode
                ? 'bg-white/[0.04] border-white/[0.08] hover:border-emerald-500/40 hover:bg-emerald-500/5'
                : 'bg-white/60 border-slate-200/60 hover:border-emerald-400/50 hover:bg-emerald-50/30'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                isDarkMode
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200/60 text-emerald-600'
              }`}>
                <Lock size={18} />
              </div>
              <div>
                <p className={`text-sm font-bold ${textPrimary} tracking-tight`}>보안 및 계정</p>
                <p className={`text-[10px] font-bold ${textMuted} mt-0.5 uppercase tracking-widest`}>
                  비밀번호 변경 및 회원정보 수정
                </p>
              </div>
            </div>
            <ChevronRight size={16} className={`${textMuted} group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0`} />
          </div>
        </div>

      </div>

      {/* 모달 */}
      {modalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className={`absolute inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-slate-900/40'} backdrop-blur-sm`}
            onClick={closeModal}
          />
          <div className={`relative w-full max-w-md rounded-3xl border p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300 ${modalBg}`}>

            <button
              onClick={closeModal}
              className={`absolute top-6 right-6 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X size={16} />
            </button>

            {/* Step 1: 비밀번호 인증 */}
            {modalStep === 'verify' && (
              <>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-6 ${
                  isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200/60 text-emerald-600'
                }`}>
                  <Lock size={22} />
                </div>
                <h3 className={`text-xl font-black ${textPrimary} tracking-tight mb-1`}>보안 인증</h3>
                <p className={`text-[10px] font-bold ${textMuted} uppercase tracking-widest mb-8`}>
                  회원정보 변경을 위해 현재 비밀번호를 입력하세요
                </p>

                <div className="space-y-2 mb-6">
                  <label className={labelClass}>현재 비밀번호</label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoFocus
                      className={`w-full px-5 py-4 rounded-2xl border outline-none focus:ring-4 transition-all font-medium pr-12 ${inputClass}`}
                      value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); setVerifyError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(v => !v)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 ${textMuted} hover:opacity-70 transition-opacity`}
                    >
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {verifyError && <p className="text-red-400 text-[11px] font-bold ml-1 mt-1">{verifyError}</p>}
                </div>

                <button
                  onClick={handleVerify}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                    isDarkMode ? 'bg-white text-[#050507] hover:bg-white/90' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  확인
                </button>
              </>
            )}

            {/* Step 2: 회원정보 편집 */}
            {modalStep === 'edit' && (
              <>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-6 ${
                  isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200/60 text-indigo-600'
                }`}>
                  <SettingsIcon size={22} />
                </div>
                <h3 className={`text-xl font-black ${textPrimary} tracking-tight mb-1`}>회원정보 변경</h3>
                <p className={`text-[10px] font-bold ${textMuted} uppercase tracking-widest mb-8`}>
                  변경할 정보를 입력하세요
                </p>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className={labelClass}>이름</label>
                    <input
                      type="text"
                      className={`w-full px-5 py-4 rounded-2xl border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); setSaveError(''); }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>이메일</label>
                    <input
                      type="email"
                      className={`w-full px-5 py-4 rounded-2xl border outline-none focus:ring-4 transition-all font-medium ${inputClass}`}
                      value={editEmail}
                      onChange={(e) => { setEditEmail(e.target.value); setSaveError(''); }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>
                      새 비밀번호{' '}
                      <span className="normal-case tracking-normal font-bold opacity-40">(변경 시에만 입력)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`w-full px-5 py-4 rounded-2xl border outline-none focus:ring-4 transition-all font-medium pr-12 ${inputClass}`}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setSaveError(''); }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(v => !v)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${textMuted} hover:opacity-70 transition-opacity`}
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPassword && (
                      <p className={`text-[9px] font-bold ml-1 ${textMuted}`}>
                        * 대소문자, 숫자, 특수문자(@$!%*?&) 포함 10자 이상
                      </p>
                    )}
                  </div>

                  {newPassword && (
                    <div className="space-y-2">
                      <label className={labelClass}>새 비밀번호 확인</label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? 'text' : 'password'}
                          placeholder="••••••••"
                          className={`w-full px-5 py-4 rounded-2xl border outline-none focus:ring-4 transition-all font-medium pr-12 ${inputClass}`}
                          value={confirmNewPassword}
                          onChange={(e) => { setConfirmNewPassword(e.target.value); setSaveError(''); }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(v => !v)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 ${textMuted} hover:opacity-70 transition-opacity`}
                        >
                          {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {saveError && (
                    <p className="text-red-400 text-[11px] font-bold ml-1">{saveError}</p>
                  )}

                  {saveSuccess && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check size={14} strokeWidth={3} />
                      <p className="text-[11px] font-bold">변경이 완료되었습니다!</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saveSuccess}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 mt-8 ${
                    saveSuccess
                      ? 'bg-emerald-500 text-white cursor-default'
                      : isDarkMode
                        ? 'bg-white text-[#050507] hover:bg-white/90'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {saveSuccess ? '저장 완료!' : '저장하기'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
