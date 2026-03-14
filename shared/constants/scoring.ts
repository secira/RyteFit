export const DEFAULT_SCORING_WEIGHTS = {
  skillsMatch: 32,        
  experienceLevel: 26,    
  education: 12,          
  workHistoryRelevance: 20,
  keywords: 5,            
  culturalFit: 5          
} as const;

export const DEFAULT_SCORING_WEIGHTS_SUM = 100;

export type ScoringWeights = typeof DEFAULT_SCORING_WEIGHTS;
