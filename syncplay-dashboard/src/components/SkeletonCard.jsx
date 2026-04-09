import React from 'react';

const SkeletonCard = ({ isDarkMode }) => {
  const bgBase = isDarkMode ? "bg-white/5" : "bg-slate-200";
  const bgHighlight = isDarkMode ? "bg-white/10" : "bg-slate-300";

  return (
    <div className={`flex flex-col w-full animate-pulse rounded-[2.5rem] p-3 border ${isDarkMode ? "border-white/5 bg-white/5" : "border-slate-100 bg-white shadow-sm"}`}>
      {/* 포스터 영역 뼈대 */}
      <div className={`w-full aspect-[2/3] rounded-[2rem] ${bgHighlight} relative overflow-hidden`}>
        {/* 오로라 효과가 살짝 비치는 듯한 광택 애니메이션 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      
      {/* 텍스트 영역 뼈대 */}
      <div className="mt-5 px-3 pb-2 space-y-3">
        <div className={`h-5 w-3/4 rounded-lg ${bgHighlight}`} />
        <div className={`h-3 w-1/2 rounded-md ${bgBase}`} />
      </div>
    </div>
  );
};

export default SkeletonCard;
