import { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FiUpload, FiCheck, FiAlertCircle, FiCamera } from 'react-icons/fi';

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
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxFiles: 1,
    disabled: loading
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
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onImageUpload(file);
    }
  };

  return (
    <div className="w-full">
      {!preview && (
        <>
          {/* 移動設備專用的相機按鈕 - 現在位於dropzone之外 */}
          <div className="sm:hidden mb-4">
            <button 
              type="button"
              onClick={handleCameraClick}
              className="w-full flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-lg p-3 transition-colors"
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
          </div>
        </>
      )}
      
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all ${
          isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'
        } ${loading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        <div className="p-4 sm:p-8 text-center">
          {preview ? (
            <div className="relative">
              <motion.img 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={preview} 
                alt="預覽圖片" 
                className="max-h-64 sm:max-h-80 mx-auto rounded-lg object-contain"
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 sm:border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-white font-medium text-sm sm:text-base">AI分析中...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 sm:py-10">
              <div className="bg-blue-50 rounded-full p-4 sm:p-5 mb-4">
                <FiUpload className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
              <h3 className="mb-2 text-base sm:text-lg font-medium text-slate-700">
                {isDragActive ? '放下你的小黃瓜或香蕉照片' : '上傳你的小黃瓜或香蕉照片'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                <span className="hidden sm:inline">拖放照片至此處，或</span>點擊選擇檔案
              </p>
              
              <p className="text-xs text-slate-400">
                支援 JPG, PNG, WEBP (最大 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-start text-red-600"
        >
          <FiAlertCircle className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{error}</p>
            
            {/* 錯誤相關建議 */}
            {error.includes('多個物體') && (
              <p className="text-xs mt-1 text-red-500">
                建議：請確保照片中只有一個小黃瓜或香蕉，並盡量避免其他物體出現在畫面中。
              </p>
            )}
            
            {error.includes('質量不佳') && (
              <p className="text-xs mt-1 text-red-500">
                建議：請在光線充足的環境中拍攝，避免模糊、過暗或過亮的照片。
              </p>
            )}
            
            {error.includes('無法辨識') && (
              <p className="text-xs mt-1 text-red-500">
                建議：請確保上傳的是完整的小黃瓜或香蕉照片，目前僅支援這兩種物品的分析。
              </p>
            )}
            
            {error.includes('超時') && (
              <p className="text-xs mt-1 text-red-500">
                建議：伺服器可能暫時繁忙，請稍後再試，或檢查您的網路連接。
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
            className="btn btn-primary flex items-center justify-center gap-2 py-3 px-6 w-full sm:w-auto min-h-12 text-base"
            disabled={loading}
          >
            <FiCheck className="h-5 w-5" />
            開始分析
          </button>
        </motion.div>
      )}
    </div>
  );
} 