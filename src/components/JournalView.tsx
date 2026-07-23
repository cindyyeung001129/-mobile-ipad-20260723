import { useState, useMemo, useEffect, useRef } from 'react';
import { CheckInRecord } from '../types';
import { playClickSound, speakText, playSuccessChime } from '../utils/audio';
import { PRESET_TAGS } from '../moodsData';
import { 
  Volume2, 
  Trash2, 
  Calendar, 
  Smile, 
  Frown, 
  Plus, 
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Edit2,
  FileText,
  Lock,
  Users,
  Check,
  Search,
  ArrowLeft
} from 'lucide-react';

interface JournalViewProps {
  records: CheckInRecord[];
  onDeleteRecord: (id: string) => void;
  onAddCustomRecord: (record: CheckInRecord) => void;
  onUpdateRecord: (record: CheckInRecord) => void;
  isIpad?: boolean;
}

export default function JournalView({
  records,
  onDeleteRecord,
  onAddCustomRecord,
  onUpdateRecord,
  isIpad = false
}: JournalViewProps) {
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [moodFilter, setMoodFilter] = useState<'all' | 'positive' | 'heavy'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  
  // Custom manual record (補記) modal state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('😊');
  const [customLabel, setCustomLabel] = useState('開心');
  const [customReason, setCustomReason] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customDate, setCustomDate] = useState('2026-07-14');
  const [customShareTargets, setCustomShareTargets] = useState<string[]>([]); // default empty (private)

  // Calendar Popup Modal states
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState('2026-07');
  const [highlightedDay, setHighlightedDay] = useState<number | null>(null);

  // Dedicated Journal Detail view states
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<CheckInRecord | null>(null);
  const [isDetailPlaying, setIsDetailPlaying] = useState(false);
  const [detailWaveHeights, setDetailWaveHeights] = useState<number[]>([14, 8, 22, 12, 28, 16, 10, 24, 18, 12, 20, 8, 14, 18, 10, 22, 14, 8]);
  const detailAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: any;
    if (isDetailPlaying) {
      interval = setInterval(() => {
        setDetailWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 26) + 6));
      }, 100);
    } else {
      setDetailWaveHeights([14, 8, 22, 12, 28, 16, 10, 24, 18, 12, 20, 8, 14, 18, 10, 22, 14, 8]);
    }
    return () => clearInterval(interval);
  }, [isDetailPlaying]);

  // Clean up audio when detail record changes or closes
  useEffect(() => {
    if (detailAudioRef.current) {
      try {
        detailAudioRef.current.pause();
      } catch (err) {}
      detailAudioRef.current = null;
    }
    setIsDetailPlaying(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [selectedRecordDetail]);

  // Expanded cards tracking state
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Editing records state
  const [editingRecord, setEditingRecord] = useState<CheckInRecord | null>(null);
  const [editEmoji, setEditEmoji] = useState('😊');
  const [editLabel, setEditLabel] = useState('開心');
  const [editReason, setEditReason] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editShareTargets, setEditShareTargets] = useState<string[]>([]);

  // Generate list of available months in records + current month
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add('2026-07');
    records.forEach((r) => {
      if (r.date) {
        months.add(r.date.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [records]);

  // Filter records based on selected month and emotional type
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (selectedDateFilter) {
          return r.date === selectedDateFilter;
        }
        const matchesMonth = r.date.startsWith(selectedMonth);
        const matchesType =
          moodFilter === 'all' ||
          (moodFilter === 'positive' && r.moodType === 'positive') ||
          (moodFilter === 'heavy' && r.moodType === 'heavy');
        return matchesMonth && matchesType;
      })
      .sort((a, b) => b.timestamp - a.timestamp); // newest first
  }, [records, selectedMonth, moodFilter, selectedDateFilter]);

  const handleSpeakEntry = (r: CheckInRecord) => {
    const weekdayName = getWeekdayName(r.date);
    const dateText = r.date.split('-');
    const shareText = !r.shareTargets || r.shareTargets.length === 0 
      ? '此日記設定為僅自己可見。' 
      : `此日記已分享給：${r.shareTargets.map(t => t === 'teacher' ? '老師' : t === 'socialworker' ? '社工' : '家長').join('、')}。`;

    const speakStr = `${dateText[1]}月${dateText[2]}日 ${weekdayName}，你記錄了「${r.moodLabel}」心情。${
      r.reason ? `原因：${r.reason}` : '你沒有寫下特別的原因。'
    } ${r.tags.length > 0 ? `標籤包括：${r.tags.join('、')}` : ''} ${shareText}`;
    speakText(speakStr);
  };

  const getWeekdayName = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      return days[date.getDay()];
    } catch (e) {
      return '星期二';
    }
  };

  const handleCreateCustomRecord = () => {
    if (!customReason.trim()) {
      alert('請填寫心情原因或感受');
      return;
    }
    const isPositive = ['😊', '😌', '😲'].includes(customEmoji);
    const newRec: CheckInRecord = {
      id: Math.random().toString(36).substring(2),
      date: customDate,
      time: '12:00',
      moodEmoji: customEmoji,
      moodLabel: customLabel,
      moodType: isPositive ? 'positive' : 'heavy',
      reason: customReason,
      tags: customTags,
      timestamp: new Date(`${customDate}T12:00:00`).getTime(),
      shareTargets: customShareTargets
    };
    onAddCustomRecord(newRec);
    playSuccessChime();
    setIsAddingCustom(false);
    
    // Reset fields
    setCustomReason('');
    setCustomTags([]);
    setCustomShareTargets([]);
  };

  // Toggle card expansion
  const toggleExpand = (id: string) => {
    playClickSound(450, 'sine');
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Open visual calendar modal
  const handleOpenCalendarForDate = (dateStr: string) => {
    playClickSound(600, 'sine');
    const parts = dateStr.split('-');
    const yr = parts[0];
    const mn = parts[1];
    const dy = parts[2] ? Number(parts[2]) : 1;
    const viewMonth = `${yr}-${mn}`;
    setCalendarViewMonth(viewMonth);
    setSelectedMonth(viewMonth);
    setHighlightedDay(dy);
    setShowCalendarModal(true);
  };

  // Generate calendar grid memo
  const calendarDays = useMemo(() => {
    if (!calendarViewMonth || !calendarViewMonth.includes('-')) {
      return [];
    }
    const parts = calendarViewMonth.split('-');
    const yr = Number(parts[0]);
    const mn = Number(parts[1]);
    
    // Number of days in the month
    const totalDays = new Date(yr, mn, 0).getDate();
    // Starting day index (0 = Sunday, 1 = Monday, etc.)
    const firstDayIndex = new Date(yr, mn - 1, 1).getDay();

    const daysList = [];
    // Padding spaces
    for (let i = 0; i < firstDayIndex; i++) {
      daysList.push({ dayNum: null, dateStr: null });
    }
    // Days
    for (let d = 1; d <= totalDays; d++) {
      const formattedDay = String(d).padStart(2, '0');
      const formattedMonth = String(mn).padStart(2, '0');
      const dateStr = `${yr}-${formattedMonth}-${formattedDay}`;
      daysList.push({ dayNum: d, dateStr });
    }
    return daysList;
  }, [calendarViewMonth]);

  // Launch edit modal preloaded with the chosen record
  const handleStartEdit = (r: CheckInRecord) => {
    playClickSound(550, 'sine');
    setEditingRecord(r);
    setEditEmoji(r.moodEmoji);
    setEditLabel(r.moodLabel);
    setEditReason(r.reason);
    setEditTags(r.tags || []);
    setEditDate(r.date);
    setEditTime(r.time || '12:00');
    setEditShareTargets(r.shareTargets || []);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    if (!editReason.trim()) {
      alert('請填寫心情原因或感受');
      return;
    }

    const isPositive = ['😊', '😌', '😲'].includes(editEmoji);
    const updated: CheckInRecord = {
      ...editingRecord,
      date: editDate,
      time: editTime,
      moodEmoji: editEmoji,
      moodLabel: editLabel,
      moodType: isPositive ? 'positive' : 'heavy',
      reason: editReason,
      tags: editTags,
      timestamp: new Date(`${editDate}T${editTime}:00`).getTime(),
      shareTargets: editShareTargets
    };

    onUpdateRecord(updated);
    playSuccessChime();
    setEditingRecord(null);
  };

  const handleExportJournal = () => {
    playClickSound(620, 'sine');
    const title = `📅 2026年7月 心情日記導出報告\n`;
    const logs = filteredRecords.map((r, i) => {
      const shareStr = !r.shareTargets || r.shareTargets.length === 0 
        ? '僅自己可見' 
        : `已分享給：${r.shareTargets.map(t => t === 'teacher' ? '老師' : t === 'socialworker' ? '社工' : '家長').join('、')}`;
      return `【${i+1}】${r.date} (${getWeekdayName(r.date)}) ${r.time} \n心情：${r.moodEmoji} ${r.moodLabel}\n原因：${r.reason || '無'}\n分類標籤：${r.tags.join(', ') || '無'}\n分享範圍：${shareStr}\n`;
    }).join('\n');
    
    navigator.clipboard.writeText(title + logs)
      .then(() => {
        alert('✨ 成功複製日記報告！您可以將報告貼上給老師、輔導員或家長看喔！');
      })
      .catch(() => {
        alert('導出失敗，您的瀏覽器不支援複製到剪貼簿。');
      });
  };

  return (
    <div className="flex-1 flex flex-col p-1 space-y-3 overflow-hidden">
      {/* Top Title */}
      <div className="flex flex-row flex-nowrap items-center justify-between shrink-0 w-full mb-1">
        <div className="flex flex-row flex-nowrap items-center gap-1.5 shrink-0">
          <ClipboardList className="w-5.5 h-5.5 text-brand-moss shrink-0" />
          <h2 className="text-2xl font-black text-gray-800 font-sans tracking-tight whitespace-nowrap">我的日誌</h2>
        </div>
      </div>

      {/* Interactive Month & Filtering Bar - Perfectly grid-aligned */}
          <div className="grid grid-cols-4 gap-1.5 bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border-2 border-brand-sand shadow-xs w-full shrink-0">
        {/* Mood Calendar Button */}
        <button
          onClick={() => {
            playClickSound(600, 'sine');
            handleOpenCalendarForDate(selectedMonth + '-01');
          }}
          className="flex flex-row items-center justify-center gap-1 text-xs px-1.5 py-2 rounded-xl border border-brand-sage/40 bg-brand-sage/15 text-brand-moss hover:bg-brand-sage/30 transition cursor-pointer font-black active:scale-95 text-center shadow-2xs"
          style={{ minHeight: '38px' }}
          title="開啟月曆"
        >
          <span className="whitespace-nowrap">📅 月曆</span>
        </button>

        {/* Filter All */}
        <button
          onClick={() => {
            playClickSound(480, 'sine');
            setMoodFilter('all');
          }}
          className={`flex flex-row items-center justify-center gap-1 text-xs px-1.5 py-2 rounded-xl border transition cursor-pointer font-bold active:scale-95 text-center ${
            moodFilter === 'all'
              ? 'bg-brand-moss border-brand-moss text-white font-black shadow-2xs'
              : 'bg-white border-brand-sand text-gray-600 hover:bg-brand-sand/30'
          }`}
          style={{ minHeight: '38px' }}
        >
          <span className="whitespace-nowrap">全部</span>
        </button>

        {/* Filter Positive/Sunny */}
        <button
          onClick={() => {
            playClickSound(480, 'sine');
            setMoodFilter('positive');
          }}
          className={`flex flex-row items-center justify-center gap-1 text-xs px-1.5 py-2 rounded-xl border transition cursor-pointer font-bold active:scale-95 text-center ${
            moodFilter === 'positive'
              ? 'bg-amber-500 border-amber-500 text-white font-black shadow-2xs'
              : 'bg-white border-brand-sand text-gray-600 hover:bg-brand-sand/30'
          }`}
          style={{ minHeight: '38px' }}
        >
          <span className="whitespace-nowrap">☀️ 陽光</span>
        </button>

        {/* Filter Heavy/Rainy */}
        <button
          onClick={() => {
            playClickSound(480, 'sine');
            setMoodFilter('heavy');
          }}
          className={`flex flex-row items-center justify-center gap-1 text-xs px-1.5 py-2 rounded-xl border transition cursor-pointer font-bold active:scale-95 text-center ${
            moodFilter === 'heavy'
              ? 'bg-sky-600 border-sky-600 text-white font-black shadow-2xs'
              : 'bg-white border-brand-sand text-gray-600 hover:bg-brand-sand/30'
          }`}
          style={{ minHeight: '38px' }}
        >
          <span className="whitespace-nowrap">🌧️ 雨天</span>
        </button>
      </div>

      {/* Manual Backdate Entry Form Overlay Modal */}
      {isAddingCustom && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-brand-beige border-2 border-brand-sage w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh] scrollbar-none">
            <h3 className="text-base font-bold text-brand-moss border-b border-brand-sand pb-2">
              📝 補記往日心情
            </h3>
            
            <div className="space-y-3">
              {/* Date pick */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">選擇日期：</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-brand-sand bg-white"
                />
              </div>

              {/* Emoji pick */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">選擇心情：</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { e: '😊', l: '開心' },
                    { e: '😌', l: '平靜' },
                    { e: '😰', l: '焦慮' },
                    { e: '😢', l: '難過' },
                    { e: '😠', l: '憤怒' },
                    { e: '😨', l: '害怕' },
                    { e: '😣', l: '討厭' },
                    { e: '😲', l: '驚訝' }
                  ].map((x) => (
                    <button
                      key={x.l}
                      type="button"
                      onClick={() => {
                        setCustomEmoji(x.e);
                        setCustomLabel(x.l);
                        playClickSound(500, 'sine');
                      }}
                      className={`text-lg p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        customEmoji === x.e ? 'bg-brand-sage/20 border-brand-sage scale-105 font-bold' : 'bg-white border-brand-sand'
                      }`}
                    >
                      {x.e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">寫下發生什麼事：</label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="寫低感受..."
                  className="w-full text-xs p-2 rounded-xl border border-brand-sand bg-white h-20 outline-none resize-none"
                  maxLength={150}
                />
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">快速標籤 (選填)：</label>
                <div className="flex flex-wrap gap-1">
                  {PRESET_TAGS.slice(0, 5).map((t) => {
                    const isSel = customTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          if (isSel) setCustomTags(customTags.filter(x => x !== t));
                          else setCustomTags([...customTags, t]);
                          playClickSound(480, 'sine');
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-full border cursor-pointer font-bold ${
                          isSel ? 'bg-brand-sage text-white border-brand-sage' : 'bg-white border-brand-sand text-gray-600'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Share Targets Selection */}
              <div className="space-y-1 pt-1.5 border-t border-brand-sand/40">
                <label className="text-xs font-bold text-gray-600 block">選擇分享對象 (預設為僅自己可見)：</label>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { id: 'teacher', label: '老師', emoji: '🏫' },
                    { id: 'socialworker', label: '社工', emoji: '💬' },
                    { id: 'parent', label: '家長', emoji: '🏡' }
                  ].map((target) => {
                    const isSelected = customShareTargets.includes(target.id);
                    return (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => {
                          playClickSound(480, 'sine');
                          if (isSelected) {
                            setCustomShareTargets(customShareTargets.filter(t => t !== target.id));
                          } else {
                            setCustomShareTargets([...customShareTargets, target.id]);
                          }
                        }}
                        className={`text-xs p-1.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-brand-sage/20 border-brand-sage text-brand-moss font-bold'
                            : 'bg-white border-brand-sand text-gray-600 hover:bg-brand-sand/30'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        <span>{target.emoji}</span>
                        <span className="text-[10px] mt-0.5">{target.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-500 font-medium italic mt-1 text-center">
                  {customShareTargets.length === 0 ? '🔒 當前設定：僅自己可見' : `👥 已選分享給：${customShareTargets.map(t => t === 'teacher' ? '老師' : t === 'socialworker' ? '社工' : '家長').join('、')}`}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddingCustom(false)}
                className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleCreateCustomRecord}
                className="flex-1 py-2 rounded-xl bg-brand-sage text-white text-xs font-bold transition cursor-pointer"
              >
                儲存記錄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Diary Entry Overlay Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-brand-beige border-2 border-brand-sage w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh] scrollbar-none">
            <h3 className="text-base font-bold text-brand-moss border-b border-brand-sand pb-2">
              ✏️ 編輯 / 補寫心情日記
            </h3>
            
            <div className="space-y-3">
              {/* Date & Time picks */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500">日期：</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-brand-sand bg-white font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500">時間：</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-brand-sand bg-white font-bold"
                  />
                </div>
              </div>

              {/* Emoji pick */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">更換心情：</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { e: '😊', l: '開心' },
                    { e: '😌', l: '平靜' },
                    { e: '😰', l: '焦慮' },
                    { e: '😢', l: '難過' },
                    { e: '😠', l: '憤怒' },
                    { e: '😨', l: '害怕' },
                    { e: '😣', l: '討厭' },
                    { e: '😲', l: '驚訝' }
                  ].map((x) => (
                    <button
                      key={x.l}
                      type="button"
                      onClick={() => {
                        setEditEmoji(x.e);
                        setEditLabel(x.l);
                        playClickSound(500, 'sine');
                      }}
                      className={`text-lg p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        editEmoji === x.e ? 'bg-brand-sage/20 border-brand-sage scale-105 font-bold' : 'bg-white border-brand-sand'
                      }`}
                    >
                      {x.e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Supplement text */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">補充文字 / 編輯感言：</label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="補充更多想法或寫低今日發生咩事..."
                  className="w-full text-xs p-2 rounded-xl border border-brand-sand bg-white h-24 outline-none resize-none font-sans leading-relaxed"
                  maxLength={150}
                />
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">主題標籤 (選填)：</label>
                <div className="flex flex-wrap gap-1">
                  {PRESET_TAGS.map((t) => {
                    const isSel = editTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          if (isSel) setEditTags(editTags.filter(x => x !== t));
                          else setEditTags([...editTags, t]);
                          playClickSound(480, 'sine');
                        }}
                        className={`text-[10px] px-2 py-1 rounded-full border cursor-pointer font-bold ${
                          isSel ? 'bg-brand-sage text-white border-brand-sage' : 'bg-white border-brand-sand text-gray-600'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Share Targets Selection */}
              <div className="space-y-1 pt-1.5 border-t border-brand-sand/40">
                <label className="text-xs font-bold text-gray-600 block">分享對象 (預設為僅自己可見)：</label>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { id: 'teacher', label: '老師', emoji: '🏫' },
                    { id: 'socialworker', label: '社工', emoji: '💬' },
                    { id: 'parent', label: '家長', emoji: '🏡' }
                  ].map((target) => {
                    const isSelected = editShareTargets.includes(target.id);
                    return (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => {
                          playClickSound(480, 'sine');
                          if (isSelected) {
                            setEditShareTargets(editShareTargets.filter(t => t !== target.id));
                          } else {
                            setEditShareTargets([...editShareTargets, target.id]);
                          }
                        }}
                        className={`text-xs p-1.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-brand-sage/20 border-brand-sage text-brand-moss font-bold'
                            : 'bg-white border-brand-sand text-gray-600 hover:bg-brand-sand/30'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        <span>{target.emoji}</span>
                        <span className="text-[10px] mt-0.5">{target.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-500 font-medium italic mt-1 text-center">
                  {editShareTargets.length === 0 ? '🔒 當前設定：僅自己可見' : `👥 已選分享給：${editShareTargets.map(t => t === 'teacher' ? '老師' : t === 'socialworker' ? '社工' : '家長').join('、')}`}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-xl bg-brand-sage text-white text-xs font-bold transition cursor-pointer"
              >
                儲存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal Scrollable Timeline (Hugs the bottom, scrolls infinitely) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 relative scrollbar-thin">
        {selectedDateFilter && (
          <div className="flex items-center justify-between bg-brand-sage/10 border-2 border-brand-sage/30 rounded-2xl p-2.5 px-3.5 text-xs text-brand-moss shrink-0 font-bold shadow-xs animate-fadeIn">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📅</span>
              <span>已篩選日期：<span className="font-extrabold text-gray-800">{selectedDateFilter.replace('-', '年').replace('-', '月')}日</span></span>
            </div>
            <button
              onClick={() => {
                playClickSound(400, 'sine');
                setSelectedDateFilter(null);
              }}
              className="bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-600 px-2 py-1 rounded-lg border border-brand-sand transition cursor-pointer font-extrabold text-[11px]"
            >
              清除篩選 ✕
            </button>
          </div>
        )}

        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white/40 rounded-3xl border border-dashed border-brand-sand">
            <span className="text-4xl block mb-2 opacity-60">🍃</span>
            <p className="text-base font-bold text-gray-800">
              {selectedDateFilter ? '這天還沒有心情日記紀錄喔' : '這個月份還沒有心情日記喔'}
            </p>
            <p className="text-sm font-semibold text-brand-moss mt-1.5">
              {selectedDateFilter 
                ? '您可以點擊「清除篩選」查看本月其他日誌。' 
                : '點擊「首頁」大按鈕，開始進行你今天的心情記錄吧！'}
            </p>
            {selectedDateFilter && (
              <button
                onClick={() => {
                  playClickSound(400, 'sine');
                  setSelectedDateFilter(null);
                }}
                className="mt-4 inline-flex items-center gap-1 text-xs px-3.5 py-1.5 rounded-xl bg-brand-sage text-white font-extrabold shadow-sm hover:bg-brand-sage/90 transition cursor-pointer"
              >
                <span>顯示全部日誌</span>
              </button>
            )}
          </div>
        ) : (
          <div className={isIpad ? "grid grid-cols-2 gap-4 py-2" : "relative pl-5 border-l-2 border-brand-sage/30 ml-2.5 space-y-4 py-2"}>
            {filteredRecords.map((r) => {
              const dateParts = r.date.split('-');
              const dayStr = dateParts[2];
              const monthStr = dateParts[1];
              const weekdayStr = getWeekdayName(r.date);
              const isExpanded = !!expandedIds[r.id];

              // Check if shared
              const isShared = r.shareTargets && r.shareTargets.length > 0;

              return (
                <div 
                  key={r.id} 
                  onClick={() => {
                    playClickSound(450, 'sine');
                    setSelectedRecordDetail(r);
                  }}
                  className="relative group cursor-pointer"
                >
                  {/* Timeline node marker for mobile list view */}
                  {!isIpad && (
                    <div className="absolute -left-[26px] top-5 w-3.5 h-3.5 rounded-full bg-brand-sage border-2 border-brand-beige group-hover:scale-125 transition duration-200" />
                  )}

                  {/* Log Round-Corner Card */}
                  <div className="bg-white hover:bg-brand-sand/15 active:scale-[0.98] rounded-2xl p-4 shadow-xs border border-brand-sand/60 hover:border-brand-sage/40 transition duration-200 space-y-2.5">
                    
                    {/* Top Row: Date, Weekday & Time Stamp */}
                    <div className="flex flex-row flex-nowrap items-center justify-between border-b border-brand-sand/50 pb-2">
                      <div className="flex flex-row flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-brand-moss bg-brand-sand/45 px-2.5 py-1 rounded-xl font-sans">
                          {parseInt(monthStr)}月{parseInt(dayStr)}日
                        </span>
                        <span className="text-xs font-extrabold text-gray-500 font-sans">
                          {weekdayStr}
                        </span>
                        <span className="text-xs font-bold text-gray-400 font-mono flex items-center gap-0.5">
                          <span>🕒</span>
                          <span>{r.time}</span>
                        </span>
                      </div>
                      
                      {/* Shared state icon */}
                      {isShared && (
                        <span className="text-[10px] bg-brand-sage/10 text-brand-moss px-2 py-0.5 rounded-full border border-brand-sage/20 font-bold">
                          👥 已分享
                        </span>
                      )}
                    </div>

                    {/* Middle Row: Mood info */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl filter drop-shadow-xs">{r.moodEmoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-black text-gray-800">
                            {r.moodLabel}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              r.moodType === 'positive' ? 'bg-emerald-400' : 'bg-brand-terracotta'
                            }`}
                          />
                        </div>
                        {/* Text preview */}
                        {r.reason ? (
                          <p className="text-xs font-semibold text-gray-500 line-clamp-1 mt-1">
                            {r.reason}
                          </p>
                        ) : (
                          <p className="text-xs italic text-gray-400 mt-1">無文字紀錄，僅打卡心情</p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Tags */}
                    {r.tags && r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {r.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] bg-brand-sage/10 text-brand-moss px-2 py-0.5 rounded-full border border-brand-sage/15 font-black"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Month-View Calendar Modal Overlay */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] border-2 border-brand-sage w-full max-w-sm rounded-[32px] p-5 shadow-2xl space-y-4 overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-sand/60 pb-2.5 shrink-0">
              <h3 className="text-[17px] font-black text-brand-moss flex items-center gap-1.5 font-sans">
                <Calendar className="w-5 h-5 text-brand-moss" />
                <span>日記月曆</span>
              </h3>
              <button
                onClick={() => {
                  playClickSound(450, 'sine');
                  setShowCalendarModal(false);
                }}
                className="text-xs font-black text-gray-500 hover:text-black hover:bg-brand-sand/30 bg-white border border-brand-sand/70 px-2.5 py-1.5 rounded-xl cursor-pointer transition active:scale-95"
              >
                關閉
              </button>
            </div>

            {/* Month Switcher Controls */}
            <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-2xl border-2 border-brand-sand/50 shrink-0">
              <button
                onClick={() => {
                  playClickSound(450, 'sine');
                  const parts = calendarViewMonth.split('-');
                  const yr = Number(parts[0]);
                  const mn = Number(parts[1]);
                  const prevMonth = mn === 1 ? 12 : mn - 1;
                  const prevYear = mn === 1 ? yr - 1 : yr;
                  const newMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
                  setCalendarViewMonth(newMonth);
                  setSelectedMonth(newMonth);
                  setHighlightedDay(null);
                }}
                className="text-brand-moss hover:bg-brand-sand/30 p-2 rounded-xl cursor-pointer font-black transition text-sm active:scale-90"
              >
                ◀
              </button>
              <span className="text-[15px] font-black text-gray-800 font-sans">
                📅 {calendarViewMonth.split('-')[0]}年{parseInt(calendarViewMonth.split('-')[1])}月
              </span>
              <button
                onClick={() => {
                  playClickSound(450, 'sine');
                  const parts = calendarViewMonth.split('-');
                  const yr = Number(parts[0]);
                  const mn = Number(parts[1]);
                  const nextMonth = mn === 12 ? 1 : mn + 1;
                  const nextYear = mn === 12 ? yr + 1 : yr;
                  const newMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
                  setCalendarViewMonth(newMonth);
                  setSelectedMonth(newMonth);
                  setHighlightedDay(null);
                }}
                className="text-brand-moss hover:bg-brand-sand/30 p-2 rounded-xl cursor-pointer font-black transition text-sm active:scale-90"
              >
                ▶
              </button>
            </div>

            {/* Days Grid Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
              <div className="grid grid-cols-7 gap-1.5 text-center font-sans">
                {/* Weekday headers */}
                {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
                  <span
                    key={day}
                    className={`text-xs font-black py-1 ${
                      idx === 0 ? 'text-brand-terracotta' : idx === 6 ? 'text-brand-moss' : 'text-gray-500'
                    }`}
                  >
                    {day}
                  </span>
                ))}

                {/* Day cells */}
                {calendarDays.map((cell, idx) => {
                  if (!cell.dayNum || !cell.dateStr) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const isHighlighted = highlightedDay === cell.dayNum;
                  const dayRecs = records.filter((r) => r.date === cell.dateStr);
                  const hasRecord = dayRecs.length > 0;
                  const latestRec = dayRecs[dayRecs.length - 1];

                  let cellBg = 'bg-white hover:bg-brand-sand/20 border-brand-sand/50';
                  if (hasRecord) {
                    cellBg = latestRec.moodType === 'positive'
                      ? 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200'
                      : 'bg-rose-50 hover:bg-rose-100/70 border-rose-200';
                  }

                  if (isHighlighted) {
                    cellBg = 'bg-brand-sage text-white border-brand-sage ring-2 ring-brand-sage/40 ring-offset-1';
                  }

                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => {
                        playClickSound(500, 'sine');
                        setHighlightedDay(cell.dayNum);
                      }}
                      className={`aspect-square rounded-2xl border flex flex-col items-center justify-between p-1 cursor-pointer transition-all duration-150 relative ${cellBg}`}
                    >
                      <span className={`text-[11px] font-black ${isHighlighted ? 'text-white' : 'text-gray-700'}`}>
                        {cell.dayNum}
                      </span>
                      {hasRecord && (
                        <span className="text-base leading-none mb-0.5 filter drop-shadow-xs">
                          {latestRec.moodEmoji}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Clicked day records detail panel */}
              {highlightedDay && (
                <div className="bg-white rounded-2xl p-3 border-2 border-brand-sand shadow-sm space-y-2.5 animate-fadeIn text-left">
                  <div className="flex items-center justify-between border-b border-brand-sand pb-1.5">
                    <span className="text-[13px] font-black text-brand-moss flex items-center gap-1">
                      🌱 {parseInt(calendarViewMonth.split('-')[1])}月{highlightedDay}日
                    </span>
                    <span className="text-[10px] font-extrabold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {records.filter(r => r.date === `${calendarViewMonth}-${String(highlightedDay).padStart(2, '0')}`).length} 條記錄
                    </span>
                  </div>

                  {records.filter(r => r.date === `${calendarViewMonth}-${String(highlightedDay).padStart(2, '0')}`).length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-3 text-center font-bold">這天還沒有寫日記紀錄喔 🍃</p>
                  ) : (
                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-0.5 scrollbar-thin">
                      {records
                        .filter(r => r.date === `${calendarViewMonth}-${String(highlightedDay).padStart(2, '0')}`)
                        .sort((a,b) => b.timestamp - a.timestamp)
                        .map((r) => (
                          <div key={r.id} className="text-xs space-y-1.5 bg-[#FAF6F0] p-2.5 rounded-2xl border border-brand-sand">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-black text-gray-800">
                                <span className="text-lg">{r.moodEmoji}</span>
                                <span className="text-xs">{r.moodLabel}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">🕒 {r.time}</span>
                            </div>
                            
                            {r.reason && (
                              <p className="text-[11px] font-semibold text-gray-600 bg-white p-2 rounded-xl border border-dashed border-brand-sand leading-relaxed">
                                {r.reason}
                              </p>
                            )}

                            {r.tags && r.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {r.tags.map(t => (
                                  <span key={t} className="text-[9px] bg-brand-sage/10 text-brand-moss px-2 py-0.5 rounded-full border border-brand-sage/25 font-black">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Filter main list by this day button */}
                  <button
                    onClick={() => {
                      playClickSound(550, 'sine');
                      const targetDate = `${calendarViewMonth}-${String(highlightedDay).padStart(2, '0')}`;
                      setSelectedDateFilter(targetDate);
                      setSelectedMonth(calendarViewMonth); // update main list month selection to match calendar month
                      setShowCalendarModal(false); // close the calendar modal
                    }}
                    className="w-full mt-1 bg-brand-moss hover:bg-brand-moss/90 text-white font-extrabold text-xs py-2 px-3 rounded-xl border border-brand-moss/10 hover:shadow-md transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>在日誌清單中篩選查看此日 ({parseInt(calendarViewMonth.split('-')[1])}月{highlightedDay}日)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 專門的日誌詳情頁面 */}
      {selectedRecordDetail && (() => {
        const r = selectedRecordDetail;
        const dateParts = r.date.split('-');
        const monthStr = dateParts[1];
        const dayStr = dateParts[2];
        const weekdayStr = getWeekdayName(r.date);
        const isShared = r.shareTargets && r.shareTargets.length > 0;

        return (
          <div className="absolute inset-0 bg-brand-beige z-40 flex flex-col animate-slideUp overflow-hidden">
            {/* Header */}
            <div className="bg-white px-4 pt-10 pb-3.5 border-b-2 border-brand-sand flex items-center justify-between shrink-0 shadow-xs">
              <button
                onClick={() => {
                  playClickSound(400, 'sine');
                  setSelectedRecordDetail(null);
                }}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-brand-sand/40 text-brand-moss hover:bg-brand-sand/70 transition font-black cursor-pointer"
                style={{ minHeight: '34px' }}
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>返回日誌</span>
              </button>
              <h3 className="text-sm sm:text-base font-black text-gray-800">📖 心情日記詳情</h3>
              <div className="w-[70px]" /> {/* spacing balance */}
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              
              {/* Combined Compact Date, Time & Mood Display Card */}
              <div className="bg-white p-4 rounded-2xl border-2 border-brand-sand/60 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-5xl filter drop-shadow-sm transform hover:scale-110 transition duration-300 select-none">
                    {r.moodEmoji}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-black text-gray-800">{r.moodLabel}</h4>
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        r.moodType === 'positive' ? 'bg-emerald-400' : 'bg-brand-terracotta'
                      }`} />
                    </div>
                    <p className="text-xs text-gray-500 font-bold mt-0.5">
                      {r.moodType === 'positive' ? '正向心情' : '低沉心情'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-xs font-black text-brand-moss bg-brand-sand/40 px-3 py-1 rounded-xl font-sans inline-block">
                    {parseInt(monthStr)}月{parseInt(dayStr)}日（{weekdayStr}）
                  </span>
                  <p className="text-xs text-gray-400 font-mono font-bold mt-1.5">
                    🕒 {r.time}
                  </p>
                </div>
              </div>

              {/* Text Diary Content Card */}
              <div className="bg-white p-4.5 rounded-2xl border-2 border-brand-sand/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-brand-moss bg-brand-sage/10 px-2.5 py-1 rounded-lg border border-brand-sage/20">
                    ✍️ 文字內容
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound(550, 'sine');
                      const dateParts = r.date.split('-');
                      const dayStr = parseInt(dateParts[2]);
                      const monthStr = parseInt(dateParts[1]);
                      const textToRead = `${monthStr}月${dayStr}日，心情是${r.moodLabel}。${r.reason ? '日記內容：' + r.reason : '今天沒有寫字，只有記錄心情。'}`;
                      speakText(textToRead);
                    }}
                    className="flex items-center gap-1 text-[11px] font-black text-brand-moss bg-brand-sand/40 hover:bg-brand-sand px-2.5 py-1 rounded-full border border-brand-sand transition cursor-pointer active:scale-95 shadow-2xs"
                    title="粵語朗讀日誌內容"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-brand-moss" />
                    <span>粵語朗讀</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base font-bold text-gray-700 leading-relaxed pt-2 whitespace-pre-wrap font-sans">
                  {r.reason || '今天沒有留下文字，只打卡了心情。'}
                </p>
              </div>

              {/* Voice Player Bento Card (出現聲音波紋條條 + 點擊試聽真的有聲音) */}
              {r.voiceAudioUrl ? (
                <div className="bg-brand-sand/20 p-4 rounded-2xl border-2 border-brand-sand/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-brand-moss bg-brand-sage/20 px-2.5 py-1 rounded-lg">
                      🎙️ 語音記錄
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound(500, 'sine');
                        if (isDetailPlaying) {
                          setIsDetailPlaying(false);
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                          }
                          return;
                        }

                        setIsDetailPlaying(true);

                        if (r.voiceAudioUrl !== 'tts-fallback') {
                          const audio = new Audio(r.voiceAudioUrl);
                          audio.play().then(() => {
                            audio.onended = () => {
                              setIsDetailPlaying(false);
                            };
                          }).catch(err => {
                            console.warn("Detail audio play blocked, using fallback:", err);
                            speakText(r.reason || '今天心情好特別！');
                            setTimeout(() => {
                              setIsDetailPlaying(false);
                            }, 4000);
                          });
                        } else {
                          speakText(r.reason || '今天心情好特別！');
                          setTimeout(() => {
                            setIsDetailPlaying(false);
                          }, 4000);
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition active:scale-95 flex items-center gap-1.5 shadow-sm ${
                        isDetailPlaying 
                          ? 'bg-rose-500 text-white hover:bg-rose-600' 
                          : 'bg-brand-sage text-white hover:bg-brand-moss'
                      }`}
                      style={{ minHeight: '32px' }}
                    >
                      <span>{isDetailPlaying ? '⏹ 停止播放' : '▶ 播放錄音'}</span>
                    </button>
                  </div>

                  {/* Waveform Visualizer (聲音波紋條條) */}
                  <div className="bg-white/80 border border-brand-sand/50 py-3 rounded-xl flex flex-col items-center justify-center gap-1.5">
                    <div className="flex items-end gap-[3px] h-7">
                      {detailWaveHeights.map((h, idx) => (
                        <div
                          key={idx}
                          className={`w-[2.5px] rounded-full transition-all duration-100 ${
                            isDetailPlaying ? 'bg-brand-sage animate-pulse' : 'bg-brand-sand'
                          }`}
                          style={{ height: `${h * 0.8}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-mono tracking-wider font-extrabold">
                      {isDetailPlaying ? 'PLAYING AUDIO...' : 'RECORDED VOICE'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 text-center py-5">
                  <span className="text-xl">🔇</span>
                  <p className="text-xs font-bold text-gray-400 mt-1">此篇日記無語音錄音</p>
                </div>
              )}

              {/* Tags & Categories List */}
              {r.tags && r.tags.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border-2 border-brand-sand/60 shadow-xs space-y-2">
                  <span className="text-xs font-extrabold text-gray-400 block">生活範疇標籤</span>
                  <div className="flex flex-wrap gap-1.5">
                    {r.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-brand-sage/10 text-brand-moss px-3 py-1 rounded-full border border-brand-sage/15 font-black"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}



            </div>
          </div>
        );
      })()}
    </div>
  );
}
