"use client";

import { useRef, useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { IconCamera, IconUpload } from "@/components/icons/nutrivision-icons";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { compressImageFile, type CapturedImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  open: boolean;
  onClose: () => void;
  onOpenCamera?: () => void;
  onImageSelected: (image: CapturedImage) => void;
}

export function ImageUploader({ open, onClose, onOpenCamera, onImageSelected }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setIsProcessing(true);
    try {
      const image = await compressImageFile(file);
      onImageSelected(image);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="mx-auto max-w-lg pb-safe">
        <DrawerHeader>
          <DrawerTitle>Upload a photo</DrawerTitle>
          <DrawerDescription>
            Choose an image from your gallery and {APP_NAME} will identify what&apos;s on your plate.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-3 px-4 pb-6">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-left transition active:scale-[0.98]",
              isDragging && "border-nv-lime bg-nv-lime/5"
            )}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-nv-carbs/20 text-nv-carbs">
              {isProcessing ? (
                <span className="size-6 animate-spin rounded-full border-2 border-nv-carbs border-t-transparent" />
              ) : (
                <IconUpload size={24} />
              )}
            </span>
            <span className="flex flex-col">
              <span className="font-medium">Upload from gallery</span>
              <span className="text-sm text-muted-foreground">Tap to browse or drag a photo here</span>
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </label>

          {onOpenCamera && (
            <button
              type="button"
              onClick={onOpenCamera}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 text-left transition active:scale-[0.98] active:bg-muted"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-nv-lime/20">
                <IconCamera size={24} className="text-nv-lime-dark" />
              </span>
              <span className="flex flex-col">
                <span className="font-medium">Use camera instead</span>
                <span className="text-sm text-muted-foreground">Take a live photo of your meal</span>
              </span>
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
