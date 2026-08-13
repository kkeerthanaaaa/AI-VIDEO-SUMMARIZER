import { OutputType, VideoAnalysisResult } from '../types';

interface ReportOptions {
  includeTitle?: boolean;
}

const SECTION_TITLES: Record<OutputType, string> = {
  summary: 'TEXT SUMMARY',
  flashcards: 'FLASHCARDS',
  keyPoints: 'KEY POINTS',
  highlights: 'HIGHLIGHTS',
};

/**
 * Builds a plain-text representation of the requested sections of a result.
 * Used for "Copy to clipboard", ".txt" downloads, and as the basis for the
 * PDF export and word-count statistics.
 */
export function buildPlainTextReport(
  result: VideoAnalysisResult,
  outputs: OutputType[],
  options: ReportOptions = {}
): string {
  const { includeTitle = true } = options;
  const lines: string[] = [];

  if (includeTitle && result.videoTitle) {
    lines.push(result.videoTitle);
    lines.push('='.repeat(result.videoTitle.length));
    lines.push('');
  }

  for (const output of outputs) {
    switch (output) {
      case 'summary': {
        if (!result.summary) break;
        lines.push(SECTION_TITLES.summary);
        lines.push('-'.repeat(SECTION_TITLES.summary.length));
        lines.push('');
        lines.push('Executive Summary');
        lines.push(result.summary.executiveSummary);
        lines.push('');
        lines.push('Detailed Summary');
        lines.push(result.summary.detailedSummary);
        lines.push('');
        if (result.summary.sectionBreakdown?.length) {
          lines.push('Section-wise Breakdown');
          result.summary.sectionBreakdown.forEach((section, idx) => {
            lines.push(`${idx + 1}. ${section.title}`);
            lines.push(`   ${section.content}`);
          });
          lines.push('');
        }
        lines.push('Conclusion');
        lines.push(result.summary.conclusion);
        lines.push('');
        break;
      }
      case 'flashcards': {
        if (!result.flashcards?.length) break;
        lines.push(SECTION_TITLES.flashcards);
        lines.push('-'.repeat(SECTION_TITLES.flashcards.length));
        lines.push('');
        result.flashcards.forEach((card, idx) => {
          lines.push(`${idx + 1}. Q: ${card.question}`);
          lines.push(`   A: ${card.answer}`);
          lines.push('');
        });
        break;
      }
      case 'keyPoints': {
        if (!result.keyPoints?.length) break;
        lines.push(SECTION_TITLES.keyPoints);
        lines.push('-'.repeat(SECTION_TITLES.keyPoints.length));
        lines.push('');
        result.keyPoints.forEach((point) => lines.push(`• ${point}`));
        lines.push('');
        break;
      }
      case 'highlights': {
        if (!result.highlights?.length) break;
        lines.push(SECTION_TITLES.highlights);
        lines.push('-'.repeat(SECTION_TITLES.highlights.length));
        lines.push('');
        result.highlights.forEach((h, idx) => {
          const ts = h.timestamp ? ` [${h.timestamp}]` : '';
          lines.push(`${idx + 1}. (${h.type.toUpperCase()}${ts}) ${h.title}`);
          lines.push(`   ${h.description}`);
          lines.push('');
        });
        break;
      }
    }
  }

  return lines.join('\n').trim();
}

/** Triggers a browser download of `content` as a .txt file. */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a nicely formatted PDF for the requested
 * sections of a result.
 */
export async function downloadPdf(
  filename: string,
  result: VideoAnalysisResult,
  outputs: OutputType[]
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (lineHeight: number) => {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeText = (
    text: string,
    { fontSize = 11, fontStyle = 'normal', gapAfter = 6, indent = 0 }: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      gapAfter?: number;
      indent?: number;
    } = {}
  ) => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth - indent);
    const lineHeight = fontSize * 1.4;
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    }
    y += gapAfter;
  };

  const writeHeading = (text: string) => {
    ensureSpace(28);
    writeText(text, { fontSize: 16, fontStyle: 'bold', gapAfter: 8 });
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
    y += 6;
  };

  // Title
  if (result.videoTitle) {
    writeText(result.videoTitle, { fontSize: 20, fontStyle: 'bold', gapAfter: 4 });
    writeText('AI Video Summarizer Report', { fontSize: 10, fontStyle: 'italic', gapAfter: 16 });
  }

  for (const output of outputs) {
    switch (output) {
      case 'summary': {
        if (!result.summary) break;
        writeHeading('Text Summary');
        writeText('Executive Summary', { fontSize: 13, fontStyle: 'bold', gapAfter: 4 });
        writeText(result.summary.executiveSummary, { gapAfter: 12 });

        writeText('Detailed Summary', { fontSize: 13, fontStyle: 'bold', gapAfter: 4 });
        writeText(result.summary.detailedSummary, { gapAfter: 12 });

        if (result.summary.sectionBreakdown?.length) {
          writeText('Section-wise Breakdown', { fontSize: 13, fontStyle: 'bold', gapAfter: 4 });
          result.summary.sectionBreakdown.forEach((section, idx) => {
            writeText(`${idx + 1}. ${section.title}`, { fontStyle: 'bold', gapAfter: 2 });
            writeText(section.content, { gapAfter: 8, indent: 12 });
          });
          y += 4;
        }

        writeText('Conclusion', { fontSize: 13, fontStyle: 'bold', gapAfter: 4 });
        writeText(result.summary.conclusion, { gapAfter: 14 });
        break;
      }
      case 'flashcards': {
        if (!result.flashcards?.length) break;
        writeHeading('Flashcards');
        result.flashcards.forEach((card, idx) => {
          writeText(`${idx + 1}. Q: ${card.question}`, { fontStyle: 'bold', gapAfter: 2 });
          writeText(`A: ${card.answer}`, { gapAfter: 8, indent: 12 });
        });
        y += 6;
        break;
      }
      case 'keyPoints': {
        if (!result.keyPoints?.length) break;
        writeHeading('Key Points');
        result.keyPoints.forEach((point) => {
          writeText(`•  ${point}`, { gapAfter: 4 });
        });
        y += 6;
        break;
      }
      case 'highlights': {
        if (!result.highlights?.length) break;
        writeHeading('Highlights');
        result.highlights.forEach((h, idx) => {
          const ts = h.timestamp ? ` (${h.timestamp})` : '';
          writeText(`${idx + 1}. [${h.type.toUpperCase()}]${ts} ${h.title}`, {
            fontStyle: 'bold',
            gapAfter: 2,
          });
          writeText(h.description, { gapAfter: 8, indent: 12 });
        });
        break;
      }
    }
  }

  doc.save(filename);
}

/** Copies text to the clipboard, returning whether it succeeded. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy method
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/** Sanitizes a video title into a safe filename fragment. */
export function slugifyFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'video-summary'
  );
}
