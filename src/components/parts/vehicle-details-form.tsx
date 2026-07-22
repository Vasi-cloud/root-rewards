"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  YEAR_MAX,
  YEAR_MIN,
  YEAR_OPTIONS,
  VEHICLE_CATALOG,
  VEHICLE_MAKE_IDS,
  modelsForMake,
  type VehicleDetails,
  type VehicleMakeId,
} from "@/lib/leafy-parts";

const selectClass =
  "flex h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

type VehicleDetailsFormProps = {
  value: VehicleDetails;
  onChange: (next: VehicleDetails) => void;
  disabled?: boolean;
};

export function VehicleDetailsForm({
  value,
  onChange,
  disabled,
}: VehicleDetailsFormProps) {
  const models = modelsForMake(value.makeId);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Vehicle details
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose Make first — Model updates with that brand&apos;s cars
          (including Renault, Peugeot, Audi, and more). Years {YEAR_MIN}–
          {YEAR_MAX}. VIN is optional.
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
            onChange={(e) =>
              onChange({ ...value, modelId: e.target.value })
            }
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
            className={selectClass}
            disabled={disabled}
            value={value.year}
            onChange={(e) => onChange({ ...value, year: e.target.value })}
            required
          >
            <option value="">Select year</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
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
  );
}
