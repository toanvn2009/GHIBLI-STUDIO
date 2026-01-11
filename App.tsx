
import React, { useState, useRef } from 'react';
import { ModuleType, GhibliProject } from './types';
import Sidebar from './components/Sidebar';
import StoryModule from './components/StoryModule';
import DesignModule from './components/DesignModule';
import SceneModule from './components/SceneModule';
import ContinuityModule from './components/ContinuityModule';
import PromptModule from './components/PromptModule';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.STORY);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<GhibliProject>({
    name: 'Phim Ghibli Chưa đặt tên',
    story: null,
    scenes: null,
    characters: [],
    backgrounds: [],
    shots: [],
    suggestedPriorities: [],
    optimizedPrompts: null,
    continuityReport: null,
    coreAesthetic: null, 
    animations: [],
    postSettings: {
      grainIntensity: 15,
      paperTexture: 20,
      ambientSounds: []
    },
    designApplied: false // Mặc định là chưa áp dụng
  });

  const updateProject = (updates: Partial<GhibliProject>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const exportProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${project.name.replace(/\s+/g, '_')}_project.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedProject = JSON.parse(content) as GhibliProject;
        if (importedProject.name) {
          setProject(importedProject);
          setCurrentModule(ModuleType.STORY);
        } else {
          alert('Tệp JSON không hợp lệ.');
        }
      } catch (err) {
        alert('Lỗi khi tải dự án.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const getModuleLabel = (type: ModuleType) => {
    switch (type) {
      case ModuleType.STORY: return 'Xây dựng Cốt truyện';
      case ModuleType.DESIGN: return 'Phòng Thiết kế';
      case ModuleType.SCENE: return 'Bố cục Cảnh quay';
      case ModuleType.CONTINUITY: return 'Hệ thống Mạch phim (Flow)';
      case ModuleType.PROMPTS: return 'Prompt Sản xuất';
      default: return '';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fdfaf3] text-[#5a4b3b] overflow-hidden">
      <Sidebar 
        currentModule={currentModule} 
        onModuleChange={setCurrentModule} 
        projectComplete={!!project.scenes}
        designApplied={project.designApplied} // Truyền prop vào Sidebar
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="px-8 py-4 border-b border-[#e2d7c0] flex justify-between items-center bg-[#fdfaf3]/80 backdrop-blur-md z-10">
          <div>
            <h1 className="text-2xl font-bold text-[#4a7c59] flex items-center gap-2">
              <span className="text-3xl">🌿</span> {project.name}
            </h1>
            <p className="text-xs text-[#8c7e6a] uppercase tracking-widest mt-1">
              {getModuleLabel(currentModule)}
            </p>
          </div>
          <div className="flex gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            <button onClick={handleImportClick} className="px-5 py-2 bg-white text-[#4a7c59] border border-[#4a7c59] rounded-full text-sm font-semibold ghibli-shadow">Tải Dự án</button>
            <button onClick={exportProject} className="px-5 py-2 bg-[#4a7c59] text-white rounded-full text-sm font-semibold ghibli-shadow">Xuất Dự án</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {currentModule === ModuleType.STORY && (
            <StoryModule 
              project={project} 
              onUpdate={updateProject} 
              onModuleChange={setCurrentModule}
            />
          )}
          {currentModule === ModuleType.DESIGN && <DesignModule project={project} onUpdate={updateProject} />}
          {currentModule === ModuleType.SCENE && <SceneModule project={project} onUpdate={updateProject} />}
          {currentModule === ModuleType.CONTINUITY && <ContinuityModule project={project} onUpdate={updateProject} />}
          {currentModule === ModuleType.PROMPTS && <PromptModule project={project} />}
        </div>
      </main>
    </div>
  );
};

export default App;
