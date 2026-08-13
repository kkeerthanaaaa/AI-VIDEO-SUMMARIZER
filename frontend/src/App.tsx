import { useCallback, useRef, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HeroIntro } from './components/Hero/HeroIntro';
import { VideoInputSection, InputMode } from './components/Hero/VideoInputSection';
import { OptionsSelector } from './components/OptionsSelector';
import { GenerateButton } from './components/GenerateButton';
import { ProcessingView } from './components/ProcessingView';
import { ErrorBanner } from './components/ErrorBanner';
import { ResultsPage } from './components/results/ResultsPage';
import { HistoryDrawer } from './components/HistoryDrawer';
import { useHistory } from './hooks/useHistory';
import { ApiError, pollJobUntilDone, submitVideoFile, submitVideoUrl } from './services/api';
import { HistoryEntry, JobStage, OutputType, VideoAnalysisResult } from './types';

type ViewState = 'input' | 'processing' | 'results';

function App() {
  const [view, setView] = useState<ViewState>('input');

  // Input state
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [selectedOutputs, setSelectedOutputs] = useState<OutputType[]>([
    'summary',
    'flashcards',
    'keyPoints',
    'highlights',
  ]);

  // Processing state
  const [jobStage, setJobStage] = useState<JobStage>('queued');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Result state
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [resultOutputs, setResultOutputs] = useState<OutputType[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | undefined>(undefined);
  const [chatAvailable, setChatAvailable] = useState(false);

  // Error / history / UI state
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { history, addEntry, removeEntry, clearHistory } = useHistory();

  const cancelledRef = useRef(false);

  const resetInputs = () => {
    setFile(null);
    setUrl('');
  };

  const handleStartNew = () => {
    setView('input');
    setResult(null);
    setError(null);
    setUploadProgress(null);
    setActiveJobId(undefined);
    setChatAvailable(false);
    resetInputs();
  };

  const canGenerate =
    selectedOutputs.length > 0 && ((inputMode === 'file' && !!file) || (inputMode === 'url' && url.trim().length > 0));

  const handleGenerate = useCallback(async () => {
    setError(null);

    if (selectedOutputs.length === 0) {
      setError('Please select at least one output format.');
      return;
    }
    if (inputMode === 'file' && !file) {
      setError('Please upload a video file first.');
      return;
    }
    if (inputMode === 'url' && !url.trim()) {
      setError('Please paste a video URL first.');
      return;
    }

    cancelledRef.current = false;
    setView('processing');
    setJobStage('queued');
    setProgress(5);
    setStatusMessage('Preparing your request...');
    setUploadProgress(inputMode === 'file' ? 0 : null);

    try {
      let jobId: string;

      if (inputMode === 'file' && file) {
        jobId = await submitVideoFile(file, selectedOutputs, (percent) => {
          setUploadProgress(percent);
        });
      } else {
        jobId = await submitVideoUrl(url.trim(), selectedOutputs);
      }

      const finalStatus = await pollJobUntilDone(jobId, (status) => {
        if (cancelledRef.current) return;
        setJobStage(status.status);
        setProgress(status.progress);
        setStatusMessage(status.message);
      });

      if (cancelledRef.current) return;

      if (finalStatus.status === 'failed' || !finalStatus.result) {
        setError(finalStatus.error || 'Something went wrong while processing your video.');
        setView('input');
        return;
      }

      setResult(finalStatus.result);
      setResultOutputs(selectedOutputs);
      setFromCache(Boolean(finalStatus.fromCache));
      setActiveJobId(jobId);
      setChatAvailable(Boolean(finalStatus.chatAvailable));
      setView('results');

      const entry: Omit<HistoryEntry, 'id' | 'createdAt'> = {
        title: finalStatus.result.videoTitle || (inputMode === 'file' ? file!.name : url),
        source: inputMode,
        sourceLabel: inputMode === 'file' ? file!.name : url,
        outputs: selectedOutputs,
        result: finalStatus.result,
      };
      addEntry(entry);
    } catch (err) {
      if (cancelledRef.current) return;
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      setView('input');
    }
  }, [inputMode, file, url, selectedOutputs, addEntry]);

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    setResult(entry.result);
    setResultOutputs(entry.outputs);
    setFromCache(false);
    setError(null);
    // History entries don't have a live backend job/video reference, so
    // chat isn't available for them — only for freshly generated results.
    setActiveJobId(undefined);
    setChatAvailable(false);
    setView('results');
    setIsHistoryOpen(false);
  };

  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col">
        <Header onToggleHistory={() => setIsHistoryOpen(true)} historyCount={history.length} />

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
          {view === 'input' && (
            <div className="space-y-8 animate-fade-in">
              <HeroIntro />

              {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

              <VideoInputSection
                inputMode={inputMode}
                onInputModeChange={(mode) => {
                  setInputMode(mode);
                  setError(null);
                }}
                file={file}
                onFileChange={setFile}
                url={url}
                onUrlChange={setUrl}
              />

              <OptionsSelector selected={selectedOutputs} onChange={setSelectedOutputs} />

              <div className="flex justify-center pt-2">
                <GenerateButton onClick={handleGenerate} disabled={!canGenerate} />
              </div>
            </div>
          )}

          {view === 'processing' && (
            <ProcessingView
              status={jobStage}
              progress={progress}
              message={statusMessage}
              uploadProgress={uploadProgress}
            />
          )}

          {view === 'results' && result && (
            <ResultsPage
              result={result}
              outputs={resultOutputs}
              onStartNew={handleStartNew}
              fromCache={fromCache}
              jobId={activeJobId}
              chatAvailable={chatAvailable}
            />
          )}
        </main>

        <Footer />

        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelect={handleSelectHistoryEntry}
          onRemove={removeEntry}
          onClearAll={clearHistory}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
