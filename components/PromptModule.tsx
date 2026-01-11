
import React, { useState } from 'react';
import { GhibliProject, Scene, CharacterDesign, BackgroundDesign } from '../types';

interface PromptModuleProps {
  project: GhibliProject;
}

const PromptModule: React.FC<PromptModuleProps> = ({ project }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeView, setActiveView] = useState<'Manifest' | 'Shots'>('Manifest');

  const getCoreStyle = () => {
    const defaultStyle = {
      aesthetic: "hand-drawn classic anime, watercolor texture, organic lines",
      color: "vibrant yet soft natural palette",
      lighting: "soft diffused natural light"
    };
    if (!project.coreAesthetic) return defaultStyle;
    const lines = project.coreAesthetic.split('\n');
    return {
      aesthetic: lines.find(l => l.includes('Aesthetic:'))?.split(':')[1]?.trim() || defaultStyle.aesthetic,
      color: lines.find(l => l.includes('Color:'))?.split(':')[1]?.trim() || defaultStyle.color,
      lighting: lines.find(l => l.includes('Lighting:'))?.split(':')[1]?.trim() || defaultStyle.lighting,
    };
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getReferencesForScene = (scene: Scene) => {
    const sceneAction = (scene.action || "").toLowerCase();
    const sceneChars = (scene.charactersInScene || "").toLowerCase();
    const matchedChars = project.characters.filter(c => {
      const name = (c.name || "").toLowerCase();
      const nameEn = (c.name_en || "").toLowerCase();
      return sceneAction.includes(name) || sceneAction.includes(nameEn) || 
             sceneChars.includes(name) || sceneChars.includes(nameEn);
    });
    const matchedBg = project.backgrounds.find(b => {
      const loc = (b.location || "").toLowerCase();
      const locEn = (b.location_en || "").toLowerCase();
      return (scene.location || "").toLowerCase().includes(loc) || 
             (scene.location || "").toLowerCase().includes(locEn);
    });
    return { 
      charRefNames: matchedChars.length > 0 ? matchedChars.map(c => c.name_en).join(', ') : 'Generic character',
      bgRefName: matchedBg ? matchedBg.location_en : (scene.location_en || scene.location),
      charData: matchedChars[0] || null,
      bgData: matchedBg || null
    };
  };

  const generateCharacterRefPrompt = (char: CharacterDesign) => {
    const name = (char.name_en || char.name).toUpperCase();
    const style = getCoreStyle();
    return [
      `${name} – MASTER CHARACTER REFERENCE`,
      ``,
      `A single character design reference, full body, neutral standing pose, facing slightly to the left, no background.`,
      ``,
      `Physical traits:`,
      `- Age: ${char.age || 'Unknown'}`,
      `- Personality: ${char.personality_en || char.personality}`,
      `- Features: ${char.description_en || 'Expressive eyes, gentle facial structure, natural body proportions'}`,
      ``,
      `Clothing:`,
      `- ${char.clothingStyle || 'Consistent everyday clothing'}, simple design, functional and nostalgic aesthetic`,
      ``,
      `Style and line art:`,
      `- soft hand-drawn line art`,
      `- subtle line weight variation`,
      `- no hard outlines`,
      ``,
      `Color and rendering:`,
      `- ${style.color || 'flat pastel base colors'}`,
      `- soft watercolor shading`,
      `- low contrast`,
      `- no dramatic lighting`,
      `- no strong shadows`,
      ``,
      `Expression and mood:`,
      `- calm, neutral expression`,
      `- gentle and natural posture`,
      ``,
      `Style:`,
      `- Studio Ghibli character design`,
      `- model sheet style`,
      `- clean, consistent, reusable character reference`,
      `- no environment, no props, no action`
    ].join('\n');
  };

  const generateEnvironmentRefPrompt = (bg: BackgroundDesign) => {
    const locationName = (bg.location_en || bg.location).toUpperCase();
    const style = getCoreStyle();
    return [
      `${locationName} – MASTER ENVIRONMENT REFERENCE`,
      ``,
      `A wide, reusable Studio Ghibli style background environment, no characters, designed for multiple camera angles.`,
      ``,
      `Spatial layout:`,
      `- Foreground elements: Natural foliage, small hand-drawn details`,
      `- Midground structures: ${bg.description_en || 'Architectural elements or central landscape focus'}`,
      `- Background depth and distant elements: Atmospheric mist, soft mountain silhouettes or sky`,
      ``,
      `Lighting:`,
      `- ${style.lighting || 'soft diffused natural light'}`,
      `- ambient and bounce light behavior following golden hour or soft daylight`,
      ``,
      `Materials and textures:`,
      `- hand-painted watercolor layers`,
      `- organic paper grain`,
      `- painterly imperfections, weathered wooden or stone textures`,
      ``,
      `Color palette:`,
      `- ${style.color || 'dominant natural earth tones'}`,
      `- saturation level: medium-low for nostalgic feel`,
      `- harmony rules based on environment's mood`,
      ``,
      `Atmosphere:`,
      `- nostalgic, calm, high atmospheric depth`,
      `- weather: ${bg.weather || 'clear'}`,
      `- air quality: crisp, misty, or soft hazy bloom`,
      ``,
      `Style:`,
      `- Studio Ghibli background art`,
      `- hand-painted watercolor layers`,
      `- organic paper grain`,
      `- painterly, cinematic but calm`,
      `- background illustration only`
    ].join('\n');
  };

  const generateBananaProductionPrompt = (scene: Scene) => {
    const { charData, bgData } = getReferencesForScene(scene);
    const style = getCoreStyle();
    return [
      `#SHOT [${scene.globalShotNumber}] – BANANA PRO (KEYFRAME)`,
      `Subject: ${charData?.name_en || "Character"} in ${bgData?.location_en || scene.location_en}.`,
      `Action: ${scene.action_en}.`,
      `Aesthetic: Official Ghibli art style, watercolor background art, ${style.aesthetic}.`,
      `Lighting: ${style.lighting}.`,
      `Technical: High-resolution keyframe, visible pencil line texture, hand-painted aesthetic.`
    ].join('\n');
  };

  const generateVeo3ProductionPrompt = (scene: Scene) => {
    const motion = scene.motionNotes_en || "subtle organic movement";
    return [
      `#SHOT [${scene.globalShotNumber}] – VEO 3 (ANIMATION)`,
      `Prompt: [${scene.suggestedShotType} cinematic animation]. Motion: [${motion}, character blinking and soft breathing, environment leaves rustling]. Style: [Studio Ghibli frame-by-frame quality, watercolor painterly motion]. 24fps.`,
      `Audio: No background music. No soundtrack. No cinematic score. Environment sound: [${scene.soundNotes_en || "natural ambient sounds"}].`
    ].join('\n');
  };

  const handleCopyAll = () => {
    let all = "=== STUDIO GHIBLI MASTER PRODUCTION SCRIPT ===\n\n";
    all += "--- PHASE 1: ASSET MANIFEST ---\n";
    project.characters.forEach(c => all += `\n${generateCharacterRefPrompt(c)}\n`);
    project.backgrounds.forEach(b => all += `\n${generateEnvironmentRefPrompt(b)}\n`);
    all += "\n\n--- PHASE 2: SHOT PRODUCTION ---\n";
    project.scenes?.forEach(s => {
      all += `\n------------------------------------------\n`;
      all += `${generateBananaProductionPrompt(s)}\n`;
      all += `\n${generateVeo3ProductionPrompt(s)}\n`;
    });
    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const isContemplative = (s: Scene) => 
    s.suggestedShotType.toLowerCase().includes('contemplative') || 
    s.motionNotes_en?.toLowerCase().includes('static') ||
    s.action_en?.toLowerCase().includes('breathing');

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header & Main Controls */}
      <header className="bg-[#5a4b3b] p-12 rounded-[60px] text-white ghibli-shadow relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-4xl font-bold">Director's Production Hub</h2>
          <p className="opacity-80 mt-2 italic text-sm">Toàn bộ tài nguyên cần thiết cho Banana Pro & Veo 3.</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <div className="flex bg-white/10 p-1 rounded-2xl border border-white/20">
             <button onClick={() => setActiveView('Manifest')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeView === 'Manifest' ? 'bg-white text-[#5a4b3b]' : 'text-white/60'}`}>Asset Manifest</button>
             <button onClick={() => setActiveView('Shots')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeView === 'Shots' ? 'bg-white text-[#5a4b3b]' : 'text-white/60'}`}>Shot Board</button>
          </div>
          <button onClick={handleCopyAll} className={`px-8 py-3 rounded-full font-bold text-sm transition-all ghibli-shadow ${copiedAll ? 'bg-white text-[#4a7c59]' : 'bg-[#b91c1c] text-white hover:scale-105 active:scale-95'}`}>
            {copiedAll ? '✨ ĐÃ COPY TOÀN BỘ!' : '📋 COPY MASTER SCRIPT'}
          </button>
        </div>
      </header>

      {/* Visual Rhythm Timeline */}
      <section className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow">
         <h3 className="text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-6 flex items-center gap-2">
           🎞️ Visual Rhythm Timeline (Ghibli Ma-Flow)
         </h3>
         <div className="flex h-12 w-full bg-[#fdfaf3] rounded-2xl overflow-hidden border border-[#e2d7c0] p-1 gap-1">
            {project.scenes?.map((s, idx) => (
              <div 
                key={s.id} 
                title={`Shot ${s.globalShotNumber}: ${isContemplative(s) ? 'Contemplative' : 'Action'}`}
                className={`flex-1 rounded-lg transition-all cursor-help ${isContemplative(s) ? 'bg-[#4a7c59] hover:brightness-110' : 'bg-[#b91c1c]/40 hover:brightness-110'}`}
              />
            ))}
         </div>
         <div className="flex justify-between mt-3 text-[10px] font-bold">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#4a7c59] rounded-sm" /> <span className="text-[#4a7c59]">CẢNH TĨNH (CONTEMPLATIVE)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#b91c1c]/40 rounded-sm" /> <span className="text-[#8c7e6a]">CẢNH HÀNH ĐỘNG (ACTION)</span></div>
         </div>
      </section>

      {activeView === 'Manifest' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left duration-500">
           {/* CHARACTERS MANIFEST */}
           <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#5a4b3b] px-4">👥 Character Asset List</h3>
              {project.characters.map(char => (
                <div key={char.id} className="bg-white p-6 rounded-[35px] border border-[#e2d7c0] ghibli-shadow group">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold text-[#4a7c59] uppercase">{char.name_en}</span>
                      <button onClick={() => handleCopy(generateCharacterRefPrompt(char), char.id)} className="text-xs text-[#8c7e6a] hover:text-[#4a7c59]">{copied === char.id ? '✓' : '📋'}</button>
                   </div>
                   <div className="bg-[#1a1a1a] p-5 rounded-2xl text-[10px] text-gray-300 font-mono leading-relaxed h-48 overflow-y-auto custom-scrollbar">
                      {generateCharacterRefPrompt(char)}
                   </div>
                </div>
              ))}
           </div>
           {/* BACKGROUNDS MANIFEST */}
           <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#5a4b3b] px-4">🌄 Master Background List</h3>
              {project.backgrounds.map(bg => (
                <div key={bg.id} className="bg-white p-6 rounded-[35px] border border-[#e2d7c0] ghibli-shadow group">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold text-[#5a4b3b] uppercase">{bg.location_en}</span>
                      <button onClick={() => handleCopy(generateEnvironmentRefPrompt(bg), bg.id)} className="text-xs text-[#8c7e6a] hover:text-[#5a4b3b]">{copied === bg.id ? '✓' : '📋'}</button>
                   </div>
                   <div className="bg-[#1a1a1a] p-5 rounded-2xl text-[10px] text-gray-300 font-mono leading-relaxed h-48 overflow-y-auto custom-scrollbar">
                      {generateEnvironmentRefPrompt(bg)}
                   </div>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-12 animate-in slide-in-from-right duration-500">
          {project.scenes?.map(scene => (
            <div key={scene.id} className="bg-white p-10 rounded-[50px] border border-[#e2d7c0] ghibli-shadow group">
              <div className="flex items-center gap-6 mb-8 pb-6 border-b border-[#fdfaf3]">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-white ${isContemplative(scene) ? 'bg-[#4a7c59]' : 'bg-[#5a4b3b]'}`}>
                  <span className="text-[9px] opacity-60">SHOT</span>
                  <span className="text-xl">{scene.globalShotNumber}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#5a4b3b]">{scene.action.split('.')[0]}</h4>
                  <p className="text-[10px] font-bold text-[#4a7c59] uppercase mt-1">Ref: {getReferencesForScene(scene).bgRefName} • {scene.duration}s • {isContemplative(scene) ? 'Contemplative' : 'Action'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><h5 className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-widest">🖼️ Banana Pro Prompt</h5><button onClick={() => handleCopy(generateBananaProductionPrompt(scene), `b-${scene.id}`)} className="text-[10px] font-bold text-[#8c7e6a] hover:text-[#4a7c59]">{copied === `b-${scene.id}` ? '✓ Copied' : '📋 Copy'}</button></div>
                  <div className="bg-[#1a1a1a] p-6 rounded-3xl text-[10px] text-gray-300 font-mono h-32 overflow-y-auto custom-scrollbar">{generateBananaProductionPrompt(scene)}</div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><h5 className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-widest">🎥 Veo 3 Prompt</h5><button onClick={() => handleCopy(generateVeo3ProductionPrompt(scene), `v-${scene.id}`)} className="text-[10px] font-bold text-[#8c7e6a] hover:text-[#b91c1c]">{copied === `v-${scene.id}` ? '✓ Copied' : '📋 Copy'}</button></div>
                  <div className="bg-[#1a1a1a] p-6 rounded-3xl text-[10px] text-gray-300 font-mono h-32 overflow-y-auto custom-scrollbar">{generateVeo3ProductionPrompt(scene)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer className="bg-[#f4ece1] p-16 rounded-[70px] border border-[#e2d7c0] text-center">
         <h4 className="text-sm font-bold text-[#5a4b3b] uppercase tracking-widest mb-8">Production Rules for AI Success</h4>
         <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-white p-8 rounded-[40px] ghibli-shadow">
               <p className="text-xs font-bold text-[#4a7c59] mb-3">CHARACTER CONSISTENCY (BANANA FIRST)</p>
               <p className="text-[11px] text-[#8c7e6a] leading-relaxed">Luôn tạo Character Turnaround trên Banana Pro TRƯỚC. Sử dụng ảnh đó làm reference (Image-to-Video) cho Veo 3 để nhân vật không bị biến dạng giữa các cảnh.</p>
            </div>
            <div className="bg-white p-8 rounded-[40px] ghibli-shadow">
               <p className="text-xs font-bold text-[#b91c1c] mb-3">THE "MA" PRINCIPLE (VEO 3)</p>
               <p className="text-[11px] text-[#8c7e6a] leading-relaxed">Khi tạo video trên Veo 3, nếu cảnh quay quá nhanh, hãy giảm 'Motion Scale' xuống thấp (1-3). Ghibli đẹp nhất ở những chuyển động cực kỳ tinh tế.</p>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default PromptModule;
