import { OutputType } from '../types';

/**
 * ============================================================
 * Prompt Engineering for AI Video Summarizer
 * ============================================================
 *
 * Gemini is given the raw video (file or URL) plus a single
 * carefully constructed prompt. We ask Gemini to return ONLY
 * JSON that matches `buildResponseSchema()` below, using
 * Gemini's structured output (responseSchema) feature so the
 * backend never has to fuzzily parse free text.
 */

const BASE_INSTRUCTIONS = `You are an expert video content analyst and educator. You will be given a video.
Watch and listen to the entire video carefully, including any on-screen text, slides, code, charts, and spoken narration.

Your job is to extract accurate, faithful, and well-organized information that helps a learner who has NOT watched the video quickly understand and study its content.

General rules:
- Base everything strictly on the actual content of the video. Do not invent facts, statistics, names, or claims that are not present in the video.
- Write in clear, professional, and concise English.
- Use the video's own terminology and key terms where relevant.
- If the video is short or has limited content, it is OK to produce fewer items, but still follow the structure exactly.
- Never include markdown code fences, commentary, or any text outside of the requested JSON object.`;

const SECTION_PROMPTS: Record<OutputType, string> = {
  summary: `
## TEXT SUMMARY
Produce a "summary" object with:
- "executiveSummary": A short (3-5 sentence) high-level overview of what the video is about and why it matters. This should give a busy reader the gist in under a minute.
- "detailedSummary": A thorough multi-paragraph summary (roughly 200-400 words) covering the main narrative/structure of the video, the core arguments, methods, demonstrations, and conclusions, written in flowing prose with clear logical progression.
- "sectionBreakdown": An array of 3-8 objects, each with a "title" (a short descriptive heading for that part/topic of the video, in chronological order) and "content" (2-4 sentences summarizing that section). Together these should map to the video's natural chapters or topic shifts.
- "conclusion": 2-4 sentences capturing the video's final takeaway, call to action, or closing remarks.`,

  flashcards: `
## FLASHCARDS
Produce a "flashcards" array of 10-20 study flashcards (scale the count to how much distinct content the video covers; shorter/simpler videos can have fewer, down to a minimum of 6).
Each flashcard is an object with:
- "question": A focused, specific question testing understanding of one concept, definition, fact, or process from the video.
- "answer": A clear, self-contained, accurate answer (1-3 sentences) that would make sense even without watching the video.
Avoid duplicate or overly similar questions. Cover a spread of topics across the whole video, not just the introduction.`,

  keyPoints: `
## KEY POINTS
Produce a "keyPoints" array of 6-12 concise bullet-point strings.
Each entry should be a single, standalone, information-dense sentence or short phrase capturing one important fact, concept, or recommendation from the video.
Order them roughly in the order they appear in the video. Do not number them or add bullet characters; just provide the plain text for each point.`,

  highlights: `
## HIGHLIGHTS
Produce a "highlights" array of 5-10 objects representing the most important moments, takeaways, noteworthy statements, or critical insights from the video.
Each object has:
- "type": one of "moment", "takeaway", "statement", or "insight"
  - "moment": A specific notable event, demo, or scene in the video
  - "takeaway": A major lesson or conclusion the viewer should remember
  - "statement": A particularly important or quotable statement made in the video (paraphrase it; do not quote more than a short phrase verbatim)
  - "insight": A non-obvious connection, implication, or critical observation
- "title": A short (3-8 word) title for the highlight
- "description": 1-3 sentences explaining the highlight and why it matters
- "timestamp": OPTIONAL. If you can confidently estimate where in the video this occurs, provide an approximate timestamp as "MM:SS" or "HH:MM:SS". Omit this field entirely if you cannot estimate it.`,
};

/**
 * Also ask Gemini for a short descriptive title for the video,
 * useful for history entries and download file names.
 */
const TITLE_PROMPT = `
## VIDEO TITLE
Also produce a top-level "videoTitle" string: a short, descriptive title (4-10 words) summarizing what the video is about. This should be usable as a file name or history entry label.`;

/**
 * Builds the full prompt sent alongside the video content.
 */
export function buildAnalysisPrompt(selectedOutputs: OutputType[]): string {
  const sections = selectedOutputs.map((type) => SECTION_PROMPTS[type]).join('\n');

  return `${BASE_INSTRUCTIONS}
${TITLE_PROMPT}

Generate the following sections based on the video content:
${sections}

## OUTPUT FORMAT
Respond with a single JSON object only. Do not wrap it in markdown code fences. The JSON object must have a top-level "videoTitle" field plus exactly these top-level keys (and only these): ${JSON.stringify(
    selectedOutputs
  )}.
Match the structure described above precisely.`;
}

/**
 * Builds a Gemini-compatible JSON response schema (subset of OpenAPI)
 * containing only the sections the user requested. Using a schema with
 * `responseMimeType: "application/json"` makes Gemini return reliably
 * parseable structured output.
 */
export function buildResponseSchema(selectedOutputs: OutputType[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    videoTitle: { type: 'string' },
  };
  const required: string[] = ['videoTitle'];

  if (selectedOutputs.includes('summary')) {
    properties.summary = {
      type: 'object',
      properties: {
        executiveSummary: { type: 'string' },
        detailedSummary: { type: 'string' },
        sectionBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['title', 'content'],
          },
        },
        conclusion: { type: 'string' },
      },
      required: ['executiveSummary', 'detailedSummary', 'sectionBreakdown', 'conclusion'],
    };
    required.push('summary');
  }

  if (selectedOutputs.includes('flashcards')) {
    properties.flashcards = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['question', 'answer'],
      },
    };
    required.push('flashcards');
  }

  if (selectedOutputs.includes('keyPoints')) {
    properties.keyPoints = {
      type: 'array',
      items: { type: 'string' },
    };
    required.push('keyPoints');
  }

  if (selectedOutputs.includes('highlights')) {
    properties.highlights = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['moment', 'takeaway', 'statement', 'insight'],
          },
          title: { type: 'string' },
          description: { type: 'string' },
          timestamp: { type: 'string' },
        },
        required: ['type', 'title', 'description'],
      },
    };
    required.push('highlights');
  }

  return {
    type: 'object',
    properties,
    required,
  };
}
