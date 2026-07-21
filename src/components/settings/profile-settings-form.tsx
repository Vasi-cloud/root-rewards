"use client";

import { Camera, Check, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { setProfileOverrides } from "@/lib/profile-storage";

const MAX_PHOTO_BYTES = 800_000; // ~0.8MB for device preview

function initialsFrom(name: string, email: string) {
  const base = name.trim() || email.split("@")[0] || "M";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

export function ProfileSettingsForm() {
  const { user, profile, updateProfileDetails } = useAuth();
  const fileId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const email = user?.email ?? profile?.email ?? "";
  const [displayName, setDisplayName] = useState(
    profile?.displayName ?? email.split("@")[0] ?? ""
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    profile?.photoURL ?? null
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? email.split("@")[0] ?? "");
    setPhotoPreview(profile?.photoURL ?? null);
  }, [profile?.displayName, profile?.photoURL, email]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateProfileDetails({
        displayName,
        photoURL: photoPreview,
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  function onPickPhoto(file: File | undefined) {
    setPhotoNote(null);
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Image is too large — please use a photo under 800 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setPhotoPreview(result);
      setPhotoNote(
        "Preview saved on this device. Cloud photo sync is coming soon."
      );
      if (user) {
        setProfileOverrides(user.uid, { photoPreview: result });
      }
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPhotoPreview(null);
    setPhotoNote("Photo removed from this device.");
    if (user) {
      setProfileOverrides(user.uid, { photoPreview: null });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const initials = initialsFrom(displayName, email);

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <div className="relative">
            <Avatar
              size="lg"
              className="size-20 ring-2 ring-emerald-200/80 transition-transform duration-200 hover:scale-[1.02] sm:size-24"
            >
              {photoPreview ? (
                <AvatarImage src={photoPreview} alt="" />
              ) : null}
              <AvatarFallback className="bg-emerald-100 font-heading text-lg text-emerald-900 sm:text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -right-1 -bottom-1 inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-colors hover:bg-emerald-50"
              aria-label="Upload profile photo"
            >
              <Camera className="size-3.5" />
            </button>
          </div>
          <input
            ref={fileRef}
            id={fileId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => onPickPhoto(e.target.files?.[0])}
          />
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              Change photo
            </Button>
            {photoPreview && (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={clearPhoto}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="max-w-[14rem] text-center text-[11px] leading-relaxed text-muted-foreground sm:text-left">
            Photo upload is a device preview for now — we never claim cloud
            sync until it ships.
          </p>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-display-name">Display name</Label>
            <Input
              id="settings-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={120}
              placeholder="How you appear on Forest Buddies"
              autoComplete="nickname"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              value={email}
              readOnly
              disabled
              className="bg-muted/40"
            />
            <p className="text-xs text-muted-foreground">
              Email is managed by your sign-in provider and can&apos;t be
              changed here yet.
            </p>
          </div>
        </div>
      </div>

      {photoNote && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-950">
          {photoNote}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={saving || !displayName.trim()}>
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : saved ? (
            <>
              <Check className="size-3.5" />
              Saved
            </>
          ) : (
            "Save profile"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Changes apply across your dashboard and marketplace profile.
        </p>
      </div>
    </form>
  );
}
