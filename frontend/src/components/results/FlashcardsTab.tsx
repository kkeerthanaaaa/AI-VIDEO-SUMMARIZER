import { useState } from 'react';
import { HelpCircle, Lightbulb, RotateCw } from 'lucide-react';
import { FlashcardItem, VideoAnalysisResult } from '../../types';
import { ResultActions } from './ResultActions';

interface FlashcardsTabProps {
  result: VideoAnalysisResult;
  flashcards: FlashcardItem[];
}

function Flashcard({ card, index }: { card: FlashcardItem; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="group relative h-48 w-full text-left [perspective:1000px]"
      aria-pressed={flipped}
    >
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front: Question */}
        <div className="absolute inset-0 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card p-5 shadow-soft [backface-visibility:hidden]">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <HelpCircle size={16} />
            </span>
            <span className="font-mono text-xs text-slate-400">#{index + 1}</span>
          </div>
          <p className="mt-3 flex-1 overflow-y-auto text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
            {card.question}
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 self-start text-xs font-medium text-brand-600 dark:text-brand-400">
            <RotateCw size={12} /> Flip for answer
          </span>
        </div>

        {/* Back: Answer */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/40 p-5 shadow-soft [backface-visibility:hidden]"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-surface-dark-card text-brand-600 dark:text-brand-400">
              <Lightbulb size={16} />
            </span>
            <span className="font-mono text-xs text-brand-400">#{index + 1}</span>
          </div>
          <p className="mt-3 flex-1 overflow-y-auto text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {card.answer}
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 self-start text-xs font-medium text-brand-600 dark:text-brand-400">
            <RotateCw size={12} /> Flip back
          </span>
        </div>
      </div>
    </button>
  );
}

export function FlashcardsTab({ result, flashcards }: FlashcardsTabProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {flashcards.length} flashcards &middot; click a card to reveal the answer
        </p>
        <ResultActions result={result} outputs={['flashcards']} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flashcards.map((card, idx) => (
          <Flashcard key={idx} card={card} index={idx} />
        ))}
      </div>
    </div>
  );
}
