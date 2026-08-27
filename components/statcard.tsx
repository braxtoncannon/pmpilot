type StatCardProps = {
  label: string;
  value: string | number;
  accent?: string;
};

export default function StatCard({
  label,
  value,
  accent = "text-cyan-400",
}: StatCardProps) {
  return (
    <div className="mission-panel card-lift rounded-xl p-5">
      <p className="mission-label">{label}</p>

      <h3 className={`mt-2 text-3xl font-bold ${accent}`}>
        {value}
      </h3>
    </div>
  );
}

