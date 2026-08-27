"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type TeamMember = {
  id: number;
  name: string;
  email: string | null;
  role: string;
};

type PartnerPingProps = {
  projectId: number;
  projectName: string;
};

const messageTypes = [
  "Task Assignment",
  "Deadline Reminder",
  "Approval Needed",
  "Status Update",
  "Meeting Reminder",
  "Custom Message",
];

export default function PartnerPing({
  projectId,
  projectName,
}: PartnerPingProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [memberId, setMemberId] = useState("");
  const [type, setType] = useState("Task Assignment");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      const { data, error: loadError } = await supabase
        .from("project_members")
        .select("id, name, email, role")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      setMembers((data || []) as TeamMember[]);
      setLoading(false);
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function generateWithAI() {
    setError("");
    setSuccess("");

    const selectedMember = members.find(
      (member) => String(member.id) === memberId
    );

    if (!selectedMember) {
      setError("Choose a team member first.");
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch("/api/generate-ping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          recipientName: selectedMember.name,
          recipientRole: selectedMember.role,
          notificationType: type,
          taskTitle,
          dueDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to generate message."
        );
      }

      setSubject(data.subject || "");
      setMessage(data.message || "");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate message."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function sendMessage() {
    setError("");
    setSuccess("");

    const selectedMember = members.find(
      (member) => String(member.id) === memberId
    );

    if (!selectedMember) {
      setError("Choose a team member.");
      return;
    }

    if (!selectedMember.email) {
      setError(
        "That team member does not have an email address."
      );
      return;
    }

    if (!subject.trim()) {
      setError("Enter a subject.");
      return;
    }

    if (!message.trim()) {
      setError("Enter a message.");
      return;
    }

    setSending(true);

    try {
      const { data: notification, error: saveError } =
        await supabase
          .from("project_notifications")
          .insert({
            project_id: projectId,
            member_id: selectedMember.id,
            recipient_name: selectedMember.name,
            recipient_email: selectedMember.email,
            notification_type: type,
            subject: subject.trim(),
            message: message.trim(),
            status: "Pending",
          })
          .select("id")
          .single();

      if (saveError) {
        throw new Error(saveError.message);
      }

      const response = await fetch("/api/send-ping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: selectedMember.email,
          recipientName: selectedMember.name,
          projectName,
          notificationType: type,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (notification?.id) {
          await supabase
            .from("project_notifications")
            .update({
              status: "Failed",
            })
            .eq("id", notification.id);
        }

        throw new Error(
          data.error || "Email failed to send."
        );
      }

      if (notification?.id) {
        await supabase
          .from("project_notifications")
          .update({
            status: "Sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);
      }

      setSuccess(
        `Message sent to ${selectedMember.name}.`
      );

      setSubject("");
      setMessage("");
      setTaskTitle("");
      setDueDate("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="relative mt-8 h-full overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
              Communication
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Team Message
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Send a project update, reminder, or task message
              to a team member.
            </p>
          </div>

          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3">
            <Mail size={18} className="text-cyan-300" />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Team Member
            </label>

            <select
              value={memberId}
              onChange={(event) =>
                setMemberId(event.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-cyan-400"
            >
              <option value="">
                {loading
                  ? "Loading team..."
                  : "Choose team member"}
              </option>

              {members.map((member) => (
                <option
                  key={member.id}
                  value={member.id}
                >
                  {member.name} — {member.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Message Type
            </label>

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-cyan-400"
            >
              {messageTypes.map((messageType) => (
                <option
                  key={messageType}
                  value={messageType}
                >
                  {messageType}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Task or Topic
            </label>

            <input
              value={taskTitle}
              onChange={(event) =>
                setTaskTitle(event.target.value)
              }
              placeholder="Example: Finalize project budget"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Due Date
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void generateWithAI()}
          disabled={generating}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-300 transition hover:bg-violet-400/20 disabled:opacity-50"
        >
          <Sparkles size={16} />

          {generating
            ? "Generating..."
            : "Generate Message with AI"}
        </button>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Subject
          </label>

          <input
            value={subject}
            onChange={(event) =>
              setSubject(event.target.value)
            }
            placeholder="Email subject"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Message
          </label>

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            rows={6}
            placeholder="Write your message or generate one with AI..."
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {success}
          </p>
        )}

        <button
          type="button"
          onClick={() => void sendMessage()}
          disabled={sending}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-400 px-5 py-3 font-bold text-white shadow-[0_0_25px_rgba(34,211,238,0.12)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={17} />

          {sending ? "Sending..." : "Send Message"}
        </button>

        {!loading && members.length === 0 && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-500">
            <UserRound size={14} />
            Add team members before sending project messages.
          </div>
        )}
      </div>
    </section>
  );
}

