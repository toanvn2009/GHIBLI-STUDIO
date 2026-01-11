
import React, { useState } from 'react';
import { GhibliProject } from '../types';
import { scanAmbientSounds } from '../services/geminiService';

interface PostModuleProps {
  project: GhibliProject;
  onUpdate: (updates: Partial<GhibliProject>) => void;
}

const PostModule: React.FC<PostModuleProps> = ({ project, onUpdate }) => {
  const [currentPreset, setCurrentPreset] = useState('Ánh sáng ban ngày');
  const [scanning, setScanning] = useState(false);
  const [ambientSounds, setAmbientSounds] = useState([
    { type: 'Chủ đạo', sound: 'Gió nhẹ rì rào', vol: 'Vừa' },
    { type: 'Thứ cấp', sound: 'Tiếng ve sầu (Mùa hè)', vol: 'Nhỏ' },
    { type: 'Điểm xuyết', sound: 'Tiếng cửa gỗ kẽo kẹt', vol: 'Vừa' }
  ]);

  const presets = [
    { name: 'Ánh sáng ban ngày', color: 'bg-orange-100', text: 'Ấm áp, mềm mại, hơi dư sáng.' },
    { name: 'Hoàng hôn', color: 'bg-purple-100', text: 'Giờ vàng, bầu trời cam hồng rực rỡ.' },
    { name: 'U ám', color: 'bg-blue-50', text: 'Lạnh, trầm mặc, độ tương phản thấp.' },
    { name: 'Ban đêm', color: 'bg-indigo-900', text: 'Xanh thẳm, ánh sáng nội thất ấm áp.' },
  ];

  const handleScanAssets = async () => {
    setScanning(true);
    try {
      const suggestions = await scanAmbientSounds({
        story: project.story,
        scenes: project.scenes,
        characters: project.characters
      });
      setAmbientSounds(suggestions);
      onUpdate({ postSettings: { ...project.postSettings, ambientSounds: suggestions.map((s: any) => s.sound) } });
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header>
        <h2 className="text-3xl font-bold text-[#5a4b3b]">Phòng Hậu kỳ</h2>
        <p className="text-[#8c7e6a] mt-2 italic">Lớp hoàn thiện cuối cùng để đạt được cảm giác phim analog đích thực.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Settings */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow">
            <h3 className="font-bold text-[#8c7e6a] uppercase text-xs tracking-widest mb-6">Chỉnh màu (Color Grading)</h3>
            <div className="grid grid-cols-2 gap-3">
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => setCurrentPreset(p.name)}
                  className={`p-4 rounded-3xl border text-left transition-all ${
                    currentPreset === p.name ? 'border-[#4a7c59] bg-[#4a7c59]/5' : 'border-[#e2d7c0] hover:border-[#4a7c59]'
                  }`}
                >
                  <div className={`w-full h-8 rounded-xl mb-2 ${p.color}`} />
                  <p className="text-xs font-bold text-[#5a4b3b]">{p.name}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow">
            <h3 className="font-bold text-[#8c7e6a] uppercase text-xs tracking-widest mb-6">Kết cấu Phim (Texture)</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Độ nhiễu (Grain)</span>
                  <span>{project.postSettings.grainIntensity}%</span>
                </div>
                <input 
                  type="range" 
                  className="w-full h-2 bg-[#fdfaf3] rounded-lg appearance-none cursor-pointer accent-[#4a7c59]" 
                  value={project.postSettings.grainIntensity}
                  onChange={e => onUpdate({ postSettings: { ...project.postSettings, grainIntensity: parseInt(e.target.value) }})}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Vân giấy màu nước</span>
                  <span>{project.postSettings.paperTexture}%</span>
                </div>
                <input 
                  type="range" 
                  className="w-full h-2 bg-[#fdfaf3] rounded-lg appearance-none cursor-pointer accent-[#4a7c59]" 
                  value={project.postSettings.paperTexture}
                  onChange={e => onUpdate({ postSettings: { ...project.postSettings, paperTexture: parseInt(e.target.value) }})}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right: Preview & Sound */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#5a4b3b] rounded-[50px] p-2 aspect-video overflow-hidden ghibli-shadow relative">
            <div className="w-full h-full bg-black rounded-[42px] overflow-hidden flex items-center justify-center">
               <img src="https://picsum.photos/seed/finished/1280/720" className="w-full h-full object-cover grayscale-0 brightness-110 contrast-90" alt="Xem trước hoàn thiện" />
               <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
               <div className="absolute top-0 left-0 w-full h-[10%] bg-black z-10" />
               <div className="absolute bottom-0 left-0 w-full h-[10%] bg-black z-10" />
            </div>
            <div className="absolute top-8 left-8 text-white/50 text-[10px] font-mono">GHIBLI STUDIO PREVIEW // {currentPreset.toUpperCase()}</div>
          </div>

          <section className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-[#8c7e6a] uppercase text-xs tracking-widest">Gợi ý Âm thanh Môi trường</h3>
               <button 
                onClick={handleScanAssets}
                disabled={scanning}
                className="text-xs font-bold text-[#4a7c59] hover:underline flex items-center gap-2"
               >
                 {scanning ? <div className="animate-spin h-3 w-3 border border-[#4a7c59] border-t-transparent rounded-full" /> : '🔍 Quét tài nguyên cảnh'}
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ambientSounds.map((s, i) => (
                <div key={i} className="p-4 bg-[#fdfaf3] border border-[#e2d7c0] rounded-2xl flex flex-col gap-1 hover:border-[#4a7c59] transition-all">
                  <span className="text-[10px] font-bold text-[#8c7e6a] uppercase">{s.type}</span>
                  <span className="text-sm font-bold text-[#5a4b3b]">{s.sound}</span>
                  <span className="text-[10px] text-[#4a7c59]">Âm lượng: {s.vol}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PostModule;
