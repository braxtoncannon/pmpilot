type HeroProps = {
  onCreate: () => void;
};

export default function Hero({ onCreate }: HeroProps) {
  return (
    <section className="fade-up mx-auto max-w-6xl py-16 text-center">
      <p className="mission-label mb-4">
        AI PROJECT MANAGEMENT PLATFORM
      </p>

      <h1 className="text-6xl font-extrabold tracking-tight text-white">
        PMPilot
      </h1>

      <p className="mt-6 text-xl text-slate-300">
        Plan smarter.
        <br />
        Execute faster.
        <br />
        Let AI build your next project.
      </p>

      <div className="mt-10 flex justify-center">
        <button
          onClick={onCreate}
          className="space-primary-button px-8 py-4 text-lg"
        >
          🚀 Launch New Mission
        </button>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        <div className="mission-panel card-lift p-6">
          <h3 className="text-lg font-semibold text-cyan-300">
            AI Planning
          </h3>

          <p className="mt-2 text-slate-400">
            Generate complete project plans in seconds.
          </p>
        </div>

        <div className="mission-panel card-lift p-6">
          <h3 className="text-lg font-semibold text-cyan-300">
            Save Projects
          </h3>

          <p className="mt-2 text-slate-400">
            Every generated plan is securely stored in Supabase.
          </p>
        </div>

        <div className="mission-panel card-lift p-6">
          <h3 className="text-lg font-semibold text-cyan-300">
            Mission Control
          </h3>

          <p className="mt-2 text-slate-400">
            Search, organize, edit, and export every project.
          </p>
        </div>
      </div>
    </section>
  );
}

