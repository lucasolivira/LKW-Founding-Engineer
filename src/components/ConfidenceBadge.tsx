import { Badge } from "@/components/ui/badge";

interface ConfidenceBadgeProps {
  score: number;
  showLabel?: boolean;
}

export function ConfidenceBadge({ score, showLabel = true }: ConfidenceBadgeProps) {
  const percent = Math.round(score * 100);
  const variant: "success" | "warning" | "danger" =
    score > 0.8 ? "success" : score >= 0.5 ? "warning" : "danger";

  const label =
    score > 0.8 ? "alta" : score >= 0.5 ? "média" : "baixa";

  return (
    <Badge variant={variant} className="gap-1 font-medium">
      <span>{percent}%</span>
      {showLabel && <span className="opacity-75">· {label}</span>}
    </Badge>
  );
}
