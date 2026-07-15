interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon: React.ReactNode;
}

export function MetricCard({ label, value, sub, accent = "#A8B89A", icon }: Props) {
  return (
    <div className="rounded-2xl bg-surface border border-line p-5 flex items-start gap-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accent + "18" }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-1">{label}</p>
        <p className="font-serif text-2xl font-light text-cream leading-none">{value}</p>
        {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}
