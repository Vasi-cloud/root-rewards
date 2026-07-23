"use client";

import { Camera, ImagePlus, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_PART_PHOTOS } from "@/lib/leafy-parts";
import { cn } from "@/lib/utils";

export type PartPhoto = {
  id: string;
  previewUrl: string;
  name: string;
};

type PhotoUploadProps = {
  photos: PartPhoto[];
  onChange: (photos: PartPhoto[]) => void;
  disabled?: boolean;
};

export function PhotoUpload({ photos, onChange, disabled }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = MAX_PART_PHOTOS - photos.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || remaining <= 0) return;
    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);

    const next: PartPhoto[] = [];
    for (const file of files) {
      const previewUrl = await readAsDataUrl(file);
      next.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        previewUrl,
        name: file.name,
      });
    }
    onChange([...photos, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removePhoto(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Label htmlFor="part-photos">Photos of the part</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Add up to {MAX_PART_PHOTOS} photos. Thumbnails appear below — tap ×
            to remove any shot.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium tabular-nums text-emerald-900">
          {photos.length}/{MAX_PART_PHOTOS}
        </span>
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="min-w-0">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-xs ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Part photo ${index + 1}: ${photo.name}`}
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-full bg-foreground/80 text-background shadow-md transition-colors hover:bg-destructive disabled:opacity-50"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <X className="size-4" strokeWidth={2.5} />
                </button>
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-foreground/70 px-1.5 py-0.5 text-[10px] font-medium text-background">
                  {index + 1}/{MAX_PART_PHOTOS}
                </span>
              </div>
              <p
                className="mt-1.5 truncate text-[11px] text-muted-foreground"
                title={photo.name}
              >
                {photo.name}
              </p>
            </li>
          ))}

          {remaining > 0 && (
            <li>
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/40 px-3 text-center text-sm text-emerald-950 transition-colors hover:border-emerald-500 hover:bg-emerald-50",
                  disabled && "pointer-events-none opacity-50"
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-800/10 text-emerald-800">
                  <ImagePlus className="size-5" />
                </span>
                <span className="font-medium leading-tight">Add another</span>
              </button>
            </li>
          )}
        </ul>
      )}

      {photos.length === 0 && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/30 px-4 py-10 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50/60",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm">
            <Camera className="size-6" />
          </span>
          <div>
            <p className="font-medium text-emerald-950">
              Snap or choose photos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG or PNG · up to {MAX_PART_PHOTOS} images
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 pointer-events-none"
            tabIndex={-1}
          >
            <Camera className="size-4" />
            Choose photos
          </Button>
        </button>
      )}

      <input
        ref={inputRef}
        id="part-photos"
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="sr-only"
        disabled={disabled || remaining <= 0}
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
