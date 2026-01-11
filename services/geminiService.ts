
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const retryWithBackoff = async (fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (error?.status === "RESOURCE_EXHAUSTED" && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const parseTargetSeconds = (durationStr: string): number => {
  if (durationStr.includes("Ngắn")) return 60; // 1 phút
  if (durationStr.includes("Trung bình")) return 180; // 3 phút
  if (durationStr.includes("Dài")) return 300; // 5 phút
  const match = durationStr.match(/\d+/);
  if (!match) return 60;
  const value = parseInt(match[0]);
  return durationStr.toLowerCase().includes("giây") ? value : value * 60;
};

export const generateGhibliAesthetic = async (framework: any, storyType: string) => {
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Bạn là Giám đốc Nghệ thuật phim hoạt hình phong cách vẽ tay cổ điển. 
Dựa trên kịch bản: "${framework.logline}" và chủ đề "${storyType}", hãy tạo hướng dẫn phong cách (Style Guide) NGẨN GỌN bằng tiếng Anh.
KHÔNG ĐƯỢC nhắc đến tên bất kỳ studio hay bản quyền cụ thể nào.

Yêu cầu mô tả cực ngắn (mỗi mục 1-2 dòng):
1. Aesthetic: Phong cách vẽ tay (watercolor, organic lines, painterly).
2. Color: Bảng màu cảm xúc phù hợp với diễn biến này.
3. Lighting: Cách xử lý ánh sáng đặc trưng (soft diffused, golden hour, atmospheric mist).

Hãy tập trung vào linh hồn của câu chuyện này để tùy biến màu sắc và ánh sáng. Trả về text dạng:
Aesthetic: ...
Color: ...
Lighting: ...`,
    });
    return response.text;
  });
};

export const generateStoryFramework = async (userInput: string, storyType: string, storyLength: string) => {
  const targetSeconds = parseTargetSeconds(storyLength);
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Ý tưởng: "${userInput}". Thể loại: "${storyType}". Thời lượng dự kiến: ${targetSeconds}s. 
Hãy tạo kịch bản chi tiết phong cách Hand-drawn classic anime animation. 
Tập trung vào tính nhân văn, sự tĩnh lặng và chiều sâu cảm xúc. 
Đảm bảo mô tả đầy đủ chuyển động (motion) của nhân vật và môi trường. Trả về JSON.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            logline: { type: Type.STRING },
            theme: { type: Type.STRING },
            setting: { type: Type.STRING },
            mainCharacter: { type: Type.STRING },
            summary: { type: Type.STRING },
            suggestedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            storyBeats: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["logline", "theme", "setting", "mainCharacter", "storyBeats", "summary", "suggestedTitles", "hashtags"]
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const breakIntoScenes = async (framework: any, storyType: string, targetDurationStr: string) => {
  const targetSeconds = parseTargetSeconds(targetDurationStr);
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Bạn là đạo diễn phân cảnh (Storyboard Director). Hãy phân tách kịch bản sau thành các shot quay.

QUY TẮC NHỊP ĐIỆU GHIBLI (RHYTHM RULES):
1. Mỗi shot PHẢI từ 3-8 giây (tối ưu cho Veo 3).
2. TỈ LỆ CẢNH TĨNH: Đảm bảo ít nhất 30% số shots là cảnh "Contemplative" (không có hành động chính, chỉ có chuyển động môi trường như gió, mây, hoặc nhân vật đứng yên hít thở).
3. TRÁNH DỒN DẬP: Tuyệt đối không để quá 3 shots hành động liên tiếp. Phải xen kẽ các shots tĩnh (Breathing room).
4. ÂM THANH: Mỗi shot mô tả âm thanh môi trường cụ thể, KHÔNG nhắc đến nhạc nền.

Kịch bản (Story Beats): ${JSON.stringify(framework.storyBeats)}`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shotNumber: { type: Type.INTEGER },
                  duration: { type: Type.INTEGER },
                  location: { type: Type.STRING },
                  location_en: { type: Type.STRING },
                  action: { type: Type.STRING },
                  action_en: { type: Type.STRING },
                  motionNotes: { type: Type.STRING },
                  motionNotes_en: { type: Type.STRING },
                  soundNotes: { type: Type.STRING },
                  soundNotes_en: { type: Type.STRING },
                  suggestedShotType: { type: Type.STRING },
                  mood: { type: Type.STRING },
                  timeOfDay: { type: Type.STRING },
                  visualNotes: { type: Type.STRING }
                },
                required: ["shotNumber", "duration", "location", "location_en", "action", "action_en", "motionNotes", "motionNotes_en", "suggestedShotType", "timeOfDay"]
              }
            },
            suggestedAnimationPriorities: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["scenes", "suggestedAnimationPriorities"]
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const analyzeMasterContinuity = async (scenes: any[]) => {
  const simplifiedScenes = scenes.map(s => ({
    n: s.globalShotNumber,
    act: s.action_en,
    loc: s.location_en,
    dur: s.duration,
    mood: s.mood,
    type: s.suggestedShotType,
    time: s.timeOfDay
  }));

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Phân tích mạch phim và nhịp điệu Ghibli cho danh sách cảnh sau:
      
      Dữ liệu: ${JSON.stringify(simplifiedScenes)}

      YÊU CẦU PHÂN TÍCH NHỊP ĐIỆU (RHYTHM AUDIT):
      - Đánh giá xem có đủ 30% cảnh tĩnh (Contemplative shots) không.
      - Kiểm tra xem có cụm hành động nào quá 3 shots liên tiếp không.
      - Đề xuất chèn cảnh chuyển tiếp hoặc cảnh "thở" (Ma) để đạt nhịp điệu lý tưởng.
      - Đánh giá tính nhất quán không gian và thời gian.

      TRẢ VỀ JSON.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overall_score: { type: Type.NUMBER },
            detailed_scores: {
              type: Type.OBJECT,
              properties: {
                spatial: { type: Type.NUMBER },
                temporal: { type: Type.NUMBER },
                emotional: { type: Type.NUMBER },
                visual: { type: Type.NUMBER },
                pacing: { type: Type.NUMBER },
                ghibli_alignment: { type: Type.NUMBER }
              },
              required: ["spatial", "temporal", "emotional", "visual", "pacing", "ghibli_alignment"]
            },
            major_issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  between_shots: { type: Type.STRING },
                  issue_type: { type: Type.STRING, enum: ["spatial", "temporal", "emotional", "visual", "narrative"] },
                  severity: { type: Type.STRING, enum: ["critical", "major", "minor"] },
                  description: { type: Type.STRING },
                  ghibli_principle_violated: { type: Type.STRING },
                  fix_suggestion: { type: Type.STRING }
                },
                required: ["id", "between_shots", "issue_type", "severity", "description", "ghibli_principle_violated", "fix_suggestion"]
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  position: { type: Type.STRING },
                  action: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  suggested_content: { type: Type.STRING }
                }
              }
            },
            emotional_curve: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER }
            },
            rhythm_score: { type: Type.NUMBER }
          },
          required: ["overall_score", "detailed_scores", "major_issues", "emotional_curve", "rhythm_score"]
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const optimizeBackgroundsAnalysis = async (scenes: any[]) => {
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Bạn là chuyên gia thiết kế bối cảnh. Phân tích danh sách cảnh quay và xác định số lượng bối cảnh MASTER tối thiểu cần thiết bằng cách gộp các cảnh có cùng địa điểm địa lý.
      
      Dữ liệu cảnh: ${JSON.stringify(scenes.map(s => ({ n: s.globalShotNumber, loc: s.location, loc_en: s.location_en, time: s.timeOfDay })))}
      
      QUY TẮC:
      - 1 địa điểm vật lý duy nhất = 1 Master Background.
      - Tạo mô tả tổng quát (description) cho Master Background đó để họa sĩ có thể vẽ một lần và tái sử dụng nhiều lần.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            total_scenes: { type: Type.INTEGER },
            original_locations_needed: { type: Type.INTEGER },
            optimized_locations_needed: { type: Type.INTEGER },
            reduction_percentage: { type: Type.NUMBER },
            master_backgrounds: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  name_en: { type: Type.STRING },
                  scenes: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                  reuse_count: { type: Type.INTEGER },
                  description: { type: Type.STRING }
                },
                required: ["id", "name", "name_en", "scenes", "reuse_count", "description"]
              }
            },
            consolidation_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["total_scenes", "original_locations_needed", "optimized_locations_needed", "reduction_percentage", "master_backgrounds"]
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generateMasterBGPrompt = async (location: any) => {
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tạo mô tả chi tiết (Master Background Prompt) cho bối cảnh: "${location.name_en}". 
      Yêu cầu: Phong cách màu nước hoạt hình cổ điển, ánh sáng trung tính, chi tiết phong phú.
      Trả về JSON chứa "master_prompt", "landmark_elements", "base_palette".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            master_prompt: { type: Type.STRING },
            landmark_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
            base_palette: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const translateSEO = async (seoData: any, targetLang: string) => {
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dịch dữ liệu SEO sau sang ${targetLang}: ${JSON.stringify(seoData)}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  });
};

export const suggestAssetsFromScenes = async (scenes: any[]) => {
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gợi ý nhân vật và bối cảnh (tối đa 5 mỗi loại) từ: ${JSON.stringify(scenes.slice(0, 8))}.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characters: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  name: { type: Type.STRING }, 
                  name_en: { type: Type.STRING },
                  age: { type: Type.STRING }, 
                  personality: { type: Type.STRING },
                  personality_en: { type: Type.STRING },
                  description: { type: Type.STRING },
                  description_en: { type: Type.STRING }
                } 
              } 
            },
            backgrounds: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  location: { type: Type.STRING }, 
                  location_en: { type: Type.STRING },
                  description: { type: Type.STRING },
                  description_en: { type: Type.STRING }
                } 
              } 
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generateKeyframeData = async (elements: string[]) => {
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tạo dữ liệu khung hình hoạt họa cho: ${elements.join(', ')}. 
      Phong cách: Hoạt hình vẽ tay tự nhiên. 
      Trả về JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyframes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  frame: { type: Type.INTEGER },
                  element: { type: Type.STRING },
                  action: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const scanAmbientSounds = async (data: any) => {
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dựa trên bối cảnh sau, hãy gợi ý âm thanh môi trường hoạt hình vẽ tay: ${JSON.stringify(data)}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              sound: { type: Type.STRING },
              vol: { type: Type.STRING }
            },
            required: ["type", "sound", "vol"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generateTransitionShot = async (shotA: any, shotB: any, context: string) => {
  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Tạo một shot chuyển tiếp giữa Shot A và Shot B phong cách hoạt hình vẽ tay.
      Shot A: ${JSON.stringify(shotA)}
      Shot B: ${JSON.stringify(shotB)}
      Bối cảnh: ${context}`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            duration: { type: Type.INTEGER },
            location: { type: Type.STRING },
            location_en: { type: Type.STRING },
            action: { type: Type.STRING },
            action_en: { type: Type.STRING },
            motionNotes: { type: Type.STRING },
            motionNotes_en: { type: Type.STRING },
            soundNotes: { type: Type.STRING },
            soundNotes_en: { type: Type.STRING },
            suggestedShotType: { type: Type.STRING },
            mood: { type: Type.STRING },
            timeOfDay: { type: Type.STRING },
            visualNotes: { type: Type.STRING }
          },
          required: ["duration", "location", "location_en", "action", "action_en", "motionNotes", "motionNotes_en", "soundNotes", "soundNotes_en", "suggestedShotType", "mood", "timeOfDay", "visualNotes"]
        }
      }
    });
    return JSON.parse(response.text);
  });
};
