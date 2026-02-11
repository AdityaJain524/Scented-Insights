import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface AvatarUploaderProps {
  currentUrl?: string | null;
  userId: string;
  displayName: string;
  onUploadComplete: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUploader({
  currentUrl,
  userId,
  displayName,
  onUploadComplete,
  size = 'md',
}: AvatarUploaderProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const url = await uploadImage(file, 'avatars', userId);
    if (url) {
      onUploadComplete(url);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], 'border-4 border-card shadow-elevated')}>
        <AvatarImage src={currentUrl || undefined} />
        <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

interface PostImageUploaderProps {
  userId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function PostImageUploader({
  userId,
  images,
  onImagesChange,
  maxImages = 4,
}: PostImageUploaderProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = files.slice(0, remainingSlots);

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
        continue;
      }

      const url = await uploadImage(file, 'post-images', userId);
      if (url) {
        onImagesChange([...images, url]);
      }
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Upload ${index + 1}`}
              className="h-24 w-24 object-cover rounded-lg border border-border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {images.length < maxImages && (
          <Button
            variant="outline"
            className="h-24 w-24 flex-col gap-2"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Add Photo</span>
              </>
            )}
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

interface CommentImageUploaderProps {
  userId: string;
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export function CommentImageUploader({
  userId,
  imageUrl,
  onImageChange,
}: CommentImageUploaderProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      return;
    }

    const url = await uploadImage(file, 'comment-images', userId);
    if (url) {
      onImageChange(url);
    }
  };

  if (imageUrl) {
    return (
      <div className="relative inline-block">
        <img
          src={imageUrl}
          alt="Comment attachment"
          className="h-16 w-16 object-cover rounded-lg border border-border"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
          onClick={() => onImageChange(null)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
