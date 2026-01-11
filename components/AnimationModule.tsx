
import React, { useState, useEffect } from 'react';
import { GhibliProject } from '../types';
import { generateKeyframeData } from '../services/geminiService';

interface AnimationModuleProps {
  project: GhibliProject;
  onUpdate: (updates: Partial<GhibliProject>) => void;
}

const AnimationModule: React.FC<AnimationModuleProps> = ({ project, onUpdate }) => {
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [keyframes, setKeyframes] = useState<any>(null);

  const availablePriorities = [
    { id: 'Wind', label: 'Hiệu ứng Gió' },
    { id: 'Ambient', label: 'Môi trường xung quanh' },
    { id: 'Hair', label: 'Tóc bay nhẹ' },
    { id: 'Cloth', label: 'Quần áo đung đưa' },
    { id: 'Face', label: 'Biểu cảm tinh tế' },
    { id: 'Body', label: 'Cử động cơ thể' }
  ];

  // Tự động đồng bộ các ưu tiên từ kịch bản khi kịch bản được tạo
  useEffect(() => {
    if (project.suggestedPriorities && project.suggestedPriorities.length > 0) {
      // Lọc ra các nhãn hợp lệ từ gợi ý của AI
      const matchedLabels = availablePriorities
        .filter(p => project.suggestedPriorities.includes(p.label))
        .map(p => p.label);
      
      if (matchedLabels.length > 0) {
        setSelectedElements(matchedLabels);
      } else {
        // Fallback mặc định cho Ghibli nếu không khớp
        setSelectedElements(['Hiệu ứng Gió', 'Môi trường xung quanh']);
      }
    } else {
      // Fallback mặc định
      setSelectedElements(['Hiệu ứng Gió', 'Môi trường xung quanh']);
    }
  }, [project.suggestedPriorities]);

  const toggleElement = (el: string) => {
    setSelectedElements(prev => 
      prev.includes(el) ? prev.filter(x => x !== el) : [...prev, el]
    );
  };

  const handleGenerateKeyframes = async () => {
    setGenerating(true);
    try {
      const data = await generateKeyframeData(selectedElements);
      setKeyframes(data);
      onUpdate({ animations: [...project.animations, { shotId: 'mock-shot', keyframes: data, loops: selectedElements }] });
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      {/* Controls */}
      <div className="space-y-8">
        <section className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow animate-in slide-in-from-left duration-500">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-lg text-[#5a4b3b]">Ưu tiên Chuyển động</h3>
            <span className="bg-[#4a7c59]/10 text-[#4a7c59] text-[8px] font-bold px-2 py-1 rounded-full uppercase">
              {project.suggestedPriorities.length > 0 ? 'AI Activated' : 'Manual'}
            </span>
          </div>
          <p className="text-xs text-[#8c7e6a] mb-6 italic">Gợi ý chuyển động dựa trên cốt truyện và thể loại phim của bạn.</p>
          <div className="space-y-3">
            {availablePriorities.map(el => (
              <button
                key={el.id}
                onClick={() => toggleElement(el.label)}
                className={`w-full px-5 py-3 rounded-2xl border text-sm font-bold flex justify-between items-center transition-all ${
                  selectedElements.includes(el.label)
                    ? 'bg-[#4a7c59] text-white border-[#4a7c59] ghibli-shadow ring-2 ring-[#4a7c59] ring-offset-2'
                    : 'bg-[#fdfaf3] text-[#8c7e6a] border-[#e2d7c0] hover:border-[#4a7c59]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {el.label}
                  {project.suggestedPriorities.includes(el.label) && (
                    <span className="text-[10px] opacity-70 italic">(Gợi ý AI)</span>
                  )}
                </div>
                {selectedElements.includes(el.label) && <span className="animate-in fade-in zoom-in">✓</span>}
              </button>
            ))}
          </div>
          <button 
            onClick={handleGenerateKeyframes}
            disabled={generating}
            className="w-full mt-6 py-4 bg-[#5a4b3b] text-white rounded-3xl font-bold hover:bg-[#4a3b2b] transition-all flex items-center justify-center gap-2 ghibli-shadow"
          >
            {generating ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : '⚙️ Tạo Khung hình chính'}
          </button>
        </section>

        <section className="bg-[#4a7c59] p-8 rounded-[40px] text-white ghibli-shadow">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <span>🌿</span> Tinh thần Studio Ghibli
          </h4>
          <p className="text-xs opacity-80 italic leading-relaxed">
            "Sự tĩnh lặng không có nghĩa là đứng yên. Trong Ghibli, ngay cả khi nhân vật không nói, thế giới xung quanh họ vẫn luôn 'thở'."
          </p>
          <div className="mt-6">
             <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-60">Chỉ số chuyển động tự nhiên</p>
             <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: selectedElements.length > 2 ? '85%' : '50%' }}></div>
             </div>
          </div>
        </section>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-[50px] border border-[#e2d7c0] ghibli-shadow p-4 overflow-hidden aspect-video relative group animate-in zoom-in duration-500">
           <div className="w-full h-full bg-[#f4ece1] rounded-[38px] flex items-center justify-center relative overflow-hidden">
             <img src="https://picsum.photos/seed/ghibli-animation/1280/720" className="w-full h-full object-cover opacity-50 grayscale" alt="Xem trước" />
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
               <div className={`w-20 h-20 bg-[#4a7c59] rounded-full flex items-center justify-center text-white text-3xl ghibli-shadow cursor-pointer hover:scale-110 transition-transform ${generating ? 'animate-pulse' : ''}`}>
                 ▶
               </div>
               <div className="mt-6 text-center">
                  <p className="text-[#5a4b3b] font-bold text-lg">
                    {keyframes ? 'Bản xem trước đã sẵn sàng' : 'Nhấn để xem thử Hoạt họa'}
                  </p>
                  <p className="text-xs text-[#8c7e6a] mt-1">Đang áp dụng: {selectedElements.join(', ')}</p>
               </div>
             </div>
             
             {/* Simulated wind lines overlay if Wind is active */}
             {selectedElements.includes('Hiệu ứng Gió') && (
               <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/4 -left-full w-full h-px bg-white/30 animate-[wind_3s_linear_infinite]" />
                  <div className="absolute top-1/2 -left-full w-full h-px bg-white/20 animate-[wind_4s_linear_infinite] delay-700" />
                  <div className="absolute top-3/4 -left-full w-full h-px bg-white/30 animate-[wind_2s_linear_infinite] delay-200" />
               </div>
             )}
           </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="bg-white px-8 py-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
               <span className="text-xs font-bold text-[#5a4b3b] uppercase">Timeline</span>
             </div>
             <span className="text-xs font-bold text-[#8c7e6a] font-mono">00:00:15 / 12 FPS</span>
          </div>
          <div className="h-6 bg-[#fdfaf3] rounded-2xl relative overflow-hidden border border-[#e2d7c0]">
            <div className={`absolute top-0 left-0 bottom-0 bg-[#4a7c59]/10 transition-all duration-[3000ms] ease-linear ${keyframes ? 'w-full' : 'w-0'}`} />
            <div className={`absolute top-0 bottom-0 w-1 h-full bg-[#4a7c59] z-10 transition-all duration-[3000ms] ease-linear ${keyframes ? 'left-full' : 'left-0'}`} />
          </div>
          <div className="flex gap-3 mt-6">
            {selectedElements.map((el, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                 <div className="w-16 h-10 rounded-xl bg-[#4a7c59]/20 border border-[#4a7c59]/40 flex items-center justify-center text-[10px] font-bold text-[#4a7c59]">
                   KEY {i+1}
                 </div>
                 <span className="text-[8px] font-bold text-[#8c7e6a] uppercase text-center">{el}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes wind {
          from { transform: translateX(0); }
          to { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default AnimationModule;
