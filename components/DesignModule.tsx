
import React, { useState } from 'react';
import { GhibliProject, CharacterDesign, BackgroundDesign } from '../types';
import { optimizeBackgroundsAnalysis, generateMasterBGPrompt } from '../services/geminiService';

interface DesignModuleProps {
  project: GhibliProject;
  onUpdate: (updates: Partial<GhibliProject>) => void;
}

const DesignModule: React.FC<DesignModuleProps> = ({ project, onUpdate }) => {
  const [charName, setCharName] = useState('');
  const [charAge, setCharAge] = useState('');
  const [charPersonality, setCharPersonality] = useState('');

  const [bgLocation, setBgLocation] = useState('');
  const [bgDescription, setBgDescription] = useState('');
  
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBgView, setActiveBgView] = useState<'All' | 'Master'>('Master');

  const handleAddCharacter = () => {
    if (!charName) return;
    const newChar: CharacterDesign = {
      id: `char-${Date.now()}`,
      name: charName,
      name_en: charName,
      age: charAge || 'Chưa rõ',
      personality: charPersonality || 'Bình thường',
      personality_en: charPersonality,
      clothingStyle: 'Thường nhật',
      description: 'Nhân vật được thêm thủ công',
      description_en: ''
    };
    onUpdate({ characters: [...project.characters, newChar], designApplied: false });
    setCharName('');
    setCharAge('');
    setCharPersonality('');
  };

  const handleAddBackground = () => {
    if (!bgLocation) return;
    const newBg: BackgroundDesign = {
      id: `bg-${Date.now()}`,
      location: bgLocation,
      location_en: bgLocation,
      timeOfDay: 'Ban ngày',
      weather: 'Trong trẻo',
      season: 'Mùa hè',
      description: bgDescription || 'Bối cảnh được thêm thủ công',
      description_en: '',
      palette: ['#E6E2D3', '#7C9473'],
      isMaster: true
    };
    onUpdate({ backgrounds: [...project.backgrounds, newBg], designApplied: false });
    setBgLocation('');
    setBgDescription('');
  };

  const deleteCharacter = (id: string) => {
    onUpdate({ characters: project.characters.filter(c => c.id !== id), designApplied: false });
  };

  const deleteBackground = (id: string) => {
    onUpdate({ backgrounds: project.backgrounds.filter(b => b.id !== id), designApplied: false });
  };

  const handleOptimizeBackgrounds = async () => {
    if (!project.scenes || project.scenes.length === 0) {
      setError("Vui lòng hoàn thành kịch bản ở Module 1 trước khi tối ưu bối cảnh.");
      return;
    }
    setOptimizing(true);
    setError(null);
    try {
      const analysis = await optimizeBackgroundsAnalysis(project.scenes);
      
      if (!analysis || !analysis.master_backgrounds) {
        throw new Error("Dữ liệu tối ưu không hợp lệ từ AI.");
      }

      const masterBgs: BackgroundDesign[] = analysis.master_backgrounds.map((m: any) => ({
        id: `master-${m.id}`,
        location: m.name,
        location_en: m.name_en,
        timeOfDay: 'Trung tính',
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
        backgrounds: masterBgs,
        optimizationAnalysis: analysis,
        designApplied: false 
      });
      setActiveBgView('Master');
    } catch (err) {
      console.error(err);
      setError("Lỗi khi phân tích tối ưu bối cảnh. Vui lòng thử lại sau giây lát.");
    } finally {
      setOptimizing(false);
    }
  };

  const promoteToMaster = async (bgId: string) => {
    const bg = project.backgrounds.find(b => b.id === bgId);
    if (!bg) return;
    
    try {
        const masterData = await generateMasterBGPrompt({ name_en: bg.location_en, reuse_count: bg.usageCount || 1 });
        
        const updatedBgs = project.backgrounds.map(b => 
          b.id === bgId ? { 
            ...b, 
            isMaster: true, 
            description_en: masterData.master_prompt,
            palette: masterData.base_palette 
          } : b
        );
        onUpdate({ backgrounds: updatedBgs, designApplied: false });
    } catch (e) {
        alert("Lỗi khi tạo mô tả Master BG.");
    }
  };

  const handleApplyDesign = () => {
    if (project.characters.length === 0 && project.backgrounds.length === 0) {
      alert("Vui lòng thêm ít nhất một nhân vật hoặc bối cảnh trước khi áp dụng.");
      return;
    }
    onUpdate({ designApplied: true });
    alert("Thiết kế đã được áp dụng! Module 'Prompt Sản xuất' đã được mở khóa.");
  };

  const masterBackgrounds = project.backgrounds.filter(b => b.isMaster);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Optimization Header */}
      <div className="bg-[#4a7c59] p-10 rounded-[50px] text-white ghibli-shadow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <span>🌿</span> Hệ thống Tối ưu Bối cảnh
            </h2>
            <p className="text-sm opacity-90 italic mt-2 max-w-xl">
              "Nguyên lý Ghibli: Một địa điểm chính có thể kể ngàn câu chuyện thông qua ánh sáng và góc quay. Giảm số lượng, tăng chiều sâu."
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button 
                onClick={handleOptimizeBackgrounds}
                disabled={optimizing || !project.scenes}
                className={`px-8 py-4 bg-white text-[#4a7c59] rounded-full font-bold text-lg ghibli-shadow hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50`}
            >
                {optimizing ? (
                    <><div className="animate-spin h-5 w-5 border-2 border-[#4a7c59] border-t-transparent rounded-full" /> Đang tối ưu...</>
                ) : '✨ Phân tích Tối ưu (Reuse)'}
            </button>
            {!project.scenes && (
                <p className="text-[10px] font-bold text-orange-200 uppercase tracking-tighter animate-pulse">Cần hoàn thành kịch bản trước</p>
            )}
          </div>
        </div>
        
        {project.optimizationAnalysis && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-500">
            <div className="bg-white/10 p-4 rounded-3xl border border-white/20">
              <p className="text-[10px] uppercase font-bold opacity-60">Tổng số cảnh</p>
              <p className="text-2xl font-bold">{project.optimizationAnalysis.total_scenes}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-3xl border border-white/20">
              <p className="text-[10px] uppercase font-bold opacity-60">Gốc (Cần tạo)</p>
              <p className="text-2xl font-bold">{project.optimizationAnalysis.original_locations_needed}</p>
            </div>
            <div className="bg-[#f4ece1] text-[#4a7c59] p-4 rounded-3xl border border-white/20">
              <p className="text-[10px] uppercase font-bold opacity-80">Tối ưu (Master)</p>
              <p className="text-2xl font-bold">{project.optimizationAnalysis.optimized_locations_needed}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-3xl border border-white/20">
              <p className="text-[10px] uppercase font-bold opacity-60">Giảm thiểu</p>
              <p className="text-2xl font-bold text-green-300">-{project.optimizationAnalysis.reduction_percentage}%</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-3xl animate-in slide-in-from-top duration-300">
            <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar: Character Manager */}
        <div className="lg:col-span-4 space-y-8">
           <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-[#5a4b3b] flex items-center gap-2">
                  <span className="text-2xl">👥</span> Nhân vật (Assets)
                </h3>
              </div>

              <div className="bg-white p-6 rounded-[35px] border border-[#e2d7c0] ghibli-shadow space-y-4">
                <input 
                  placeholder="Tên nhân vật" 
                  value={charName} onChange={e => setCharName(e.target.value)}
                  className="w-full bg-[#fdfaf3] border border-[#e2d7c0] rounded-2xl px-4 py-2 text-sm focus:outline-none" 
                />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Tuổi" value={charAge} onChange={e => setCharAge(e.target.value)} className="bg-[#fdfaf3] border border-[#e2d7c0] rounded-2xl px-4 py-2 text-sm focus:outline-none" />
                  <input placeholder="Tính cách" value={charPersonality} onChange={e => setCharPersonality(e.target.value)} className="bg-[#fdfaf3] border border-[#e2d7c0] rounded-2xl px-4 py-2 text-sm focus:outline-none" />
                </div>
                <button onClick={handleAddCharacter} className="w-full py-3 bg-[#5a4b3b] text-white rounded-2xl font-bold text-sm hover:bg-[#4a3b2b] transition-all">+ Thêm nhân vật</button>
              </div>

              <div className="space-y-4">
                {project.characters.map(char => (
                  <div key={char.id} className="bg-white p-5 rounded-3xl border border-[#e2d7c0] hover:border-[#4a7c59] transition-all ghibli-shadow group relative">
                    <button onClick={() => deleteCharacter(char.id)} className="absolute top-4 right-4 text-[#8c7e6a] hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                    <h4 className="font-bold text-[#4a7c59]">{char.name}</h4>
                    <p className="text-[10px] text-[#8c7e6a] italic">{char.personality}</p>
                  </div>
                ))}
              </div>
           </section>
        </div>

        {/* Main: Background Asset Library */}
        <div className="lg:col-span-8 space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#5a4b3b]">Thư viện Bối cảnh (Asset Library)</h3>
              <div className="flex bg-[#f4ece1] p-1 rounded-2xl border border-[#e2d7c0]">
                <button 
                  onClick={() => setActiveBgView('Master')}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${activeBgView === 'Master' ? 'bg-[#4a7c59] text-white shadow-sm' : 'text-[#8c7e6a]'}`}
                >
                  Master BGs
                </button>
                <button 
                  onClick={() => setActiveBgView('All')}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${activeBgView === 'All' ? 'bg-[#4a7c59] text-white shadow-sm' : 'text-[#8c7e6a]'}`}
                >
                  Tất cả
                </button>
              </div>
           </div>

           {/* Add Background Form */}
           <div className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <input 
                  placeholder="Địa điểm mới..." 
                  value={bgLocation} onChange={e => setBgLocation(e.target.value)}
                  className="w-full bg-[#fdfaf3] border border-[#e2d7c0] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]" 
                />
              </div>
              <div className="md:col-span-1">
                <textarea 
                  placeholder="Mô tả bối cảnh..." 
                  value={bgDescription} onChange={e => setBgDescription(e.target.value)}
                  className="w-full bg-[#fdfaf3] border border-[#e2d7c0] rounded-2xl px-4 py-3 text-sm focus:outline-none h-[46px] resize-none" 
                />
              </div>
              <button onClick={handleAddBackground} className="bg-[#5a4b3b] text-white rounded-2xl font-bold text-sm h-[46px] hover:bg-[#4a3b2b]">+ Tạo Master BG</button>
           </div>

           {/* Grid Display */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(activeBgView === 'Master' ? masterBackgrounds : project.backgrounds).map(bg => (
                <div key={bg.id} className={`p-8 bg-white border-2 rounded-[45px] ghibli-shadow transition-all group relative flex flex-col ${bg.isMaster ? 'border-[#4a7c59]/30' : 'border-[#e2d7c0]'}`}>
                  {bg.isMaster && (
                    <span className="absolute top-4 left-8 bg-[#4a7c59] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
                      Master Location
                    </span>
                  )}
                  
                  <button onClick={() => deleteBackground(bg.id)} className="absolute top-4 right-8 text-[#8c7e6a] hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                  
                  <div className="mt-4">
                    <h4 className="text-xl font-bold text-[#5a4b3b]">{bg.location}</h4>
                    <p className="text-[10px] text-[#4a7c59] font-bold uppercase mt-1">Ref: {bg.location_en}</p>
                  </div>
                  
                  <div className="mt-4 bg-[#fdfaf3] p-4 rounded-3xl border border-[#e2d7c0] flex-1">
                    <p className="text-xs text-[#8c7e6a] leading-relaxed line-clamp-3">
                      {bg.description_en || bg.description}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {bg.associatedScenes && (
                       <div className="w-full flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold text-[#8c7e6a]">SỬ DỤNG TRONG {bg.associatedScenes.length} CẢNH:</p>
                          <div className="flex gap-1">
                             {bg.associatedScenes.map(s => <span key={s} className="w-4 h-4 rounded bg-[#4a7c59]/10 text-[#4a7c59] text-[8px] flex items-center justify-center font-bold">#{s}</span>)}
                          </div>
                       </div>
                    )}
                    
                    {!bg.isMaster && (
                      <button 
                        onClick={() => promoteToMaster(bg.id)}
                        className="text-[10px] font-bold text-[#4a7c59] underline hover:no-underline"
                      >
                        Nâng cấp thành Master BG
                      </button>
                    )}
                    
                    {bg.isMaster && (
                      <div className="flex gap-2 w-full mt-2">
                        <button className="flex-1 py-2 bg-[#f4ece1] text-[#8c7e6a] rounded-xl text-[10px] font-bold border border-[#e2d7c0]">Tạo Biến thể Ánh sáng</button>
                        <button className="flex-1 py-2 bg-[#f4ece1] text-[#8c7e6a] rounded-xl text-[10px] font-bold border border-[#e2d7c0]">Cận cảnh (Detail)</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {(activeBgView === 'Master' && masterBackgrounds.length === 0) && (
                <div className="col-span-2 h-64 border-2 border-dashed border-[#e2d7c0] rounded-[50px] flex flex-col items-center justify-center text-[#8c7e6a] bg-[#f4ece1]/20">
                   <p className="text-sm font-bold italic">Chưa có bối cảnh Master nào được xác định.</p>
                   <button onClick={handleOptimizeBackgrounds} className="mt-4 text-xs font-bold text-[#4a7c59] underline">Chạy phân tích tối ưu ngay</button>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-8 border-t border-[#e2d7c0]">
        <div className={`px-6 py-2 rounded-full text-xs font-bold ${project.designApplied ? 'bg-[#4a7c59] text-white' : 'bg-orange-100 text-[#8c7e6a] border border-orange-200'}`}>
          {project.designApplied ? '✓ Thiết kế đã được xác nhận' : '⚠ Thiết kế chưa được áp dụng để tạo Prompt'}
        </div>
        <button 
          onClick={handleApplyDesign}
          className={`px-12 py-4 rounded-full font-bold text-lg ghibli-shadow transition-all ${project.designApplied ? 'bg-[#5a4b3b] text-white opacity-50 cursor-default' : 'bg-[#4a7c59] text-white hover:scale-105 active:scale-95'}`}
        >
          {project.designApplied ? 'Đã áp dụng thiết kế' : '🚀 Áp dụng Thiết kế & Tạo Prompt'}
        </button>
        <p className="text-xs text-[#8c7e6a] italic">Lưu ý: Sau khi nhấn, module "Prompt Sản xuất" sẽ được mở khóa với các tài nguyên hiện có.</p>
      </div>
    </div>
  );
};

export default DesignModule;
