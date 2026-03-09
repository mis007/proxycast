import { useEffect, useRef, useState } from "react";
import type { A2UISubmissionNoticeData } from "../components/A2UISubmissionNotice";

interface UseA2UISubmissionNoticeParams {
  notice?: A2UISubmissionNoticeData | null;
  enabled: boolean;
  fadeOutMs?: number;
}

export function useA2UISubmissionNotice({
  notice,
  enabled,
  fadeOutMs = 180,
}: UseA2UISubmissionNoticeParams) {
  const [visibleNotice, setVisibleNotice] =
    useState<A2UISubmissionNoticeData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (enabled && notice) {
      setVisibleNotice(notice);
      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    setIsVisible(false);
    hideTimerRef.current = setTimeout(() => {
      setVisibleNotice(null);
      hideTimerRef.current = null;
    }, fadeOutMs);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [enabled, fadeOutMs, notice]);

  return {
    visibleNotice,
    isVisible,
  };
}
