import { useCallback, useEffect, useMemo, useState } from "react";
import {
  STYLE_LIBRARY_CHANGED_EVENT,
  getStyleLibraryState,
  type StyleLibraryEntry,
  type StyleLibraryState,
} from "@/lib/style-library";

export interface UseStyleLibraryResult extends StyleLibraryState {
  activeEntry: StyleLibraryEntry | null;
  reload: () => void;
}

export function useStyleLibrary(): UseStyleLibraryResult {
  const [state, setState] = useState<StyleLibraryState>(() => getStyleLibraryState());

  const reload = useCallback(() => {
    setState(getStyleLibraryState());
  }, []);

  useEffect(() => {
    reload();

    if (typeof window === "undefined") {
      return undefined;
    }

    const handleChange = () => {
      reload();
    };

    window.addEventListener(STYLE_LIBRARY_CHANGED_EVENT, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(STYLE_LIBRARY_CHANGED_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [reload]);

  const activeEntry = useMemo(
    () => state.entries.find((entry) => entry.id === state.activeEntryId) || null,
    [state.activeEntryId, state.entries],
  );

  return {
    ...state,
    activeEntry,
    reload,
  };
}

export default useStyleLibrary;
