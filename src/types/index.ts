// =================================
// Core Object & Analysis Types
// =================================

export type ObjectType = 'cucumber' | 'banana' | 'other_rod' | null;

// Represents the result from the truth analysis utility
export interface TruthAnalysisResult {
  truthScore: number;
  isSuspicious: boolean;
  suspiciousFeatures: string[];
  adjustedLength?: number;      // Adjusted length if suspicious
  adjustmentFactor?: number;    // Factor used for adjustment
  funnyMessage: string;       // Humorous message based on truth score
  suggestionMessage?: string;  // Suggestion based on analysis
}

// Represents the final analysis result sent to the client
export interface AnalysisResult {
  objectType: ObjectType;
  rodSubtype?: 'male_feature' | 'regular_rod';
  multipleObjects: boolean;
  lowQuality: boolean;
  lengthEstimate: number;      // Raw estimate from Gemini
  thicknessEstimate: number;   // Raw estimate from Gemini
  freshnessScore: number;      // Raw estimate from Gemini
  overallScore: number;        // Raw estimate from Gemini
  commentText: string;         // Raw comment from Gemini
  isMaleFeature?: boolean;      // Derived from comment marker or subtype
  error?: string;             // Error message if analysis failed

  // Processed/derived values shown to user
  type: ObjectType;            // Confirmed object type (alias for objectType)
  length: number;              // Final adjusted/rounded length
  thickness: number;           // Final adjusted/rounded thickness
  freshness: number;           // Final adjusted/rounded freshness score
  score: number;               // Final calculated overall score
  comment: string;             // Final comment (might be same as commentText or generated fallback)

  // Optional fields
  truthAnalysis?: TruthAnalysisResult;
  originalImagePath?: string;   // User uploaded image path (temporary)
  shareImagePath?: string;      // Path for the image used in sharing

  // Allow additional properties for flexibility (like during random data generation)
  [key: string]: unknown;
}

// =================================
// Utility Configuration Types
// =================================

// Configuration Interface for TruthDetector settings
export interface TruthDetectorConfig {
  averageLengths: Record<string, number>;
  reasonableRatios: Record<string, number>;
  suspiciousThresholds: {
    truthScoreThreshold: number;
    lengthExceedRatio: number;
    otherRodMaxLength: number;
  };
  suspicionWeights: {
    lengthWeight: number;
    ratioWeight: number;
  };
  adjustmentSettings: {
    maxAdjustment: number;
    minAdjustmentFactor: number;
  };
  responses: {
    funnyResponses: string[];
    suspiciousFeatures: string[];
    suspicious: string[];
    reasonable: string[];
    general: string[];
    unidentified: string[];
  };
  dimensionLimits: {
    cucumber: {
      minLength: number; maxLength: number; minThickness: number; maxThickness: number;
      reasonableMinLength: number; reasonableMaxLength: number; reasonableMinThickness: number; reasonableMaxThickness: number;
    };
    banana: {
      minLength: number; maxLength: number; minThickness: number; maxThickness: number;
      reasonableMinLength: number; reasonableMaxLength: number; reasonableMinThickness: number; reasonableMaxThickness: number;
    };
    other_rod: {
      minLength: number; maxLength: number; minThickness: number; maxThickness: number;
      reasonableMinLength: number; reasonableMaxLength: number; reasonableMinThickness: number; reasonableMaxThickness: number;
      maleFeatureMinLength: number; maleFeatureMaxLength: number; maleFeatureMinThickness: number;
      nonMaleFeatureMaxLength: number; nonMaleFeatureMaxThickness: number;
    };
    default: {
      minLength: number; maxLength: number; minThickness: number; maxThickness: number;
      reasonableMinLength: number; reasonableMaxLength: number; reasonableMinThickness: number; reasonableMaxThickness: number;
    };
  };
}

// Options for CanvasImageGenerator class
export interface CanvasImageOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  isMobile: boolean;
  devicePixelRatio?: number;
  debug?: boolean;
} 