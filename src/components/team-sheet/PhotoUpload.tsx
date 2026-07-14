'use client';

import { useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';

interface PhotoUploadProps {
  currentPhoto: string;
  onPhotoChange: (file: File) => void;
  onClear?: () => void;
}

export default function PhotoUpload({ currentPhoto, onPhotoChange, onClear }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB.');
      return;
    }

    setIsLoading(true);
    
    // Create a blob for the component to handle compression
    const blob = file.slice(0, file.size, file.type);
    onPhotoChange(blob as File);
    
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      {/* Photo Preview */}
      <div
        className={`relative w-full aspect-square rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden ${
          isDragging ? 'border-gaa-green bg-green-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentPhoto ? (
          <>
            <img
              src={currentPhoto}
              alt="Player photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {onClear && (
                <button
                  onClick={onClear}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                title="Change photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            {isLoading ? (
              <div className="animate-pulse flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Processing...</p>
              </div>
            ) : (
              <>
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-1">Drop photo here</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-gaa-green hover:underline"
                >
                  or click to browse
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Info Text */}
      <p className="text-[10px] text-gray-400 text-center">
        JPEG, PNG, or WebP • Max 5MB • Auto-compressed
      </p>
    </div>
  );
}
