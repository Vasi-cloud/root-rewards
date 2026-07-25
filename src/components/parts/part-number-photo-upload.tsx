"use client";

import { Hash, X } from "lucide-react";
import { useRef } from "react";

import { Label } from "@/components/ui/label";
import type { PartPhoto } from "@/components/parts/photo-upload";
import { cn } from "@/lib/utils";

type PartNumberPhotoUploadProps = {
  photo: PartPhoto | null;
  onChange: (photo: PartPhoto | null) => void;
  disabled?: boolean;
};

export function PartNumberPhotoUpload({
  photo,
  onChange,
  disabled,
}: PartNumberPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(fileList: FileList | null) {
    if (!fileList?.[0]) return;
    const file = fileList[0];
    if (!file.type.startsWith("image/")) return;
    const previewUrl = await readAsDataUrl(file);
    onChange({
      id: `oem-photo-${Date.now()}`,
      previewUrl,
      name: file.name,
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 px-3.5 py-3.5 sm:px-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-800/10 text-emerald-900">
          <Hash className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <Label htmlFor="part-number-photo" className="text-sm font-medium">
            Optional: Photo of the part number
          </Label>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            A sharp close-up of the stamped or printed OEM number helps Leafy
            match more accurately. Main part photos stay the primary method.
          </p>

          {photo ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-background shadow-xs sm:size-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Part number photo: ${photo.name}`}
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(null)}
                  className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-foreground/80 text-background shadow-md hover:bg-destructive disabled:opacity-50"
                  aria-label="Remove part number photo"
                >
                  <X className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {photo.name}
                </p>
                <button
                  type="button"
                  disabled={disabled}
                  className="mt-1 text-xs font-medium text-emerald-800 underline-offset-2 hover:underline disabled:opacity-50"
                  onClick={() => inputRef.current?.click()}
                >
                  Replace photo
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300/80 bg-white/70 px-3 py-3 text-sm text-emerald-950 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              <Hash className="size-4 text-emerald-800" />
              <span className="font-medium">Add part-number photo</span>
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        id="part-number-photo"
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => void handleFile(e.target.files)}
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
