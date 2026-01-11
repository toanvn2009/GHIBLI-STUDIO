
import React from 'react';
import { GhibliProject } from '../types';

interface SceneModuleProps {
  project: GhibliProject;
  onUpdate: (updates: Partial<GhibliProject>) => void;
}

const SceneModule: React.FC<SceneModuleProps> = ({ project }) => {
  const shotLibrary = [
    { name: 'Góc rộng Toàn cảnh', type: 'Wide Shot', icon: '🌄' },
    { name: 'Góc Trung rộng', type: 'Medium Wide', icon: '🌳' },
    { name: 'Suy tưởng (Khoảng lặng)', type: 'Contemplative', icon: '☁️' },
    { name: 'Tập trung Nhân vật', type: 'Medium/Close-up', icon: '👤' },
  ];

  // Hàm tạo mô tả động dựa trên cốt truyện
  const getDynamicSubtitle = () => {
    if (!project.story) return "Góc quay được tối ưu hóa cho cảm xúc và không gian đặc trưng của phim.";
    
    const { theme, setting, mainCharacter } = project.story;
    return `Phân tách không gian hình ảnh cho hành trình của ${mainCharacter}, lấy bối cảnh tại ${setting} với chủ đề "${theme}".`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <h2 className="text-3xl font-bold text-[#5a4b3b]">Bố cục Cảnh quay</h2>
        <p className="text-[#8c7e6a] mt-2 italic">
          {getDynamicSubtitle()}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Shot Library - Pre-active status indication */}
        <div className="space-y-6">
          <h3 className="font-bold text-[#8c7e6a] uppercase text-xs tracking-widest">Thư viện Góc quay</h3>
          <div className="space-y-4">
            {shotLibrary.map(lib => {
              const isActiveInScript = project.scenes?.some(s => s.suggestedShotType.includes(lib.type));
              return (
                <div 
                  key={lib.name} 
                  className={`p-4 rounded-3xl border flex items-center justify-between transition-all ${
                    isActiveInScript ? 'bg-[#4a7c59]/10 border-[#4a7c59] scale-105' : 'bg-white border-[#e2d7c0] opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lib.icon}</span>
                    <span className={`text-sm font-bold ${isActiveInScript ? 'text-[#4a7c59]' : 'text-[#5a4b3b]'}`}>{lib.name}</span>
                  </div>
                  {isActiveInScript && <span className="text-[10px] font-bold text-[#4a7c59]">ACTIVE</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Composition Area */}
        <div className="lg:col-span-3 space-y-8">
          {project.scenes?.map((scene) => (
            <div key={scene.id} className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-center mb-6 border-b border-[#fdfaf3] pb-4">
                <h4 className="font-bold text-xl text-[#5a4b3b]">Cảnh {scene.sceneNumber}: {scene.location}</h4>
                <div className="flex gap-2">
                   <span className="px-3 py-1 bg-[#4a7c59] text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                     {scene.suggestedShotType}
                   </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#fdfaf3] rounded-[30px] border border-[#e2d7c0] p-6 relative group overflow-hidden h-48 flex flex-col items-center justify-center border-dashed">
                   <div className="text-4xl mb-2">{scene.suggestedShotIcon || '🎬'}</div>
                   <p className="text-xs font-bold text-[#5a4b3b] text-center">{scene.visualNotes || 'Góc quay được tối ưu cho cảm xúc Ghibli.'}</p>
                   <div className="absolute inset-0 bg-[#4a7c59]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button className="px-4 py-2 bg-white rounded-full text-xs font-bold border border-[#4a7c59] text-[#4a7c59]">Thay đổi Góc quay</button>
                   </div>
                </div>
                
                <div className="bg-[#4a7c59]/5 rounded-[30px] border border-[#4a7c59]/20 p-8 flex flex-col justify-center">
                   <h5 className="text-[10px] font-bold text-[#4a7c59] uppercase mb-2">Chỉ dẫn Nghệ thuật</h5>
                   <p className="text-xs text-[#5a4b3b] italic leading-relaxed">
                     "Đối với cảnh này, camera nên giữ yên (static). Hãy để {scene.location} kể chuyện thông qua {scene.timeOfDay}."
                   </p>
                   <div className="mt-4 flex gap-2">
                      <span className="text-[10px] font-bold text-[#8c7e6a]">#CameraTĩnh</span>
                      <span className="text-[10px] font-bold text-[#8c7e6a]">#NaturalLight</span>
                   </div>
                </div>
              </div>
            </div>
          ))}

          {!project.scenes && (
            <div className="h-96 border-2 border-dashed border-[#e2d7c0] rounded-[50px] flex flex-col items-center justify-center text-[#8c7e6a]">
              <span className="text-6xl mb-4">🎬</span>
              <p className="text-xl font-bold">Đang chờ phân cảnh chi tiết...</p>
              <p className="text-sm mt-2">Hoàn thành Module 1 để mở khóa Bộ soạn thảo Góc quay.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SceneModule;
