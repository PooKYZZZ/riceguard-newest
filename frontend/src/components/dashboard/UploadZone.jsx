import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';

const UploadZone = ({
  onImageSelect,
  preview,
  isDragActive = false,
  maxSize = 8 * 1024 * 1024, // 8MB default
  acceptedTypes = ['image/*'],
  className,
  disabled = false,
  ...props
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragging(false);
    }
  }, [disabled, dragCounter]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
  }, [disabled]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setIsDragging(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const isValidType = acceptedTypes.some(type => {
        if (type === 'image/*') return file.type.startsWith('image/');
        return file.type === type;
      });
      return isValidType && file.size <= maxSize;
    });

    if (validFiles.length > 0) {
      onImageSelect({ target: { files: [validFiles[0]] } });
    }
  }, [onImageSelect, acceptedTypes, maxSize, disabled]);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      onImageSelect(e);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    if (preview) {
      return (
        <div className="relative">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }

    if (isDragging) {
      return (
        <div className="animate-bounce-gentle">
          <svg className="w-12 h-12 text-rice-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      );
    }

    return (
      <svg className="w-12 h-12 text-gray-400 group-hover:text-rice-primary-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  };

  return (
    <div
      className={cn(
        'relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-rice-primary-500 focus:ring-offset-2',
        isDragging && !disabled ? 'scale-105 ring-4 ring-rice-primary-500 ring-opacity-50 animate-pulse-slow' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className
      )}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload image area"
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      {...props}
    >
      <div className={cn(
        'glass min-h-96 min-w-72 p-8 flex flex-col items-center justify-center',
        'border-2 border-dashed transition-all duration-200',
        isDragging && !disabled ? 'border-rice-primary-500 bg-rice-primary-50/30' : 'border-gray-300 hover:border-rice-primary-400',
        'hover:bg-gray-50/50',
        disabled ? 'hover:border-gray-300 hover:bg-transparent' : ''
      )}>
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Uploaded rice leaf preview"
              className="w-full h-full object-cover rounded-xl shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end justify-center pb-6">
              <div className="text-white text-center">
                <div className="mb-2">{getStatusIcon()}</div>
                <p className="text-sm font-medium">Click to change image</p>
              </div>
            </div>
            {/* Upload success indicator */}
            <div className="absolute top-4 right-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-700 group-hover:text-rice-primary-700 transition-colors duration-200">
                {isDragging ? 'Drop your image here' : 'Upload Rice Leaf Image'}
              </h3>
              <p className="text-sm text-gray-500">
                {isDragging ? 'Release to upload' : 'Drag and drop or click to browse'}
              </p>
            </div>

            <div className="text-xs text-gray-400 space-y-2 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-center space-x-4">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Clear, well-lit photos
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Max size: {formatFileSize(maxSize)}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-4">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  JPG, PNG, GIF
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Focus on affected areas
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="sr-only"
        aria-label="Image file input"
        disabled={disabled}
      />

      {/* Loading overlay for drag state */}
      {isDragging && !disabled && (
        <div className="absolute inset-0 bg-rice-primary-500/10 rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="text-rice-primary-600 font-medium text-lg animate-pulse">
            Drop to upload
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;