
import React from 'react';
import { ModuleType } from '../types';

interface SidebarProps {
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  projectComplete: boolean;
  designApplied: boolean; // Thêm prop này
}

const Sidebar: React.FC<SidebarProps> = ({ currentModule, onModuleChange, projectComplete, designApplied }) => {
  const navItems = [
    { type: ModuleType.STORY, label: 'Cốt truyện', icon: '📖', locked: false },
    { type: ModuleType.DESIGN, label: 'Thiết kế', icon: '🎨', locked: !projectComplete },
    { type: ModuleType.SCENE, label: 'Bố cục Cảnh', icon: '🎬', locked: !projectComplete },
    { type: ModuleType.CONTINUITY, label: 'Mạch phim', icon: '🔄', locked: !projectComplete },
    { type: ModuleType.PROMPTS, label: 'Prompt Sản xuất', icon: '💡', locked: !projectComplete || !designApplied }, // Thêm điều kiện khóa
  ];

  return (
    <aside className="w-64 bg-[#f4ece1] border-r border-[#e2d7c0] flex flex-col h-full z-20">
      <div className="p-8">
        <div className="brand text-2xl font-bold text-[#5a4b3b] tracking-tight">
          GHIBLI <span className="text-[#4a7c59]">STUDIO</span>
        </div>
        <div className="w-12 h-1 bg-[#4a7c59] mt-2 rounded-full"></div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.type}
            onClick={() => !item.locked && onModuleChange(item.type)}
            disabled={item.locked}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative ${
              currentModule === item.type
                ? 'bg-[#4a7c59] text-white ghibli-shadow'
                : item.locked 
                  ? 'text-[#8c7e6a]/40 cursor-not-allowed'
                  : 'text-[#8c7e6a] hover:bg-[#e2d7c0] hover:text-[#5a4b3b]'
            }`}
          >
            <span className={`text-xl ${currentModule === item.type ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`}>
              {item.icon}
            </span>
            <span className="font-semibold">{item.label}</span>
            {item.locked && <span className="absolute right-4 text-[10px] opacity-60">🔒</span>}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-[#e2d7c0]/50 p-4 rounded-3xl border border-[#d4c4a3]">
          <p className="text-xs font-bold text-[#5a4b3b] mb-1">GHIBLI PIPELINE</p>
          <p className="text-[10px] text-[#8c7e6a] italic">
            "Xây dựng kịch bản và sản xuất bằng sức mạnh AI."
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
