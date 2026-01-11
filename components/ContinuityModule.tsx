
import React, { useState } from 'react';
import { GhibliProject, ContinuityReport, Scene } from '../types';
import { analyzeMasterContinuity, generateTransitionShot } from '../services/geminiService';

interface ContinuityModuleProps {
  project: GhibliProject;
  onUpdate: (updates: Partial<GhibliProject>) => void;
}

const ContinuityModule: React.FC<ContinuityModuleProps> = ({ project, onUpdate }) => {
  const [auditing, setAuditing] = useState(false);
  const [generatingTransition, setGeneratingTransition] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAuditSilent = async (currentScenes: Scene[]) => {
    try {
      const report = await analyzeMasterContinuity(currentScenes);
      if (report) {
        onUpdate({ continuityReport: report });
      }
    } catch (err) {
      console.error("Silent audit failed:", err);
    }
  };

  const handleRunAudit = async () => {
    if (!project.scenes || project.scenes.length === 0) {
      setError("Vui lòng hoàn thành bước 'Cốt truyện' để có danh sách cú máy trước khi kiểm tra mạch phim.");
      return;
    }
    
    setAuditing(true);
    setError(null);
    try {
      const report = await analyzeMasterContinuity(project.scenes);
      if (report) {
        onUpdate({ continuityReport: report });
      } else {
        throw new Error("Không nhận được phản hồi từ hệ thống phân tích.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Có lỗi xảy ra khi phân tích mạch phim. Vui lòng thử lại sau vài giây (Lỗi API hoặc quá tải).");
    } finally {
      setAuditing(false);
    }
  };

  const handleFixIssue = async (issueId: string, position: string) => {
    if (!project.scenes || !project.continuityReport) return;
    setGeneratingTransition(issueId);
    try {
      const shotNums = position.match(/\d+/g);
      
      if (!shotNums || shotNums.length < 2) {
        alert(`Không thể xác định vị trí để chèn cảnh chuyển từ nội dung: "${position}". AI cần trả về ít nhất 2 số thứ tự cảnh.`);
        setGeneratingTransition(null);
        return;
      }

      const numA = parseInt(shotNums[0]);
      const numB = parseInt(shotNums[1]);
      
      const idxA = project.scenes.findIndex(s => s.globalShotNumber === numA);
      const idxB = project.scenes.findIndex(s => s.globalShotNumber === numB);
      
      if (idxA === -1 || idxB === -1) {
        alert("Số thứ tự cảnh quay không tồn tại trong danh sách hiện tại.");
        setGeneratingTransition(null);
        return;
      }

      const shotA = project.scenes[idxA];
      const shotB = project.scenes[idxB];
      
      const newShotData = await generateTransitionShot(shotA, shotB, "Sửa lỗi đứt gãy mạch phim được phát hiện bởi hệ thống kiểm soát.");
      
      const newScene: Scene = {
        ...newShotData,
        id: `trans-${Date.now()}`,
        globalShotNumber: numA + 0.5, 
        beatIndex: shotA.beatIndex,
        suggestedShotIcon: '🔄'
      };

      const updatedScenes = [...project.scenes, newScene]
        .sort((a, b) => a.globalShotNumber - b.globalShotNumber)
        .map((s, idx) => ({ 
          ...s, 
          globalShotNumber: idx + 1, 
          shotNumber: idx + 1,
          sceneNumber: idx + 1 
        }));

      // Cập nhật báo cáo hiện tại: xóa vấn đề đã sửa thay vì set null
      const updatedIssues = project.continuityReport.major_issues.filter(i => i.id !== issueId);
      const tempReport: ContinuityReport = {
        ...project.continuityReport,
        major_issues: updatedIssues
      };

      onUpdate({ 
        scenes: updatedScenes, 
        continuityReport: tempReport 
      }); 

      // Tự động chạy lại phân tích ngầm để cập nhật điểm số chính xác
      runAuditSilent(updatedScenes);
      
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo cảnh chuyển tiếp. Vui lòng thử lại.");
    } finally {
      setGeneratingTransition(null);
    }
  };

  const renderEmotionalGraph = (data: number[]) => {
    if (!data || data.length === 0) return null;
    const maxVal = 10;
    const width = 100;
    const height = 40;
    const points = data.map((val, i) => `${(i / (data.length - 1)) * width},${height - (val / maxVal) * height}`).join(' ');

    return (
      <div className="bg-white p-6 rounded-[30px] border border-[#e2d7c0] ghibli-shadow overflow-hidden">
        <h3 className="text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-4">Biểu đồ Cảm xúc (Ghibli Intensity)</h3>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 stroke-[#4a7c59] fill-none stroke-[1.5]">
          <polyline points={points} strokeLinecap="round" strokeLinejoin="round" />
          {data.map((val, i) => (
            <circle key={i} cx={(i / (data.length - 1)) * width} cy={height - (val / maxVal) * height} r="1" fill="#4a7c59" />
          ))}
        </svg>
        <div className="flex justify-between mt-2 text-[8px] font-bold text-[#8c7e6a] uppercase">
          <span>Khởi đầu</span>
          <span>Cao trào</span>
          <span>Kết thúc</span>
        </div>
      </div>
    );
  };

  const calculateStaticRatio = () => {
    if (!project.scenes) return 0;
    const staticCount = project.scenes.filter(s => 
      s.suggestedShotType.toLowerCase().includes('contemplative') || 
      s.motionNotes_en?.toLowerCase().includes('static') ||
      s.action_en?.toLowerCase().includes('breathing')
    ).length;
    return Math.round((staticCount / project.scenes.length) * 100);
  };

  const continuityReport = project.continuityReport;
  const staticRatio = calculateStaticRatio();

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold text-[#5a4b3b]">Hệ thống Kiểm soát Mạch phim</h2>
          <p className="text-[#8c7e6a] mt-2 italic max-w-xl">
            "Đảm bảo nhịp điệu Ghibli: Cân bằng giữa hành động và những khoảng lặng (Ma)."
          </p>
        </div>
        <button 
          onClick={handleRunAudit}
          disabled={auditing}
          className={`px-10 py-4 ${auditing ? 'bg-gray-400' : 'bg-[#4a7c59]'} text-white rounded-full font-bold text-lg hover:bg-[#3d654a] transition-all ghibli-shadow disabled:opacity-50 flex items-center gap-3`}
        >
          {auditing ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Đang phân tích...
            </>
          ) : '🔍 Kiểm tra Nhịp điệu & Mạch phim'}
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-3xl animate-in slide-in-from-top duration-300">
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Rhythm Statistics (Always visible if scenes exist) */}
      {project.scenes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[#4a7c59] p-8 rounded-[40px] text-white ghibli-shadow flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-70 mb-1 tracking-widest">Tỉ lệ cảnh tĩnh (Breathing Room)</p>
                <h4 className="text-4xl font-bold">{staticRatio}%</h4>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${staticRatio}%` }} />
                </div>
                <p className="text-[9px] mt-2 opacity-80 italic">Mục tiêu: {staticRatio >= 30 ? '✓ Đạt chuẩn (>=30%)' : '⚠ Cần thêm cảnh chiêm nghiệm'}</p>
              </div>
           </div>
           
           <div className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#8c7e6a] uppercase opacity-70 mb-1 tracking-widest">Độ dài Shot trung bình</p>
                <h4 className="text-4xl font-bold text-[#5a4b3b]">
                  {Math.round((project.scenes.reduce((acc, s) => acc + s.duration, 0) / project.scenes.length) * 10) / 10}s
                </h4>
              </div>
              <p className="text-[9px] text-[#4a7c59] font-bold uppercase mt-2">Phù hợp với Veo 3 (3-8s)</p>
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#8c7e6a] uppercase opacity-70 mb-1 tracking-widest">Tổng số Cú máy</p>
                <h4 className="text-4xl font-bold text-[#5a4b3b]">{project.scenes.length}</h4>
              </div>
              <p className="text-[9px] text-[#8c7e6a] font-bold uppercase mt-2">Dự án: {project.name}</p>
           </div>
        </div>
      )}

      {!continuityReport ? (
        <div className="h-96 border-4 border-dashed border-[#e2d7c0] rounded-[60px] flex flex-col items-center justify-center text-center p-10 bg-[#f4ece1]/30">
          <div className="text-6xl mb-6">🔄</div>
          <h3 className="text-2xl font-bold text-[#5a4b3b]">Chưa có dữ liệu phân tích chi tiết</h3>
          <p className="text-[#8c7e6a] mt-2 italic">Hãy nhấn nút kiểm tra để AI rà soát lỗi đứt gãy mạch phim và sự cân bằng nhịp điệu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow text-center">
              <p className="text-[10px] font-bold text-[#8c7e6a] uppercase tracking-widest mb-2">Điểm Flow Tổng thể</p>
              <div className="text-6xl font-bold text-[#4a7c59] mb-2">{continuityReport.overall_score}/50</div>
              <div className="h-2 bg-[#fdfaf3] rounded-full overflow-hidden mb-4 border border-[#e2d7c0]">
                <div 
                  className="h-full bg-[#4a7c59] transition-all duration-1000" 
                  style={{ width: `${((continuityReport?.overall_score ?? 0) / 50) * 100}%` }}
                />
              </div>
              <p className="text-xs italic text-[#8c7e6a]">
                {continuityReport.overall_score > 40 ? 'Mạch phim đạt chuẩn Ghibli.' : 'Cần điều chỉnh thêm để phim mượt mà hơn.'}
              </p>
            </section>

            {renderEmotionalGraph(continuityReport.emotional_curve)}

            <section className="bg-white p-8 rounded-[40px] border border-[#e2d7c0] ghibli-shadow">
              <h3 className="text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-6">Chi tiết Chỉ số</h3>
              <div className="space-y-4">
                {(Object.entries(continuityReport.detailed_scores) as [string, number][]).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] font-bold mb-1 uppercase text-[#5a4b3b]">
                      <span>{key}</span>
                      <span>{val}/10</span>
                    </div>
                    <div className="h-1.5 bg-[#fdfaf3] rounded-full overflow-hidden border border-[#e2d7c0]">
                      <div className="h-full bg-[#5a4b3b]" style={{ width: `${val * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-8">
             <div className="flex justify-between items-center px-4">
                <h3 className="text-2xl font-bold text-[#5a4b3b]">Vấn đề cần xử lý</h3>
                <span className="bg-[#b91c1c]/10 text-[#b91c1c] text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                  {continuityReport.major_issues.length} Issues
                </span>
             </div>

             <div className="space-y-4">
               {continuityReport.major_issues.length === 0 ? (
                 <div className="bg-white p-12 rounded-[40px] border border-[#e2d7c0] text-center">
                    <span className="text-4xl mb-4 block">✨</span>
                    <p className="font-bold text-[#4a7c59]">Tuyệt vời! Không phát hiện lỗi mạch phim nghiêm trọng nào.</p>
                 </div>
               ) : (
                 continuityReport.major_issues.map((issue, idx) => (
                   <div key={issue.id || idx} className={`bg-white p-8 rounded-[40px] border-2 ghibli-shadow transition-all group ${
                     issue.severity === 'critical' ? 'border-red-100 hover:border-red-300' : 'border-[#e2d7c0] hover:border-[#4a7c59]'
                   }`}>
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <span className={`w-3 h-3 rounded-full ${issue.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`} />
                           <span className="text-[10px] font-bold uppercase text-[#8c7e6a] tracking-widest">{issue.issue_type} Continuity</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#5a4b3b] bg-[#fdfaf3] px-3 py-1 rounded-full border border-[#e2d7c0]">
                          Between Shots: {issue.between_shots}
                        </span>
                     </div>
                     
                     <h4 className="text-lg font-bold text-[#5a4b3b] mb-2">{issue.description}</h4>
                     <p className="text-xs text-[#8c7e6a] italic mb-6 leading-relaxed">
                       <span className="font-bold text-[#b91c1c] uppercase not-italic mr-2">Ghibli Rule:</span>
                       "{issue.ghibli_principle_violated}"
                     </p>

                     <div className="bg-[#fdfaf3] p-6 rounded-[30px] border border-dashed border-[#e2d7c0] flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex-1">
                           <p className="text-[10px] font-bold text-[#4a7c59] uppercase mb-1">AI Recommendation:</p>
                           <p className="text-sm text-[#5a4b3b] font-medium italic">"{issue.fix_suggestion}"</p>
                        </div>
                        <button 
                          onClick={() => handleFixIssue(issue.id, issue.between_shots)}
                          disabled={generatingTransition === issue.id}
                          className="px-6 py-3 bg-[#5a4b3b] text-white rounded-2xl text-xs font-bold hover:bg-[#4a3b2b] transition-all ghibli-shadow whitespace-nowrap flex items-center gap-2"
                        >
                          {generatingTransition === issue.id ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : '✨ Auto-Fix'}
                        </button>
                     </div>
                   </div>
                 ))
               )}
             </div>

             <section className="bg-[#5a4b3b] p-10 rounded-[60px] text-white ghibli-shadow relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                   <div className="text-6xl">🎞️</div>
                   <div>
                      <h4 className="text-2xl font-bold mb-2">Lời khuyên về Nhịp điệu (Rhythm)</h4>
                      <p className="text-sm opacity-90 leading-relaxed italic">
                        {staticRatio < 30 
                          ? "Phim của bạn đang có nhịp điệu khá nhanh. Hãy cân nhắc chèn thêm ít nhất 2-3 cảnh tĩnh (contemplative shots) không lời thoại để đạt tỉ lệ 'Ma' lý tưởng của Ghibli."
                          : "Nhịp điệu phim đang rất tốt. Sự cân bằng giữa tĩnh và động tạo cảm giác analog chân thực."}
                      </p>
                      <div className="mt-6 flex gap-4">
                         <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-center">
                            <p className="text-[8px] uppercase font-bold opacity-60">Rhythm Score</p>
                            <p className="text-xl font-bold">{continuityReport.rhythm_score}/10</p>
                         </div>
                         <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-center">
                            <p className="text-[8px] uppercase font-bold opacity-60">Breathing Room</p>
                            <p className="text-xl font-bold">{staticRatio >= 30 ? 'Perfect' : 'Low'}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContinuityModule;
