export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/70 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500 sm:px-6">
        <p>Videos are processed securely and never shared.</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} AI Video Summarizer</p>
      </div>
    </footer>
  );
}
