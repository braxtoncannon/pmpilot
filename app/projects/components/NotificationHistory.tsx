"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Mail,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Notification = {
  id: number;
  recipient_name: string | null;
  recipient_email: string | null;
  notification_type: string;
  subject: string;
  message: string;
  status: string;
  sent_at: string | null;
  created_at: string;
};

type NotificationHistoryProps = {
  projectId: number;
};

export default function NotificationHistory({
  projectId,
}: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      const { data, error: loadError } = await supabase
        .from("project_notifications")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      setNotifications((data || []) as Notification[]);
      setLoading(false);
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function statusStyles(status: string) {
    if (status === "Sent") {
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    }

    if (status === "Failed") {
      return "border-red-400/25 bg-red-400/10 text-red-300";
    }

    return "border-amber-400/25 bg-amber-400/10 text-amber-300";
  }

  function StatusIcon({ status }: { status: string }) {
    if (status === "Sent") {
      return <CheckCircle2 size={13} />;
    }

    if (status === "Failed") {
      return <XCircle size={13} />;
    }

    return <Clock3 size={13} />;
  }

  return (
    <section className="relative mt-8 h-full overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
              Activity
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Notifications
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Recent project updates, reminders, and communication activity.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-xs text-slate-400">
            <Bell size={15} className="text-cyan-300" />
            {notifications.length} total
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {loading && (
            <p className="text-sm text-slate-500">
              Loading notifications...
            </p>
          )}

          {!loading && notifications.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-800 p-7 text-center">
              <Bell
                size={28}
                className="mx-auto text-slate-700"
              />

              <p className="mt-3 text-sm text-slate-500">
                No project notifications yet.
              </p>
            </div>
          )}

          {notifications.map((notification) => (
            <article
              key={notification.id}
              className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4 transition hover:border-cyan-400/20 hover:bg-slate-950/75"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {notification.subject}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
                      {notification.notification_type}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Mail size={12} />
                      {notification.recipient_name || "Unknown recipient"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {notification.message}
                  </p>

                  {notification.recipient_email && (
                    <p className="mt-2 text-xs text-slate-600">
                      {notification.recipient_email}
                    </p>
                  )}
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles(
                    notification.status
                  )}`}
                >
                  <StatusIcon status={notification.status} />
                  {notification.status}
                </span>
              </div>

              <p className="mt-4 text-xs text-slate-600">
                {new Date(
                  notification.sent_at || notification.created_at
                ).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

