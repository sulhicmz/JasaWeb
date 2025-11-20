import React, { useState, useRef, useEffect } from 'react';

interface MobileFileUploadProps {
  onUpload?: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

const MobileFileUpload: React.FC<MobileFileUploadProps> = ({
  onUpload,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'application/pdf', '.doc,.docx,.txt'],
  className = '',
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if camera is available
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === 'videoinput'
        );
        setCameraAvailable(videoDevices.length > 0);
      } catch (error) {
        console.log('Camera not available:', error);
        setCameraAvailable(false);
      }
    };

    checkCamera();
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(
      0,
      maxFiles - selectedFiles.length
    );
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return 'fa-image';
    if (file.type === 'application/pdf') return 'fa-file-pdf';
    if (
      file.type.includes('word') ||
      file.name.endsWith('.doc') ||
      file.name.endsWith('.docx')
    )
      return 'fa-file-word';
    if (file.type.includes('text') || file.name.endsWith('.txt'))
      return 'fa-file-alt';
    return 'fa-file';
  };

  const simulateUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setUploadProgress(i);
    }

    setIsUploading(false);

    if (onUpload) {
      onUpload(selectedFiles);
    }

    // Clear files after successful upload
    setSelectedFiles([]);
    setUploadProgress(0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <i className="fas fa-cloud-upload-alt text-2xl text-gray-400"></i>
          </div>

          {/* Upload Text */}
          <div>
            <p className="text-lg font-medium text-gray-900">Upload files</p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop or tap to select files
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <i className="fas fa-folder-open mr-2"></i>
              Browse Files
            </button>

            {cameraAvailable && (
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <i className="fas fa-camera mr-2"></i>
                Take Photo
              </button>
            )}
          </div>

          {/* File Type Info */}
          <p className="text-xs text-gray-400">
            Max {maxFiles} files • {acceptedTypes.join(', ')}
          </p>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {selectedFiles.map((file, index) => (
              <div key={index} className="p-4 flex items-center gap-3">
                {/* File Icon */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${getFileIcon(file)} text-gray-600`}></i>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove file"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={simulateUpload}
              disabled={isUploading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Uploading... {uploadProgress}%</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-upload"></i>
                  <span>
                    Upload {selectedFiles.length} File
                    {selectedFiles.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </button>

            {/* Progress Bar */}
            {isUploading && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          <i className="fas fa-lightbulb mr-2"></i>
          Upload Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Photos are automatically optimized for mobile viewing</li>
          <li>• You can upload multiple files at once</li>
          <li>• Large files may take longer to upload</li>
          <li>• All files are securely stored and encrypted</li>
        </ul>
      </div>
    </div>
  );
};

export default MobileFileUpload;
