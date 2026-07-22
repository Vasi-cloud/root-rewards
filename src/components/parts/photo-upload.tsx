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
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Label htmlFor="part-photos">Photos of the part</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Up to {MAX_PART_PHOTOS} angles of the same part — labels and
            connectors help Leafy most.
          </p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {photos.length}/{MAX_PART_PHOTOS}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted/30"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.previewUrl}
              alt={photo.name}
              className="size-full object-cover"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removePhoto(photo.id)}
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-foreground/75 text-background opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              aria-label={`Remove ${photo.name}`}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/40 px-3 text-center text-sm text-emerald-950 transition-colors hover:border-emerald-500 hover:bg-emerald-50",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-800/10 text-emerald-800">
              {photos.length === 0 ? (
                <Camera className="size-5" />
              ) : (
                <ImagePlus className="size-5" />
              )}
            </span>
            <span className="font-medium leading-tight">
              {photos.length === 0 ? "Add photos" : "Add another"}
            </span>
          </button>
        )}
      </div>

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

      {photos.length === 0 && (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 sm:w-auto"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="size-4" />
          Choose up to {MAX_PART_PHOTOS} photos
        </Button>
      )}
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
