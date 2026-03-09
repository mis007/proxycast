import { useEffect, useRef, useState } from "react";
import type { GeneratedOutputItem } from "./workbenchRightRailGeneratedOutputs";
import { revokeObjectUrlIfNeeded } from "./workbenchRightRailCapabilityShared";

export function useWorkbenchRightRailGeneratedOutputs() {
  const [generatedOutputs, setGeneratedOutputs] = useState<
    GeneratedOutputItem[]
  >([]);
  const generatedOutputsRef = useRef<GeneratedOutputItem[]>([]);

  useEffect(() => {
    generatedOutputsRef.current = generatedOutputs;
  }, [generatedOutputs]);

  useEffect(() => {
    return () => {
      for (const item of generatedOutputsRef.current) {
        revokeObjectUrlIfNeeded(item.assetUrl ?? "");
      }
    };
  }, []);

  const appendGeneratedOutput = (item: GeneratedOutputItem) => {
    setGeneratedOutputs((previous) => [item, ...previous].slice(0, 20));
  };

  return {
    appendGeneratedOutput,
    generatedOutputs,
  };
}
