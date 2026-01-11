
import React, { useState } from 'react';
import { GhibliProject, Scene, CharacterDesign, BackgroundDesign, ModuleType } from '../types';
import { generateStoryFramework, breakIntoScenes, suggestAssetsFromScenes, translateSEO, generateGhibliAesthetic, optimizeBackgroundsAnalysis } from '../services/geminiService';

interface StoryModuleProps {
  project: GhibliProject;
  onUpdate: (updates: Partial<GhibliProject>) => void;
  onModuleChange: (module: ModuleType) => void;
}

type StoryTab = 'STORY_SEO' | 'SHOTS';

const StoryModule: React.FC<StoryModuleProps> = ({ project, onUpdate, onModuleChange }) => {
  const [activeTab, setActiveTab] = useState<StoryTab>('STORY_SEO');
  
  const [idea, setIdea] = useState('');
  const [manualStory, setManualStory] = useState('');
  const [mainCharName, setMainCharName] = useState('');
  const [type, setType] = useState('Cuộc sống Đồng quay yên bình');
  const [length, setLength] = useState('Ngắn');
  const [customLength, setCustomLength] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBreakingScenes, setIsBreakingScenes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeInputMode, setActiveInputMode] = useState<'ai' | 'manual'>('ai');
  
  const [seoLang, setSeoLang] = useState<'vi' | 'en' | 'jp'>('vi');
  const [translatedSeo, setTranslatedSeo] = useState<any>(null);
  const [translating, setTranslating] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const ghibliThemes = [
    'Cuộc sống Đồng quê yên bình',
    'Hành trình Tuổi trưởng thành',
    'Thiên nhiên & Linh hồn Rừng xanh',
    'Vùng đất Phép thuật & Bí ẩn',
    'Lâu đài Bay & Công nghệ Cổ điển',
    'Tình yêu, Hoài niệm & Thành phố Biển',
    'Đại dương xanh & Điều kỳ diệu',
    'Thế giới Tí hon dưới sàn nhà',
    'Phép màu giữa đời thường'
  ];

  const handleGenerateStory = async () => {
    setLoading(true);
    setError(null);
    setTranslatedSeo(null);
    setSeoLang('vi');
    try {
      const finalLength = length === 'Tùy chọn' ? customLength : length;
      const framework = await generateStoryFramework(idea, type, finalLength);
      const aesthetic = await generateGhibliAesthetic(framework, type);
      onUpdate({ story: framework, scenes: null, coreAesthetic: aesthetic }); 
    } catch (error: any) {
      console.error(error);
      setError("Giới hạn lưu lượng hoặc lỗi API. Vui lòng đợi giây lát và thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateSeo = async (lang: 'vi' | 'en' | 'jp') => {
    if (!project.story) return;
    if (lang === 'vi') {
      setTranslatedSeo(null);
      setSeoLang('vi');
      return;
    }
    
    setTranslating(true);
    setSeoLang(lang);
    try {
      const data = {
        titles: project.story.suggestedTitles,
        summary: project.story.summary,
        hashtags: project.story.hashtags
      };
      const result = await translateSEO(data, lang === 'en' ? 'English' : 'Japanese');
      setTranslatedSeo(result);
    } catch (err) {
      console.error(err);
      setError("Lỗi dịch thuật. Vui lòng thử lại.");
    } finally {
      setTranslating(false);
    }
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyAllShots = () => {
    if (!project.scenes) return;
    const text = project.scenes.map(s => (
      `[SHOT ${s.globalShotNumber}]\n` +
      `Bối cảnh: ${s.location} (${s.location_en})\n` +
      `Thời điểm: ${s.timeOfDay}\n` +
      `Thời lượng: ${s.duration}s | Góc quay: ${s.suggestedShotType}\n` +
      `Diễn biến: ${s.action}\n` +
      `Mô tả tiếng Anh: ${s.action_en}\n` +
      `Chuyển động (Motion): ${s.motionNotes}\n` +
      `Âm thanh (Audio): ${s.soundNotes}\n` +
      `Ghi chú hình ảnh: ${s.visualNotes}\n` +
      `--------------------------------------------------`
    )).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedSection('all-shots');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const processBreakIntoScenes = async (frameworkData: any) => {
    setIsBreakingScenes(true);
    setError(null);
    try {
      const finalLength = length === 'Tùy chọn' ? customLength : length;
      const breakData = await breakIntoScenes(frameworkData, type, finalLength);
      const formattedScenes = (breakData.scenes || []).map((s: any, idx: number) => ({ 
        ...s, 
        id: `shot-${idx}-${Date.now()}`,
        globalShotNumber: idx + 1
      }));
      
      // TỰ ĐỘNG PHÂN TÍCH TỐI ƯU BỐI CẢNH NGAY LẬP TỨC
      const optimization = await optimizeBackgroundsAnalysis(formattedScenes);
      const suggestions = await suggestAssetsFromScenes(formattedScenes);
      
      const suggestedChars: CharacterDesign[] = (suggestions?.characters || []).map((c: any) => ({
        id: `char-suggest-${Math.random()}`,
        name: c.name,
        name_en: c.name_en || c.name,
        age: c.age || '?',
        personality: c.personality || '',
        personality_en: c.personality_en || '',
        description: c.description || '',
        description_en: c.description_en || '',
        clothingStyle: 'Đang chờ thiết kế'
      }));

      // SỬ DỤNG BỐI CẢNH ĐÃ ĐƯỢC TỐI ƯU TỪ AI
      const masterBgs: BackgroundDesign[] = optimization.master_backgrounds.map((m: any) => ({
        id: `master-${m.id}`,
        location: m.name,
        location_en: m.name_en,
        timeOfDay: 'Ban ngày',
        weather: 'Clear',
        season: 'Summer',
        description: m.description,
        description_en: m.description,
        palette: ['#E6E2D3', '#7C9473'],
        isMaster: true,
        reuse_count: m.reuse_count,
        associatedScenes: m.scenes
      }));

      onUpdate({ 
        scenes: formattedScenes,
        characters: suggestedChars,
        backgrounds: masterBgs,
        optimizationAnalysis: optimization,
        suggestedPriorities: breakData.suggestedAnimationPriorities || []
      });
      setActiveTab('SHOTS');
    } catch (error: any) {
      console.error(error);
      setError("Có lỗi xảy ra khi phân tích cú máy và tối ưu bối cảnh. Vui lòng thử lại.");
    } finally {
      setIsBreakingScenes(false);
    }
  };

  const handleBreakFromManual = async () => {
    if (!manualStory) return;
    
    const manualBeats = manualStory
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const mockFramework = {
      logline: "Kịch bản tự biên soạn",
      theme: type,
      setting: "Chưa xác định",
      mainCharacter: mainCharName || "Protagonist",
      storyBeats: manualBeats,
      suggestedTitles: ["Chuyến phiêu lưu tự kể", "Mảnh ghép ký ức", "Lời thì thầm từ kịch bản"],
      hashtags: ["#manual_script", "#animation", "#storytelling"],
      summary: manualStory.substring(0, 200) + "..."
    };

    const aesthetic = await generateGhibliAesthetic(mockFramework, type);
    onUpdate({ story: mockFramework, scenes: null, coreAesthetic: aesthetic });
    
    await processBreakIntoScenes(mockFramework);
  };

  const handleBreakIntoScenes = async () => {
    if (!project.story) return;
    await processBreakIntoScenes(project.story);
  };

  const calculateTotalDuration = () => {
    if (!project.scenes) return 0;
    return project.scenes.reduce((acc, scene) => acc + (scene.duration || 0), 0);
  };

  const currentSeo = {
    titles: translatedSeo?.titles || project.story?.suggestedTitles || [],
    summary: translatedSeo?.summary || project.story?.summary || "",
    hashtags: translatedSeo?.hashtags || project.story?.hashtags || []
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-3xl flex items-center justify-between sticky top-4 z-50 ghibli-shadow">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Internal Module Tabs */}
      <div className="flex bg-[#f4ece1] p-1.5 rounded-3xl border border-[#e2d7c0] self-start ghibli-shadow max-w-max">
        <button 
          onClick={() => setActiveTab('STORY_SEO')}
          className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'STORY_SEO' ? 'bg-[#4a7c59] text-white' : 'text-[#8c7e6a] hover:bg-[#e2d7c0]'}`}
        >
          📖 Kịch bản & SEO
        </button>
        <button 
          onClick={() => setActiveTab('SHOTS')}
          disabled={!project.scenes}
          className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'SHOTS' ? 'bg-[#4a7c59] text-white' : 'text-[#8c7e6a] hover:bg-[#e2d7c0]'} disabled:opacity-40`}
        >
          🎬 Phân cảnh (Shots)
        </button>
      </div>

      {activeTab === 'STORY_SEO' && (
        <div className="space-y-8 animate-in slide-in-from-left duration-500">
          <section className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#5a4b3b]">1. Khởi tạo Câu chuyện</h2>
              <div className="flex bg-[#fdfaf3] p-1 rounded-2xl border border-[#e2d7c0]">
                <button onClick={() => setActiveInputMode('ai')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeInputMode === 'ai' ? 'bg-[#4a7c59] text-white' : 'text-[#8c7e6a]'}`}>Gợi ý AI</button>
                <button onClick={() => setActiveInputMode('manual')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeInputMode === 'manual' ? 'bg-[#4a7c59] text-white' : 'text-[#8c7e6a]'}`}>Tự soạn thảo</button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#8c7e6a] mb-2 uppercase tracking-wide">THỂ LOẠI (STYLE)</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[#fdfaf3] border border-[#e2d7c0] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]">
                    {ghibliThemes.map(theme => <option key={theme} value={theme}>{theme}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#8c7e6a] mb-2 uppercase tracking-wide">ĐỘ DÀI PHIM</label>
                  <div className="space-y-2">
                    <select value={length} onChange={(e) => setLength(e.target.value)} className="w-full bg-[#fdfaf3] border border-[#e2d7c0] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]">
                      <option value="Ngắn">Ngắn (2-3 phút)</option>
                      <option value="Trung bình">Trung bình (5-10 phút)</option>
                      <option value="Dài">Dài (15-20 phút)</option>
                      <option value="Tùy chọn">Tùy chỉnh...</option>
                    </select>
                    {length === 'Tùy chọn' && (
                      <input 
                        type="text"
                        placeholder="VD: 30 giây, 1 tiếng..."
                        value={customLength}
                        onChange={(e) => setCustomLength(e.target.value)}
                        className="w-full bg-white border border-[#4a7c59] rounded-2xl px-4 py-2 text-sm focus:outline-none animate-in slide-in-from-top-2 duration-300"
                      />
                    )}
                  </div>
                </div>
              </div>

              {activeInputMode === 'ai' ? (
                <div className="space-y-4">
                  <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ý tưởng của bạn..." className="w-full h-32 bg-[#fdfaf3] border border-[#e2d7c0] rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#4a7c59] resize-none" />
                  <button onClick={handleGenerateStory} disabled={loading || !idea || (length === 'Tùy chọn' && !customLength)} className="w-full py-4 bg-[#4a7c59] text-white rounded-3xl font-bold hover:bg-[#3d654a] disabled:opacity-50 transition-all ghibli-shadow">
                    {loading ? 'Đang sáng tạo...' : '✨ Tạo Khung sườn Câu chuyện'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input type="text" value={mainCharName} onChange={(e) => setMainCharName(e.target.value)} placeholder="Nhân vật chính..." className="w-full bg-[#fdfaf3] border border-[#e2d7c0] rounded-2xl px-4 py-3 focus:outline-none" />
                  <textarea value={manualStory} onChange={(e) => setManualStory(e.target.value)} placeholder="Nhập diễn biến từng dòng..." className="w-full h-48 bg-[#fdfaf3] border border-[#e2d7c0] rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#4a7c59] resize-none font-serif" />
                  <button onClick={handleBreakFromManual} disabled={isBreakingScenes || !manualStory} className="w-full py-4 bg-[#5a4b3b] text-white rounded-3xl font-bold hover:bg-[#4a3b2b] disabled:opacity-50 ghibli-shadow">
                    {isBreakingScenes ? 'Đang phân tích...' : '🎬 Chia kịch bản thành các Shot'}
                  </button>
                </div>
              )}
            </div>
          </section>

          {project.story && (
            <div className="space-y-8">
              <section className="bg-gradient-to-br from-[#ff0000]/5 to-[#ff0000]/10 p-8 rounded-[40px] border border-[#ff0000]/20 ghibli-shadow">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#b91c1c] flex items-center gap-2">🚀 YouTube SEO</h2>
                  <div className="flex bg-white/50 p-1 rounded-2xl">
                    {(['vi', 'en', 'jp'] as const).map(lang => (
                      <button key={lang} onClick={() => handleTranslateSeo(lang)} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase ${seoLang === lang ? 'bg-[#b91c1c] text-white' : 'text-[#8c7e6a]'}`}>{lang}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {currentSeo.titles.map((t: any, i: number) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-[#ff0000]/10 text-xs font-bold text-[#5a4b3b] flex justify-between">
                        <span>{t}</span>
                        <button onClick={() => handleCopy(t, `t-${i}`)} className="text-[#b91c1c]">{copiedSection === `t-${i}` ? '✓' : '📋'}</button>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#ff0000]/10 text-xs italic text-[#8c7e6a] relative group">
                    "{currentSeo.summary}"
                    <button onClick={() => handleCopy(currentSeo.summary, 'sum')} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">📋</button>
                  </div>
                </div>
              </section>

              <section className="bg-[#4a7c59]/5 p-8 rounded-[40px] border border-[#4a7c59]/20 relative">
                <div className="flex justify-between mb-4 items-center">
                  <h2 className="text-xl font-bold text-[#4a7c59]">2. Diễn biến (Beats)</h2>
                  <button 
                    onClick={handleBreakIntoScenes} 
                    disabled={isBreakingScenes}
                    className={`text-xs font-bold flex items-center gap-2 underline ${isBreakingScenes ? 'text-gray-400 no-underline cursor-not-allowed' : 'text-[#4a7c59]'}`}
                  >
                    {isBreakingScenes ? (
                      <><div className="animate-spin h-3 w-3 border border-[#4a7c59] border-t-transparent rounded-full" /> Đang cập nhật...</>
                    ) : (
                      '🔄 Làm mới danh sách Shot'
                    )}
                  </button>
                </div>
                <div className="space-y-3">
                  {project.story.storyBeats?.map((beat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-[#e2d7c0] flex gap-4">
                      <span className="text-[10px] font-bold text-[#8c7e6a]">#{i+1}</span>
                      <p className="text-sm text-[#5a4b3b] font-medium">{beat}</p>
                    </div>
                  ))}
                </div>
                
                {!project.scenes && (
                  <div className="mt-8">
                    <button 
                      onClick={handleBreakIntoScenes} 
                      disabled={isBreakingScenes}
                      className="w-full py-4 bg-[#4a7c59] text-white rounded-3xl font-bold ghibli-shadow hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                    >
                      {isBreakingScenes ? (
                        <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Đang phân tích cú máy...</>
                      ) : (
                        '🎬 Bước tiếp theo: Phân tích Cú máy & Tối ưu Bối cảnh'
                      )}
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {activeTab === 'SHOTS' && project.scenes && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center bg-[#4a7c59] p-8 rounded-[40px] text-white ghibli-shadow gap-6">
            <div>
              <h2 className="text-2xl font-bold">Danh sách Cú máy (Shots)</h2>
              <p className="text-sm opacity-80 mt-1">Tổng thời lượng: {calculateTotalDuration()}s | Bối cảnh Master: {project.backgrounds.filter(b => b.isMaster).length}</p>
            </div>
            <div className="flex flex-wrap gap-3">
               <button 
                onClick={handleCopyAllShots}
                className={`px-6 py-2 rounded-full text-xs font-bold ghibli-shadow hover:scale-105 transition-all flex items-center gap-2 ${
                  copiedSection === 'all-shots' ? 'bg-[#b91c1c] text-white' : 'bg-white text-[#4a7c59]'
                }`}
              >
                {copiedSection === 'all-shots' ? '✨ Đã sao chép kịch bản đầy đủ' : '📋 Sao chép danh sách (Đầy đủ)'}
              </button>
              <button 
                onClick={() => onModuleChange(ModuleType.PROMPTS)}
                className="px-6 py-2 bg-white text-[#4a7c59] rounded-full text-xs font-bold ghibli-shadow hover:scale-105 transition-transform"
              >
                🚀 Chuyển sang Prompt Sản xuất
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {project.scenes.map((scene) => (
              <div key={scene.id} className="p-6 bg-white border border-[#e2d7c0] rounded-3xl flex gap-6 group hover:border-[#4a7c59] transition-all relative">
                <div className="w-14 h-14 bg-[#fdfaf3] rounded-2xl flex flex-col items-center justify-center border border-[#e2d7c0] group-hover:bg-[#4a7c59] group-hover:text-white transition-all">
                  <span className="text-[9px] font-bold opacity-60">SHOT</span>
                  <span className="text-lg font-bold">{scene.globalShotNumber}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-[#5a4b3b]">{scene.location}</h4>
                    <span className="text-[10px] font-bold px-3 py-1 bg-[#4a7c59]/10 text-[#4a7c59] rounded-full">{scene.duration}s | {scene.suggestedShotType}</span>
                  </div>
                  <p className="text-sm text-[#8c7e6a] italic font-serif">"{scene.action}"</p>
                  <div className="flex gap-4 mt-2 text-[10px] font-bold text-[#4a7c59]">
                    <span>📍 {scene.timeOfDay}</span>
                    <span>🌀 {scene.motionNotes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center py-4">
             <button 
               onClick={handleBreakIntoScenes}
               disabled={isBreakingScenes}
               className="text-sm font-bold text-[#4a7c59] underline hover:no-underline flex items-center gap-2"
             >
               {isBreakingScenes ? 'Đang cập nhật...' : '🔄 Làm mới/Phân tích lại toàn bộ danh sách Shot'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryModule;
