import { AdminTooltip } from "./AdminTooltip";

export function MetricHelp({ content, label = "查看指标口径说明" }) {
  return <AdminTooltip content={content} label={label} className="admin-metric-help"/>;
}
