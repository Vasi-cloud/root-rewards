import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SellerStat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={
        accent ? "border-emerald-200 bg-emerald-50/50" : "border-border/80"
      }
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={`flex items-center gap-2 text-sm font-medium ${
            accent ? "text-emerald-700" : "text-muted-foreground"
          }`}
        >
          <Icon className="size-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-semibold tabular-nums ${
            accent ? "text-emerald-800" : "text-primary"
          }`}
        >
          {value}
        </div>
        <div
          className={`mt-1 text-xs ${
            accent ? "text-emerald-700" : "text-muted-foreground"
          }`}
        >
          {hint}
        </div>
      </CardContent>
    </Card>
  );
}
