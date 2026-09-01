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
  onOpenCamera: () => void;
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
          <DrawerTitle>Log a meal</DrawerTitle>
          <DrawerDescription>
            Snap a photo or upload one from your gallery and {APP_NAME} will identify what&apos;s on
            your plate.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-3 px-4 pb-6">
          <button
            type="button"
            onClick={onOpenCamera}
            className="tap-target flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 text-left transition active:scale-[0.98] active:bg-muted"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-nv-lime/20 text-nv-lime-dark">
              <IconCamera size={24} />
            </span>
            <span className="flex flex-col">
              <span className="font-medium">Take a photo</span>
              <span className="text-sm text-muted-foreground">Use your camera to capture the meal</span>
            </span>
          </button>

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
              "tap-target flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-left transition active:scale-[0.98] active:bg-muted",
              isDragging && "border-primary bg-primary/5"
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
              <span className="text-sm text-muted-foreground">Choose an existing photo, or drag one here</span>
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </label>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
