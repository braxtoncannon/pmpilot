import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ResultPanelProps = {
  result: string;
  copied: boolean;
  saved: boolean;
  onCopy: () => void;
  onGenerateAnother: () => void;
};

export default function ResultPanel({
  result,
  copied,
  saved,
  onCopy,
  onGenerateAnother,
}: ResultPanelProps) {
  if (!result) return null;

  return (
    <section className="mission-panel-strong fade-up p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mission-label">AI OUTPUT</p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Mission Plan
          </h2>
        </div>

        {saved && (
          <span className="space-success px-4 py-2">
            Saved
          </span>
        )}
      </div>

      <div className="mission-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {result}
        </ReactMarkdown>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onCopy}
          className="space-secondary-button w-full"
        >
          {copied ? "Copied!" : "Copy Plan"}
        </button>

        <button
          onClick={onGenerateAnother}
          className="space-primary-button w-full"
        >
          Generate Another
        </button>
      </div>
    </section>
  );
}

