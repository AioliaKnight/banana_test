import { useCallback, useRef, useState, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiCheck, FiAlertCircle, FiCamera, FiRefreshCw } from 'react-icons/fi';
import Image from 'next/image';

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': [],
  'image/png': [],
  'image/webp': []
};

export interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  preview: string | null;
  onAnalyze: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function ImageUploader({ 
  onImageUpload, 
  preview, 
  onAnalyze, 
  loading, 
  error 
}: ImageUploaderProps) {
  const [fileRejected, setFileRejected] = useState<string | null>(null);
  const [isFileTooLarge, setIsFileTooLarge] = useState(false);
  
  // Reset file validation errors when a new image is successfully uploaded
  useEffect(() => {
    if (preview) {
      setFileRejected(null);
      setIsFileTooLarge(false);
    }
  }, [preview]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.file.size > MAX_FILE_SIZE) {
        setIsFileTooLarge(true);
        return;
      }
      
      if (rejection.errors?.some((e) => e.code === 'file-invalid-type')) {
        setFileRejected('檔案類型不支援');
        return;
      }
      
      setFileRejected('上傳失敗');
      return;
    }
    
    // Clear any previous errors
    setFileRejected(null);
    setIsFileTooLarge(false);
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Perform client-side validation
      if (file.size > MAX_FILE_SIZE) {
        setIsFileTooLarge(true);
        return;
      }
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    disabled: loading,
    maxSize: MAX_FILE_SIZE
  });

  // 參考用於直接啟動相機的input元素
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 處理相機拍照按鈕點擊
  const handleCameraClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // 處理從相機獲取的照片
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear validation errors
    setFileRejected(null);
    setIsFileTooLarge(false);
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setIsFileTooLarge(true);
        return;
      }
      
      // Validate file type
      if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
        setFileRejected('檔案類型不支援');
        return;
      }
      
      onImageUpload(file);
    }
  };

  // 重新上傳按鈕
  const handleRetry = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    setFileRejected(null);
    setIsFileTooLarge(false);
  }, []);

  // Determine error message to display
  const displayError = fileRejected || (isFileTooLarge ? '檔案大小超過限制 (最大 10MB)' : error);

  return (
    <div className="w-full">
      {!preview && (
        <>
          {/* 移動設備專用的相機按鈕 - 現在位於dropzone之外 */}
          <AnimatePresence>
            <motion.div 
              className="sm:hidden mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button 
                type="button"
                onClick={handleCameraClick}
                className="w-full flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-lg p-3 transition-colors"
                disabled={loading}
              >
                <FiCamera className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm text-blue-600">用手機相機拍照</span>
              </button>
              
              {/* 隱藏的相機input元素 */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
            </motion.div>
          </AnimatePresence>
        </>
      )}
      
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all ${
          isDragActive ? 'border-blue-500 bg-blue-50/50' : 
          isDragReject ? 'border-red-400 bg-red-50/50' : 
          'border-slate-200 hover:border-blue-300'
        } ${loading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        <div className="p-3 sm:p-6 text-center">
          {preview ? (
            <div className="relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-h-64 sm:max-h-80 mx-auto rounded-lg overflow-hidden flex justify-center"
              >
                <Image 
                  src={preview} 
                  alt="預覽圖片" 
                  width={500}
                  height={300}
                  priority
                  className="rounded-lg max-h-64 sm:max-h-80 w-auto object-contain"
                  style={{ maxHeight: '20rem' }}
                />
              </motion.div>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 sm:border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-white font-medium text-sm sm:text-base">AI分析中...</p>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 sm:py-10">
              <div className={`rounded-full p-3 sm:p-5 mb-3 sm:mb-4 ${isDragReject ? 'bg-red-50' : 'bg-blue-50'}`}>
                <FiUpload className={`w-5 h-5 sm:w-8 sm:h-8 ${isDragReject ? 'text-red-500' : 'text-blue-500'}`} />
              </div>
              <h3 className="mb-1 sm:mb-2 text-sm sm:text-lg font-medium text-slate-700">
                {isDragActive 
                  ? (isDragReject ? '不支援的檔案類型' : '放下你的小黃瓜或香蕉照片') 
                  : '上傳你的小黃瓜或香蕉照片'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-2 sm:mb-4">
                <span className="hidden sm:inline">拖放照片至此處，或</span>
                <span className="inline sm:hidden">點擊此區域</span>
                <span className="hidden sm:inline">點擊選擇檔案</span>
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                <p className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  支援 JPG, PNG, WEBP
                </p>
                <p className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  最大 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {displayError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-start text-red-600"
        >
          <FiAlertCircle className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium">{displayError}</p>
              
              {/* Add retry button for client-side errors */}
              {(fileRejected || isFileTooLarge) && (
                <button 
                  onClick={handleRetry}
                  className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                  aria-label="重試"
                >
                  <FiRefreshCw size={16} />
                </button>
              )}
            </div>
            
            {/* 錯誤相關建議 */}
            {displayError.includes('多個物體') && (
              <p className="text-xs mt-1 text-red-500">
                建議：請確保照片中只有一個小黃瓜或香蕉，並盡量避免其他物體出現在畫面中。
              </p>
            )}
            
            {displayError.includes('質量不佳') && (
              <p className="text-xs mt-1 text-red-500">
                建議：請在光線充足的環境中拍攝，避免模糊、過暗或過亮的照片。
              </p>
            )}
            
            {displayError.includes('無法辨識') && (
              <p className="text-xs mt-1 text-red-500">
                建議：請確保上傳的是完整的小黃瓜或香蕉照片，目前僅支援這兩種物品的分析。
              </p>
            )}
            
            {displayError.includes('超時') && (
              <p className="text-xs mt-1 text-red-500">
                建議：伺服器可能暫時繁忙，請稍後再試，或檢查您的網路連接。
              </p>
            )}
            
            {isFileTooLarge && (
              <p className="text-xs mt-1 text-red-500">
                建議：請壓縮圖片或選擇較小的檔案（小於10MB）。
              </p>
            )}
            
            {fileRejected === '檔案類型不支援' && (
              <p className="text-xs mt-1 text-red-500">
                建議：請選擇JPG、PNG或WEBP格式的圖片檔案。
              </p>
            )}
          </div>
        </motion.div>
      )}
      
      {preview && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 sm:mt-6 flex justify-center"
        >
          <button
            onClick={onAnalyze}
            className="btn btn-primary flex items-center justify-center gap-2 py-2 sm:py-3 px-6 w-full sm:w-auto min-h-10 sm:min-h-12 text-sm sm:text-base"
            disabled={loading}
          >
            <FiCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            開始分析
          </button>
        </motion.div>
      )}
    </div>
  );
} 