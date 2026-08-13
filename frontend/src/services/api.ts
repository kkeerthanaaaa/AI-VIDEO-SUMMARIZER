import axios, { AxiosError } from 'axios';
import { ApiErrorResponse, ChatRole, JobStatusResponse, OutputType } from '../types';

/**
 * In local development, VITE_API_BASE_URL is left empty and requests go to
 * "/api/..." which Vite proxies to the backend (see vite.config.ts).
 * In production, set VITE_API_BASE_URL to the deployed backend URL.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 60_000,
});

/** A friendly, user-facing error with a stable code for special-casing. */
export class ApiError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code = 'UNKNOWN_ERROR', status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiErrorResponse>;
    if (axiosErr.response?.data?.error) {
      const { message, code } = axiosErr.response.data.error;
      return new ApiError(message, code, axiosErr.response.status);
    }
    if (axiosErr.code === 'ECONNABORTED') {
      return new ApiError(
        'The request timed out. Please check your connection and try again.',
        'TIMEOUT'
      );
    }
    if (!axiosErr.response) {
      return new ApiError(
        'Unable to reach the server. Please check your connection and try again.',
        'NETWORK_ERROR'
      );
    }
  }
  return new ApiError('Something went wrong. Please try again.', 'UNKNOWN_ERROR');
}

/**
 * Kicks off processing for an uploaded video file. Returns the jobId used
 * to poll for status via pollJobStatus / getJobStatus.
 */
export async function submitVideoFile(
  file: File,
  outputs: OutputType[],
  onUploadProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('outputs', JSON.stringify(outputs));

  try {
    const { data } = await api.post<{ jobId: string }>('/video/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!onUploadProgress || !evt.total) return;
        onUploadProgress(Math.round((evt.loaded / evt.total) * 100));
      },
    });
    return data.jobId;
  } catch (err) {
    throw toApiError(err);
  }
}

/**
 * Kicks off processing for a video URL (YouTube or direct link). Returns the
 * jobId used to poll for status.
 */
export async function submitVideoUrl(url: string, outputs: OutputType[]): Promise<string> {
  try {
    const { data } = await api.post<{ jobId: string }>('/video/process', {
      url,
      outputs,
    });
    return data.jobId;
  } catch (err) {
    throw toApiError(err);
  }
}

/** Fetches the current status/result for a processing job. */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  try {
    const { data } = await api.get<JobStatusResponse>(`/video/status/${jobId}`);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

/**
 * Asks a follow-up question about a previously processed video, reusing the
 * same jobId (and therefore the same video reference Gemini already has).
 */
export async function askVideoQuestion(
  jobId: string,
  question: string,
  history: { role: ChatRole; text: string }[]
): Promise<string> {
  try {
    const { data } = await api.post<{ answer: string }>('/video/chat', {
      jobId,
      question,
      history,
    });
    return data.answer;
  } catch (err) {
    throw toApiError(err);
  }
}
export async function pollJobUntilDone(
  jobId: string,
  onUpdate: (status: JobStatusResponse) => void,
  options: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<JobStatusResponse> {
  const intervalMs = options.intervalMs ?? 1500;
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  const startedAt = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const status = await getJobStatus(jobId);
    onUpdate(status);

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new ApiError(
        'The video is taking longer than expected to process. Please try again later.',
        'TIMEOUT'
      );
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
