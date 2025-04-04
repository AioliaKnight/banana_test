import { motion } from 'framer-motion';

export interface LoadingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'large';
  overlay?: boolean;
  dark?: boolean;
}

export default function LoadingIndicator({ 
  message = '載入中...',
  size = 'md',
  overlay = false,
  dark = false
}: LoadingIndicatorProps) {
  // Map size options to actual dimensions
  const sizeMap = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-10 h-10 border-3',
    large: 'w-12 h-12 border-4'
  };

  // Get size class or default to medium if invalid
  const spinnerSize = sizeMap[size] || sizeMap.md;
  
  // Determine colors based on dark mode
  const spinnerColor = dark 
    ? 'border-white border-t-transparent' 
    : 'border-emerald-500 border-t-transparent';
  
  const textColor = dark ? 'text-white' : 'text-gray-700';

  // Create the spinner component
  const Spinner = () => (
    <div 
      className={`${spinnerSize} ${spinnerColor} rounded-full animate-spin`}
      role="status"
      aria-label="loading"
    />
  );

  // If in overlay mode, show spinner in a centered overlay
  if (overlay) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <Spinner />
          {message && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`mt-4 font-medium ${dark ? 'text-white' : 'text-gray-100'}`}
            >
              {message}
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  // Standard display for non-overlay mode
  return (
    <div className="flex flex-col items-center">
      <Spinner />
      {message && (
        <p className={`mt-3 font-medium ${textColor}`}>{message}</p>
      )}
    </div>
  );
} 