import { useCallback, useState } from "react";
import { aiService } from "../../infrastructure/api/aiService";
import type {
  CodeFeedbackRequest,
  CodeFeedbackResponse,
  PSeIntGenerateRequest,
  PSeIntGenerateResponse,
} from "../../shared/types/CodeFeedback";

interface UseCodeAwareFeedbackReturn {
  analyze: (data: CodeFeedbackRequest) => Promise<CodeFeedbackResponse | null>;
  generatePSeInt: (
    data: PSeIntGenerateRequest,
  ) => Promise<PSeIntGenerateResponse | null>;
  feedback: CodeFeedbackResponse | null;
  pseint: PSeIntGenerateResponse | null;
  loading: boolean;
  error: string | null;
}

export function useCodeAwareFeedback(): UseCodeAwareFeedbackReturn {
  const [feedback, setFeedback] = useState<CodeFeedbackResponse | null>(null);
  const [pseint, setPseint] = useState<PSeIntGenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (_data: CodeFeedbackRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.analyzeCode(_data);
      setFeedback(result);
      return result;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error analizando código";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePSeInt = useCallback(async (_data: PSeIntGenerateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.generatePSeInt(_data);
      setPseint(result);
      return result;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error generando PSeInt";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, generatePSeInt, feedback, pseint, loading, error };
}
