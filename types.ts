
export enum ModuleType {
  STORY = 'STORY',
  DESIGN = 'DESIGN',
  SCENE = 'SCENE',
  CONTINUITY = 'CONTINUITY',
  PROMPTS = 'PROMPTS'
}

export interface ContinuityIssue {
  id: string;
  between_shots: string;
  issue_type: 'spatial' | 'temporal' | 'emotional' | 'visual' | 'narrative';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  ghibli_principle_violated: string;
  fix_suggestion?: string;
}

export interface ContinuityReport {
  overall_score: number;
  detailed_scores: {
    spatial: number;
    temporal: number;
    emotional: number;
    visual: number;
    pacing: number;
    ghibli_alignment: number;
  };
  major_issues: ContinuityIssue[];
  suggestions: {
    position: string;
    action: string;
    reason: string;
    suggested_content: string;
  }[];
  emotional_curve: number[];
  rhythm_score: number;
}

export interface GhibliProject {
  name: string;
  story: StoryFramework | null;
  scenes: Scene[] | null;
  characters: CharacterDesign[];
  backgrounds: BackgroundDesign[];
  shots: Shot[];
  suggestedPriorities: string[];
  optimizedPrompts: {
    characters?: { name: string; prompt: string }[];
    shots?: { shotNumber: number; production_prompt: string }[];
  } | null;
  continuityReport: ContinuityReport | null;
  coreAesthetic: string | null; 
  optimizationAnalysis?: {
    total_scenes: number;
    original_locations_needed: number;
    optimized_locations_needed: number;
    reduction_percentage: number;
    master_backgrounds: any[];
    consolidation_suggestions: string[];
  };
  animations: any[];
  postSettings: {
    grainIntensity: number;
    paperTexture: number;
    ambientSounds: string[];
  };
  designApplied: boolean; // Trạng thái xác nhận thiết kế
}

export interface StoryFramework {
  logline: string;
  theme: string;
  setting: string;
  mainCharacter: string;
  storyBeats: string[];
  suggestedTitles: string[];
  hashtags: string[];
  summary: string;
}

export interface Scene {
  id: string;
  beatIndex: number; 
  shotNumber: number; 
  globalShotNumber: number; 
  duration: number; 
  location: string;
  location_en: string; 
  timeOfDay: string;
  mood: string;
  action: string;
  action_en: string; 
  visualNotes: string;
  motionNotes: string; 
  motionNotes_en: string; 
  soundNotes: string;
  soundNotes_en: string; 
  suggestedShotType: string;
  suggestedShotIcon: string;
  charactersInScene?: string; 
  sceneNumber?: number;
}

export interface CharacterDesign {
  id: string;
  name: string;
  name_en: string;
  age: string;
  personality: string;
  personality_en: string;
  clothingStyle: string;
  description: string;
  description_en: string;
  imageUrl?: string;
  aspectRatio?: "16:9" | "9:16";
}

export interface BackgroundDesign {
  id: string;
  location: string;
  location_en: string;
  timeOfDay: string;
  weather: string;
  season: string;
  description: string;
  description_en: string;
  imageUrl?: string;
  palette: string[];
  aspectRatio?: "16:9" | "9:16";
  isMaster?: boolean;
  masterId?: string; 
  variationType?: 'Lighting' | 'Weather' | 'Angle';
  usageCount?: number;
  associatedScenes?: number[];
}

export interface Shot {
  id: string;
  sceneId: string;
  shotType: string;
  composition: string;
  description: string;
  imageUrl?: string;
}
