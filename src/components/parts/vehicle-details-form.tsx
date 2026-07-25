"use client";

import { BookmarkCheck, BookmarkX, Car } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  YEAR_MAX,
  YEAR_MIN,
  VEHICLE_CATALOG,
  VEHICLE_MAKE_IDS,
  formatVehicleLabel,
  modelsForMake,
  yearsForModel,
  type VehicleDetails,
  type VehicleMakeId,
} from "@/lib/leafy-parts";

const selectClass =
  "flex h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

type VehicleDetailsFormProps = {
  value: VehicleDetails;
  onChange: (next: VehicleDetails) => void;
  disabled?: boolean;
  /** True when a profile is stored on this device */
  hasSavedProfile?: boolean;
  /** True when the form matches the saved profile */
  matchesSavedProfile?: boolean;
  onSaveVehicle?: () => void;
  onClearSavedVehicle?: () => void;
};

export function VehicleDetailsForm({
  value,
  onChange,
  disabled,
  hasSavedProfile,
  matchesSavedProfile,
  onSaveVehicle,
  onClearSavedVehicle,
}: VehicleDetailsFormProps) {
  const models = modelsForMake(value.makeId);
  const yearOptions = yearsForModel(value.makeId, value.modelId);
  const canSave = Boolean(
    value.makeId && value.modelId && value.year && onSaveVehicle
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Vehicle details
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose Make first — Model and Year update for that brand (strong EU
          coverage: Renault, Peugeot, Citroën, Dacia, VW, Škoda, SEAT, Audi,
          BMW, Mercedes-Benz, and more). Catalog years {YEAR_MIN}–{YEAR_MAX}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="parts-make">Make</Label>
          <select
            id="parts-make"
            className={selectClass}
            disabled={disabled}
            value={value.makeId}
            onChange={(e) => {
              const makeId = e.target.value as VehicleMakeId | "";
              onChange({
                ...value,
                makeId,
                modelId: "",
                year: "",
              });
            }}
            required
          >
            <option value="">Select make</option>
            {VEHICLE_MAKE_IDS.map((id) => (
              <option key={id} value={id}>
                {VEHICLE_CATALOG[id].label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="parts-model">Model</Label>
          <select
            id="parts-model"
            key={value.makeId || "no-make"}
            className={selectClass}
            disabled={disabled || !value.makeId}
            value={value.modelId}
            onChange={(e) => {
              const modelId = e.target.value;
              const years = yearsForModel(value.makeId, modelId);
              const yearStillValid = years.includes(value.year);
              onChange({
                ...value,
                modelId,
                year: yearStillValid ? value.year : "",
              });
            }}
            required
          >
            <option value="">
              {value.makeId ? "Select model" : "Choose make first"}
            </option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="parts-year">Year</Label>
          <select
            id="parts-year"
            key={`${value.makeId}-${value.modelId || "no-model"}`}
            className={selectClass}
            disabled={disabled || !value.modelId}
            value={value.year}
            onChange={(e) => onChange({ ...value, year: e.target.value })}
            required
          >
            <option value="">
              {value.modelId ? "Select year" : "Choose model first"}
            </option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="parts-oem">
            OEM / part number{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="parts-oem"
            name="partNumber"
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. 82 00 277 070"
            disabled={disabled}
            value={value.partNumber}
            onChange={(e) =>
              onChange({
                ...value,
                partNumber: e.target.value.slice(0, 48),
              })
            }
            className="font-mono tracking-wide uppercase"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Photos stay the main method. A part number improves matching and
            appears clearly on results.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="parts-vin">
            VIN{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="parts-vin"
            name="vin"
            autoComplete="off"
            spellCheck={false}
            maxLength={17}
            placeholder="17-character VIN"
            disabled={disabled}
            value={value.vin}
            onChange={(e) =>
              onChange({
                ...value,
                vin: e.target.value
                  .toUpperCase()
                  .replace(/[^A-HJ-NPR-Z0-9]/g, ""),
              })
            }
            className="font-mono tracking-wide uppercase"
          />
        </div>
      </div>

      {(onSaveVehicle || onClearSavedVehicle) && (
        <div className="rounded-2xl border border-border/60 bg-muted/25 px-3.5 py-3 sm:px-4 sm:py-3.5">
          <div className="flex gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-800/10 text-emerald-900">
              <Car className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Default vehicle on this device
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {hasSavedProfile
                  ? matchesSavedProfile
                    ? `Saved: ${formatVehicleLabel(value)}. We’ll pre-fill this next time.`
                    : "You have a saved vehicle — save again to update it, or clear it below."
                  : "Save Make / Model / Year (and VIN if added) to skip re-entering them."}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                {onSaveVehicle && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-2 bg-background"
                    disabled={disabled || !canSave || matchesSavedProfile}
                    onClick={onSaveVehicle}
                  >
                    <BookmarkCheck className="size-4" />
                    {matchesSavedProfile ? "Saved" : "Save this vehicle"}
                  </Button>
                )}
                {hasSavedProfile && onClearSavedVehicle && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 gap-2 text-muted-foreground hover:text-foreground"
                    disabled={disabled}
                    onClick={onClearSavedVehicle}
                  >
                    <BookmarkX className="size-4" />
                    Clear saved vehicle
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
