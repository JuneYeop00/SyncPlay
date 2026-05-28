import React, { useMemo, useState } from 'react';

const WEEK_COUNT = 22;
const CELL    = 16;
const GAP     = 4;
const DAY_COL = 20;

const DAY_LABELS   = ['월', '화', '수', '목', '금', '토', '일'];
const MONTH_NAMES  = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const KO_DOW       = ['일','월','화','수','목','금','토'];
const KO_DOW_FULL  = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];

// OTT brand colours for bubble chart
const PLATFORM_COLORS = {
  'Netflix':            { bg: 'rgba(229,9,20,0.88)',    shadow: 'rgba(229,9,20,0.35)' },
  'TVING':              { bg: 'rgba(0,199,129,0.88)',   shadow: 'rgba(0,199,129,0.35)' },
  'Disney+':            { bg: 'rgba(17,60,207,0.88)',   shadow: 'rgba(17,60,207,0.35)' },
  'Coupang Play':       { bg: 'rgba(255,138,0,0.88)',   shadow: 'rgba(255,138,0,0.35)' },
  'Wavve':              { bg: 'rgba(139,92,246,0.88)',  shadow: 'rgba(139,92,246,0.35)' },
  '왓챠':               { bg: 'rgba(244,63,94,0.88)',   shadow: 'rgba(244,63,94,0.35)' },
  'Apple TV+':          { bg: 'rgba(0,125,250,0.88)',   shadow: 'rgba(0,125,250,0.35)' },
  'Amazon Prime Video': { bg: 'rgba(0,168,225,0.88)',   shadow: 'rgba(0,168,225,0.35)' },
};
const PLATFORM_SHORT = {
  'Netflix': 'Netflix', 'TVING': 'TVING', 'Disney+': 'Disney+',
  'Coupang Play': 'Coupang', 'Wavve': 'Wavve', '왓챠': '왓챠',
  'Apple TV+': 'Apple TV+', 'Amazon Prime Video': 'Amazon',
};

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function formatHour(h) {
  if (h === 0)  return '자정';
  if (h === 12) return '정오';
  if (h < 12)   return `오전 ${h}시`;
  return `오후 ${h - 12}시`;
}
function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  if (h === 0)  return `오전 12:${m}`;
  if (h < 12)   return `오전 ${h}:${m}`;
  if (h === 12) return `오후 12:${m}`;
  return `오후 ${h - 12}:${m}`;
}
function parseDateKey(key) {
  const [y, mo, d] = key.split('-').map(Number);
  return { y, mo, d, dow: KO_DOW[new Date(y, mo - 1, d).getDay()] };
}
function getIntensity(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3)  return 2;
  if (count <= 6)  return 3;
  return 4;
}

export default function WatchCalendar({ history, isDarkMode, genreMap = {} }) {
  const [selectedDate, setSelectedDate] = useState(null);

  /* ── derive all stats from history ── */
  const { dayMap, hourMap, activeDays, streak, bestDow, thisMonthCount, platformStats } = useMemo(() => {
    const dayMap        = {};
    const hourMap       = new Array(24).fill(0);
    const dowTotals     = new Array(7).fill(0);
    const platformCounts = {};

    const now    = new Date();
    const thisMo = now.getMonth();
    const thisYr = now.getFullYear();
    let thisMonthCount = 0;

    history.forEach(item => {
      if (!item.watchedAt) return;
      const d   = new Date(item.watchedAt);
      const key = toDateKey(d);
      dayMap[key] = (dayMap[key] || 0) + 1;
      hourMap[d.getHours()]++;
      dowTotals[d.getDay()]++;
      if (d.getFullYear() === thisYr && d.getMonth() === thisMo) thisMonthCount++;
      if (item.platform) platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
    });

    const cur = new Date(); cur.setHours(0,0,0,0);
    let streak = 0;
    while (dayMap[toDateKey(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }

    const maxDow = Math.max(...dowTotals);
    const bestDow = maxDow > 0 ? dowTotals.indexOf(maxDow) : -1;

    const platformStats = Object.entries(platformCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { dayMap, hourMap, activeDays: Object.keys(dayMap).length, streak, bestDow, thisMonthCount, platformStats };
  }, [history]);

  /* ── genre stats (depends on genreMap too) ── */
  const genreStats = useMemo(() => {
    if (!Object.keys(genreMap).length) return [];
    const counts = {};
    history.forEach(item => {
      (item.genreIds || []).forEach(id => {
        const name = genreMap[id];
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [history, genreMap]);

  /* ── build grid ── */
  const today = new Date(); today.setHours(0,0,0,0);
  const todayKey  = toDateKey(today);
  const monOffset = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() - monOffset - (WEEK_COUNT - 1) * 7);

  const weeks = useMemo(() => {
    const result = [];
    for (let w = 0; w < WEEK_COUNT; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + w * 7 + d);
        const key = toDateKey(date);
        days.push({ key, count: dayMap[key] || 0, isFuture: date > today, isToday: key === todayKey });
      }
      result.push(days);
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayMap, todayKey]);

  const monthLabels = weeks.map((week, wi) => {
    const [, m] = week[0].key.split('-').map(Number);
    if (wi === 0) return MONTH_NAMES[m - 1];
    const [, pm] = weeks[wi - 1][0].key.split('-').map(Number);
    return m !== pm ? MONTH_NAMES[m - 1] : null;
  });

  /* ── selected day ── */
  const selectedItems = useMemo(() => {
    if (!selectedDate) return [];
    return history
      .filter(item => item.watchedAt && toDateKey(new Date(item.watchedAt)) === selectedDate)
      .sort((a, b) => new Date(a.watchedAt) - new Date(b.watchedAt));
  }, [selectedDate, history]);

  const handleCellClick = (cell) => {
    if (cell.isFuture || cell.count === 0) return;
    setSelectedDate(prev => prev === cell.key ? null : cell.key);
  };

  /* ── hour chart ── */
  const maxHour     = Math.max(...hourMap, 1);
  const peakHour    = hourMap.indexOf(Math.max(...hourMap));
  const hasActivity = hourMap.some(h => h > 0);

  /* ── styles ── */
  const iCls = (i) => {
    const d = ['bg-white/[0.07]','bg-indigo-950 border border-indigo-700/50','bg-indigo-800/80','bg-indigo-600','bg-indigo-400'];
    const l = ['bg-slate-200/70','bg-indigo-100 border border-indigo-200',  'bg-indigo-300',  'bg-indigo-500','bg-indigo-600'];
    return (isDarkMode ? d : l)[i] ?? (isDarkMode ? d : l)[0];
  };

  const todayRing    = isDarkMode ? '0 0 0 2px #818cf8' : '0 0 0 2px #6366f1';
  const selectedRing = isDarkMode
    ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 8px rgba(129,140,248,0.6)'
    : '0 0 0 2px #4f46e5, 0 0 8px rgba(79,70,229,0.35)';

  const glass         = isDarkMode ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]' : 'bg-white/55 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/30';
  const innerCard     = isDarkMode ? 'bg-white/[0.04] border border-white/[0.07]'                 : 'bg-white/60 border border-white/60 shadow-sm';
  const chipBase      = isDarkMode ? 'bg-white/[0.06] text-slate-300'                             : 'bg-slate-100/90 text-slate-600';
  const textPrimary   = isDarkMode ? 'text-white'      : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-300'  : 'text-slate-700';
  const textMuted     = isDarkMode ? 'text-slate-500'  : 'text-slate-400';
  const textSubMuted  = isDarkMode ? 'text-slate-600'  : 'text-slate-400';
  const accent        = isDarkMode ? 'text-indigo-400' : 'text-indigo-600';
  const accentBg      = isDarkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50/80 border-indigo-300/60 text-indigo-600';
  const divider       = isDarkMode ? 'border-white/[0.06]'  : 'border-slate-200/40';
  const progressBg    = isDarkMode ? 'bg-white/[0.08]'      : 'bg-slate-200/70';
  const progressFill  = isDarkMode ? 'bg-indigo-400'        : 'bg-indigo-500';
  const violetFill    = isDarkMode ? 'bg-violet-400'        : 'bg-violet-500';

  const selectedDateParsed = selectedDate ? parseDateKey(selectedDate) : null;

  return (
    <section className={`${glass} rounded-3xl p-8`}>

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-7">
        <div>
          <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>시청 활동</h3>
          <p className={`text-[10px] ${textMuted} font-bold mt-1 uppercase tracking-[0.15em]`}>
            최근 {WEEK_COUNT}주 · {activeDays}일 활동
          </p>
        </div>
        {hasActivity && (
          <div className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${accentBg}`}>
            주로 {formatHour(peakHour)} 시청
          </div>
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-6 items-start">

        {/* ── LEFT ── */}
        <div className="flex-1 min-w-0">

          {/* Heatmap */}
          <div className="overflow-x-auto pb-1">
            <div style={{ display: 'inline-flex', flexDirection: 'column' }}>

              {/* Month labels */}
              <div style={{ display: 'flex', gap: GAP, marginBottom: 7, paddingLeft: DAY_COL + GAP }}>
                {monthLabels.map((label, wi) => (
                  <div key={wi} style={{ width: CELL, flexShrink: 0 }}>
                    {label && <span className={`text-[10px] font-bold ${textMuted} whitespace-nowrap`}>{label}</span>}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div style={{ display: 'flex', gap: GAP }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, width: DAY_COL, flexShrink: 0 }}>
                  {DAY_LABELS.map((d, i) => (
                    <div key={i} className={`text-[10px] font-bold ${textSubMuted} flex items-center justify-end`}
                      style={{ height: CELL }}>
                      {[0, 2, 4, 6].includes(i) ? d : ''}
                    </div>
                  ))}
                </div>

                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP, flexShrink: 0 }}>
                    {week.map((cell) => {
                      const isSelected = cell.key === selectedDate;
                      const intensity  = cell.isFuture ? 0 : getIntensity(cell.count);
                      const cls        = cell.isFuture ? (isDarkMode ? 'bg-white/[0.03]' : 'bg-slate-100/30') : iCls(intensity);
                      const shadow     = isSelected ? selectedRing : cell.isToday ? todayRing : undefined;
                      const clickable  = !cell.isFuture && cell.count > 0;
                      return (
                        <div
                          key={cell.key}
                          title={cell.isFuture ? '' : `${cell.key.replace(/-/g,'/')} (${KO_DOW[new Date(cell.key).getDay()]}) · ${cell.count}편`}
                          onClick={() => handleCellClick(cell)}
                          className={`rounded-[4px] transition-all ${cls} ${clickable ? 'cursor-pointer hover:scale-125 hover:z-10' : ''} ${isSelected ? 'scale-125 z-10' : ''}`}
                          style={{ width: CELL, height: CELL, boxShadow: shadow, position: 'relative', zIndex: isSelected ? 10 : cell.isToday ? 1 : undefined }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend + today */}
          <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold ${textMuted}`}>적음</span>
              {[0,1,2,3,4].map(i => (
                <div key={i} className={`rounded-[4px] ${iCls(i)}`} style={{ width: CELL, height: CELL }} />
              ))}
              <span className={`text-[9px] font-bold ${textMuted}`}>많음</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`rounded-[4px] ${isDarkMode ? 'bg-white/[0.07]' : 'bg-slate-200/70'}`}
                style={{ width: CELL, height: CELL, boxShadow: todayRing }} />
              <span className={`text-[9px] font-bold ${textMuted}`}>오늘</span>
            </div>
          </div>

          {/* Stat chips */}
          {(streak > 0 || bestDow >= 0 || thisMonthCount > 0) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {streak > 1 && (
                <span className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg ${chipBase}`}>
                  🔥 {streak}일 연속 시청 중
                </span>
              )}
              {bestDow >= 0 && (
                <span className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg ${chipBase}`}>
                  📅 주로 {KO_DOW_FULL[bestDow]}
                </span>
              )}
              {thisMonthCount > 0 && (
                <span className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg ${chipBase}`}>
                  이번 달 {thisMonthCount}편
                </span>
              )}
            </div>
          )}

          {/* Hour pattern */}
          {hasActivity && (
            <div className={`mt-5 pt-5 border-t ${divider}`}>
              <p className={`text-[9px] font-bold ${textMuted} uppercase tracking-[0.15em] mb-3`}>시간대별 시청 패턴</p>
              <div className="flex items-end gap-px" style={{ height: 52 }}>
                {hourMap.map((count, hour) => {
                  const barH  = Math.max((count / maxHour) * 48, count > 0 ? 5 : 2);
                  const isPeak = hour === peakHour && count > 0;
                  return (
                    <div key={hour} title={`${formatHour(hour)}: ${count}편`}
                      className={`flex-1 rounded-t-sm transition-all ${
                        isPeak    ? (isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500')
                        : count > 0 ? (isDarkMode ? 'bg-indigo-700/70' : 'bg-indigo-300')
                        : (isDarkMode ? 'bg-white/[0.05]' : 'bg-slate-200/60')
                      }`}
                      style={{ height: barH }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className={`text-[9px] font-bold ${textSubMuted}`}>자정</span>
                <span className={`text-[9px] font-bold ${accent}`}>{formatHour(peakHour)} ▲</span>
                <span className={`text-[9px] font-bold ${textSubMuted}`}>자정</span>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: detail panel ── */}
        <div className="hidden md:flex flex-col flex-shrink-0 w-72 lg:w-80">
          {selectedDate && selectedDateParsed ? (
            <div className={`${innerCard} rounded-2xl p-5 flex flex-col`}
              style={{ animation: 'fadeSlideIn 0.18s ease' }}>

              {/* Panel header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className={`text-base font-black ${textPrimary} tracking-tight`}>
                    {selectedDateParsed.mo}월 {selectedDateParsed.d}일
                  </p>
                  <p className={`text-[10px] font-bold ${textMuted} mt-0.5`}>
                    {selectedDateParsed.dow}요일 · {selectedItems.length}편 시청
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                    isDarkMode ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white'
                               : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
                >✕</button>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-3 overflow-y-auto pr-0.5" style={{ maxHeight: 380 }}>
                {selectedItems.map((item) => (
                  <div key={item.id}
                    className={`flex gap-3 p-3 rounded-xl transition-colors ${
                      isDarkMode ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-white/50 hover:bg-white/80'
                    }`}>

                    {/* Poster */}
                    <div className="w-11 h-16 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}>
                      {item.posterUrl
                        ? <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                        : <div className={`w-full h-full flex items-center justify-center text-[8px] font-bold ${textMuted}`}>NO</div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <p className={`text-xs font-bold ${textSecondary} leading-snug line-clamp-2`}>{item.title}</p>
                        {item.subTitle && (
                          <p className={`text-[10px] ${textMuted} mt-0.5 truncate`}>{item.subTitle}</p>
                        )}
                      </div>
                      <div>
                        <p className={`text-[10px] font-bold ${textMuted} mt-1.5`}>
                          {item.platform}
                          {item.watchedAt && <span className="font-normal opacity-60"> · {formatTime(item.watchedAt)}</span>}
                        </p>
                        {item.progress != null && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[9px] font-bold ${accent}`}>{item.progress}% 완료</span>
                            </div>
                            <div className={`h-[3px] w-full rounded-full ${progressBg}`}>
                              <div className={`h-full rounded-full ${progressFill} shadow-[0_0_6px_rgba(99,102,241,0.5)]`}
                                style={{ width: `${item.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`h-full min-h-[200px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 px-8 py-10 ${
              isDarkMode ? 'border-white/[0.07]' : 'border-slate-200/70'
            }`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                isDarkMode ? 'bg-white/[0.05]' : 'bg-slate-100'
              }`}>🗓️</div>
              <p className={`text-[9px] font-bold ${textMuted} uppercase tracking-widest text-center leading-relaxed`}>
                기록이 있는 날짜를<br />클릭하면 표시돼요
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ── Platform bubbles + Genre tag cloud ── */}
      {(platformStats.length > 0 || genreStats.length > 0) && (
        <div className={`mt-6 pt-6 border-t ${divider} grid grid-cols-1 md:grid-cols-2 gap-8`}>

          {/* Platform: bubble chart */}
          {platformStats.length > 0 && (
            <div>
              <p className={`text-[9px] font-bold ${textMuted} uppercase tracking-[0.15em] mb-4`}>주요 플랫폼</p>
              <div className="flex flex-wrap gap-4 items-end">
                {platformStats.map(([name, count]) => {
                  const ratio  = count / platformStats[0][1];
                  const size   = Math.round(44 + ratio * 40); // 44–84px
                  const colors = PLATFORM_COLORS[name] ?? { bg: 'rgba(99,102,241,0.85)', shadow: 'rgba(99,102,241,0.3)' };
                  const short  = PLATFORM_SHORT[name] ?? name;
                  return (
                    <div key={name} className="flex flex-col items-center gap-1.5" title={`${name} · ${count}편`}>
                      <div
                        className="rounded-full flex flex-col items-center justify-center transition-transform duration-200 hover:scale-110 cursor-default select-none"
                        style={{
                          width: size, height: size,
                          background: colors.bg,
                          boxShadow: `0 6px 22px ${colors.shadow}`,
                        }}
                      >
                        <span
                          className="font-black text-white leading-tight text-center px-2 line-clamp-2"
                          style={{ fontSize: Math.max(8, Math.round(size * 0.17)) }}
                        >
                          {short}
                        </span>
                        <span
                          className="font-bold text-white/75"
                          style={{ fontSize: Math.max(7, Math.round(size * 0.13)) }}
                        >
                          {count}편
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Genre: tag cloud */}
          {genreStats.length > 0 && (
            <div>
              <p className={`text-[9px] font-bold ${textMuted} uppercase tracking-[0.15em] mb-4`}>주요 장르</p>
              <div className="flex flex-wrap gap-2 items-baseline">
                {genreStats.map(([name, count]) => {
                  const ratio    = count / genreStats[0][1];
                  const fontSize = Math.round(10 + ratio * 9);     // 10–19px
                  const py       = Math.round(3  + ratio * 5);     // 3–8px
                  const px       = Math.round(9  + ratio * 9);     // 9–18px
                  return (
                    <span
                      key={name}
                      title={`${name} · ${count}편`}
                      className={`rounded-full font-bold cursor-default transition-all duration-200 hover:scale-105 ${
                        isDarkMode
                          ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                          : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                      }`}
                      style={{ fontSize, paddingTop: py, paddingBottom: py, paddingLeft: px, paddingRight: px }}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
