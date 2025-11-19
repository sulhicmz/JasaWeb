import React, { useState, useRef, useCallback } from 'react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

export interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onUpload?: (files: File[]) => Promise<void>;
  onFileSelect?: (files: FileUploadItem[]) => void;
  onFileRemove?: (id: string) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUploader({
  accept = '*/*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  onUpload,
  onFileSelect,
  onFileRemove,
  className,
  disabled = false,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }
    return null;
  };

  const createFileItem = (file: File): FileUploadItem => ({
    file,
    id: Math.random().toString(36).substr(2, 9),
    progress: 0,
    status: 'pending',
  });

  const handleFiles = useCallback(
    (newFiles: FileList) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(newFiles).forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        alert(errors.join('\n'));
      }

      if (validFiles.length === 0) return;

      const currentFileCount = files.length;
      const availableSlots = maxFiles - currentFileCount;
      const filesToAdd = validFiles.slice(0, availableSlots);

      if (filesToAdd.length < validFiles.length) {
        alert(
          `Only ${maxFiles} files allowed. ${validFiles.length - filesToAdd.length} files were ignored.`
        );
      }

      const newFileItems = filesToAdd.map(createFileItem);
      const updatedFiles = multiple
        ? [...files, ...newFileItems]
        : newFileItems;

      setFiles(updatedFiles);
      onFileSelect?.(updatedFiles);
    },
    [files, maxFiles, multiple, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = files.filter((file) => file.id !== id);
      setFiles(updatedFiles);
      onFileRemove?.(id);
    },
    [files, onFileRemove]
  );

  const uploadFiles = useCallback(async () => {
    const filesToUpload = files.filter((f) => f.status === 'pending');

    for (const fileItem of filesToUpload) {
      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'uploading' as const } : f
          )
        );

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setFiles((prev) =>
            prev.map((f) => (f.id === fileItem.id ? { ...f, progress } : f))
          );
        }

        // Mark as success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'success' as const } : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error:
                    error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
      }
    }

    // Call onUpload with successful files
    const successfulFiles = files
      .filter((f) => f.status === 'success')
      .map((f) => f.file);

    if (successfulFiles.length > 0) {
      onUpload?.(successfulFiles);
    }
  }, [files, onUpload]);

  return (
    <div className={cn('w-full', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span>{' '}
            or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {accept !== '*/*' && `Accepted formats: ${accept}`}
            {maxSize && ` • Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`}
            {maxFiles && ` • Max files: ${maxFiles}`}
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Files
            </h4>
            {files.some((f) => f.status === 'pending') && (
              <button
                onClick={uploadFiles}
                disabled={disabled}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Upload {files.filter((f) => f.status === 'pending').length}{' '}
                file(s)
              </button>
            )}
          </div>

          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileItem.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(fileItem.file.size / 1024).toFixed(1)} KB
                </p>

                {/* Progress Bar */}
                {fileItem.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${fileItem.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Status */}
                {fileItem.status === 'success' && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Uploaded successfully
                  </p>
                )}
                {fileItem.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    ✗ {fileItem.error}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeFile(fileItem.id)}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
