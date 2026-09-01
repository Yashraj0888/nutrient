"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconCamera,
  IconClose,
  IconFlash,
  IconGallery,
  IconRefresh,
} from "@/components/icons/nutrivision-icons";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { captureFrameFromVideo, type CapturedImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (image: CapturedImage) => void;
  onGallery?: () => void;
}

export function CameraModal({ open, onClose, onCapture, onGallery }: CameraModalProps) {
  if (!open) return null;

  return (
    <CameraModalInner key="camera-open" onClose={onClose} onCapture={onCapture} onGallery={onGallery} />
  );
}

function CameraModalInner({
  onClose,
  onCapture,
  onGallery,
}: {
  onClose: () => void;
  onCapture: (image: CapturedImage) => void;
  onGallery?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch {
        if (!cancelled) {
          setError("Camera access was denied or is unavailable. Try uploading a photo instead.");
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  function handleShutter() {
    if (!videoRef.current || !ready) return;
    const image = captureFrameFromVideo(videoRef.current);
    stopStream();
    onCapture(image);
  }

  return (
    <Dialog open onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-full! h-[100dvh] w-full max-h-[100dvh] gap-0 rounded-none border-0 bg-black p-0 sm:h-[100dvh] sm:max-w-full"
      >
        <DialogTitle className="sr-only">Scan your food</DialogTitle>
        <div className="relative flex h-full w-full flex-col bg-black">
          <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-5 pt-safe pt-5 pb-8">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
                aria-label="Close"
              >
                <IconClose size={20} />
              </button>
              <h2 className="text-base font-bold text-white">Scan Your Food</h2>
              <div className="size-10" />
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              className={cn("h-full w-full object-cover", facingMode === "user" && "-scale-x-100")}
              muted
              playsInline
            />
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-8 text-center text-sm text-white">
                {error}
              </div>
            ) : (
              <>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-[55%] w-[80%] max-w-sm">
                    <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-lg border-t-[3px] border-l-[3px] border-white" />
                    <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-lg border-t-[3px] border-r-[3px] border-white" />
                    <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-[3px] border-l-[3px] border-white" />
                    <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-[3px] border-r-[3px] border-white" />
                    <div className="scan-line absolute inset-x-4 h-0.5 bg-nv-lime shadow-[0_0_12px_var(--nv-lime-glow)]" />
                  </div>
                </div>
                <p className="absolute inset-x-0 bottom-32 text-center text-sm text-white/80">
                  Make sure the lighting is good.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center justify-between bg-black/50 px-8 pb-safe pt-4 pb-8 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setFlashOn((f) => !f)}
              className={cn(
                "flex size-12 items-center justify-center rounded-full text-white transition",
                flashOn ? "bg-nv-lime/30" : "bg-white/10"
              )}
              aria-label="Toggle flash"
            >
              <IconFlash size={22} />
            </button>

            <button
              type="button"
              onClick={handleShutter}
              disabled={!ready}
              aria-label="Take photo"
              className="nv-fab-scan flex size-20 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-40"
            >
              <IconCamera size={28} className="text-[#1a2e05]" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onGallery) onGallery();
                else {
                  setReady(false);
                  setError(null);
                  setFacingMode((f) => (f === "environment" ? "user" : "environment"));
                }
              }}
              className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label={onGallery ? "Open gallery" : "Switch camera"}
            >
              {onGallery ? <IconGallery size={22} /> : <IconRefresh size={22} />}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
