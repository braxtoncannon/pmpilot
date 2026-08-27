export default function BackgroundEffects() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 space-grid" />
      <div className="absolute inset-0 stars stars-small" />
      <div className="absolute inset-0 stars stars-large" />

      <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute right-[-8rem] top-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
    </div>
  );
}