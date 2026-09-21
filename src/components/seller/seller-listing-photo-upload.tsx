"use client";

import { Camera, ImagePlus, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const MAX_LISTING_PHOTOS = 4;

export type ListingPhoto = {
  id: string;
  previewUrl: string;
  name: string;
};

type SellerListingPhotoUploadProps = {
  photos: ListingPhoto[];
  onChange: (photos: ListingPhoto[]) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
};

export function SellerListingPhotoUpload({
  photos,
  onChange,
  disabled,
  label = "Listing photos",
  hint = "Up to 4 photos. The first image is the card thumbnail on Marketplace and your shop.",
}: SellerListingPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = MAX_LISTING_PHOTOS - photos.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || remaining <= 0) return;
    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);

    const next: ListingPhoto[] = [];
    for (const file of files) {
      const previewUrl = await readAsDataUrl(file);
      next.push({
        id: `listing-photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium tabular-nums text-emerald-900">
          {photos.length}/{MAX_LISTING_PHOTOS}
        </span>
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="min-w-0">
              <div className="relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Listing photo ${index + 1}`}
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-foreground/80 text-background shadow-md hover:bg-destructive disabled:opacity-50"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <X className="size-3.5" strokeWidth={2.5} />
                </button>
                {index === 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Thumbnail
                  </span>
                ) : (
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-foreground/70 px-1.5 py-0.5 text-[10px] font-medium text-background">
                    {index + 1}/{MAX_LISTING_PHOTOS}
                  </span>
                )}
              </div>
            </li>
          ))}

          {remaining > 0 && (
            <li>
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/40 px-2 text-center text-xs text-emerald-950 hover:border-emerald-500 hover:bg-emerald-50",
                  disabled && "pointer-events-none opacity-50"
                )}
              >
                <ImagePlus className="size-5 text-emerald-800" />
                <span className="font-medium">Add photo</span>
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
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/30 px-4 py-8 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50/60",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald-800 text-cream">
            <Camera className="size-5" />
          </span>
          <p className="text-sm font-medium text-emerald-950">
            Add 1–4 photos
          </p>
          <p className="text-xs text-muted-foreground">
            JPG or PNG · stored with your listing
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-none gap-1.5"
            tabIndex={-1}
          >
            <Camera className="size-3.5" />
            Choose images
          </Button>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
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

export function listingPhotosFromProduct(product: {
  imageUrl?: string;
  gallery?: string[];
}): ListingPhoto[] {
  const urls =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : product.imageUrl?.trim()
        ? [product.imageUrl.trim()]
        : [];
  return urls.slice(0, MAX_LISTING_PHOTOS).map((previewUrl, index) => ({
    id: `existing-${index}-${previewUrl.slice(0, 24)}`,
    previewUrl,
    name: index === 0 ? "Thumbnail" : `Photo ${index + 1}`,
  }));
}
