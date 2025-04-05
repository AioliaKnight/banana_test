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