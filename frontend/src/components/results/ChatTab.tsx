import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertCircle, Bot, RotateCw, Send, Sparkles, User } from 'lucide-react';
import { ChatMessage } from '../../types';
import { askVideoQuestion, ApiError } from '../../services/api';

interface ChatTabProps {
  jobId: string;
  videoTitle?: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the main takeaways from this video?',
  'Can you explain that in simpler terms?',
  'What examples were given?',
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatTab({ jobId, videoTitle }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', text: trimmed };
    const pendingId = makeId();
    const pendingMessage: ChatMessage = {
      id: pendingId,
      role: 'model',
      text: '',
      pending: true,
    };

    const historyForApi = messages
      .filter((m) => !m.pending && !m.failed)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setInput('');
    setIsSending(true);

    try {
      const answer = await askVideoQuestion(jobId, trimmed, historyForApi);
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...m, text: answer, pending: false } : m))
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId ? { ...m, text: message, pending: false, failed: true } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  const handleRetry = (failedMessage: ChatMessage) => {
    // Find the user question immediately preceding this failed answer.
    const idx = messages.findIndex((m) => m.id === failedMessage.id);
    const priorUserMessage = idx > 0 ? messages[idx - 1] : undefined;
    if (!priorUserMessage) return;

    // Remove both the failed answer and the original user question; they'll
    // be re-added together by sendQuestion.
    setMessages((prev) =>
      prev.filter((m) => m.id !== failedMessage.id && m.id !== priorUserMessage.id)
    );
    void sendQuestion(priorUserMessage.text);
  };

  return (
    <div className="flex h-[520px] flex-col animate-fade-in">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <Sparkles size={22} />
            </span>
            <h4 className="font-display text-base font-semibold text-slate-700 dark:text-slate-200">
              Ask anything about{videoTitle ? ` "${videoTitle}"` : ' this video'}
            </h4>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              The model will answer using the actual video content — visuals, on-screen text, and
              narration included.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void sendQuestion(q)}
                  className="chip transition-colors hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-400"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                message.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
              }`}
            >
              {message.role === 'user' ? <User size={15} /> : <Bot size={15} />}
            </span>

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : message.failed
                    ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
                    : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
              }`}
            >
              {message.pending ? (
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  </span>
                </span>
              ) : (
                <>
                  {message.failed && (
                    <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                      <AlertCircle size={12} /> Couldn't get an answer
                    </span>
                  )}
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.failed && (
                    <button
                      type="button"
                      onClick={() => handleRetry(message)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline dark:text-red-300"
                    >
                      <RotateCw size={12} /> Retry
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 border-t border-slate-200 dark:border-slate-700 pt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this video..."
          disabled={isSending}
          maxLength={1000}
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="btn-primary px-4 py-2.5"
          aria-label="Send question"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
