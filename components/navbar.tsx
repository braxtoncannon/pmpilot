"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  CalendarDays,
  FolderKanban,
  Home,
  ListTodo,
  LogOut,
  MessageSquare,
  Rocket,
  Users,
} from "lucide-react";

type NavbarProps = {
  onSignOut: () => void;
  showProjectNavigation?: boolean;
};

const mainNavigation = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
];

const projectNavigation = [
  {
    label: "Tasks",
    href: "#tasks",
    icon: ListTodo,
  },
  {
    label: "Calendar",
    href: "#calendar",
    icon: CalendarDays,
  },
  {
    label: "Team",
    href: "#team",
    icon: Users,
  },
  {
    label: "Reports",
    href: "#reports",
    icon: BarChart3,
  },
  {
    label: "Messages",
    href: "#communication",
    icon: MessageSquare,
  },
  {
    label: "AI Assistant",
    href: "#ai",
    icon: Bot,
  },
];

export default function Navbar({
  onSignOut,
  showProjectNavigation = false,
}: NavbarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[230px] flex-col border-r border-cyan-400/15 bg-[#020817]/88 backdrop-blur-2xl lg:flex">
        {/* BRAND */}
        <Link
          href="/"
          className="flex h-[88px] items-center gap-3 border-b border-cyan-400/15 px-6"
        >
          <div className="relative flex h-11 w-11 items-center justify-center">
            <div className="absolute inset-0 rounded-xl bg-cyan-400/10 blur-lg" />

            <Rocket
              size={30}
              className="relative rotate-[-42deg] text-cyan-300"
            />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              PMPILOT
            </h1>

            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-400/60">
              AI Project Management
            </p>
          </div>
        </Link>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
            Workspace
          </p>

          <div className="space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;

              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "border-cyan-400/40 bg-cyan-400/10 text-white shadow-[0_0_25px_rgba(34,211,238,0.1)]"
                      : "border-transparent text-slate-400 hover:border-cyan-400/15 hover:bg-cyan-400/5 hover:text-white"
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-cyan-300"
                        : "text-slate-500 transition group-hover:text-cyan-300"
                    }
                  />

                  {item.label}

                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ONLY SHOW WHEN A PROJECT IS OPEN */}
          {showProjectNavigation && (
            <div className="mt-6">
              <div className="mb-3 border-t border-cyan-400/10" />

              <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                Current Project
              </p>

              <div className="space-y-1">
                {projectNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:border-cyan-400/15 hover:bg-cyan-400/5 hover:text-white"
                    >
                      <Icon
                        size={17}
                        className="text-slate-500 transition group-hover:text-cyan-300"
                      />

                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* SYSTEM STATUS */}
        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
            <div className="flex items-center gap-2">
              <Activity
                size={15}
                className="text-emerald-400"
              />

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                System Status
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

              <span className="text-xs text-slate-300">
                All systems operational
              </span>
            </div>
          </div>
        </div>

        {/* SIGN OUT */}
        <div className="border-t border-cyan-400/10 p-4">
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm text-slate-400 transition hover:border-red-400/15 hover:bg-red-400/5 hover:text-red-300"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-50 border-b border-cyan-400/15 bg-[#020817]/90 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <Rocket
              size={24}
              className="rotate-[-42deg] text-cyan-300"
            />

            <div>
              <p className="font-black tracking-tight text-white">
                PMPILOT
              </p>

              <p className="text-[9px] uppercase tracking-[0.15em] text-cyan-400/60">
                AI Project Management
              </p>
            </div>
          </Link>

          <div className="flex gap-2">
            <Link
              href="/"
              aria-label="Dashboard"
              className="rounded-lg border border-slate-700 bg-slate-900/70 p-2.5 text-slate-300"
            >
              <Home size={18} />
            </Link>

            <Link
              href="/projects"
              aria-label="Projects"
              className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 p-2.5 text-cyan-300"
            >
              <FolderKanban size={18} />
            </Link>

            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              className="rounded-lg border border-red-400/20 bg-red-400/5 p-2.5 text-red-300"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {showProjectNavigation && (
          <div className="overflow-x-auto border-t border-cyan-400/10 px-3 py-2">
            <div className="flex min-w-max gap-1">
              {projectNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                  >
                    <Icon size={14} />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

