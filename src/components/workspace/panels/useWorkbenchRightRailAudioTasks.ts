import type { GeneratedOutputItem } from "./workbenchRightRailGeneratedOutputs";
import { useWorkbenchRightRailAudioContentTasks } from "./useWorkbenchRightRailAudioContentTasks";
import { useWorkbenchRightRailVoiceoverTasks } from "./useWorkbenchRightRailVoiceoverTasks";

interface UseWorkbenchRightRailAudioTasksParams {
  projectId?: string | null;
  appendGeneratedOutput: (item: GeneratedOutputItem) => void;
  handleSubmitPrompt: (prompt: string) => Promise<boolean>;
}

export function useWorkbenchRightRailAudioTasks({
  projectId,
  appendGeneratedOutput,
  handleSubmitPrompt,
}: UseWorkbenchRightRailAudioTasksParams) {
  const voiceoverTasks = useWorkbenchRightRailVoiceoverTasks({
    projectId,
    appendGeneratedOutput,
  });
  const audioContentTasks = useWorkbenchRightRailAudioContentTasks({
    projectId,
    appendGeneratedOutput,
    handleSubmitPrompt,
  });

  return {
    ...voiceoverTasks,
    ...audioContentTasks,
  };
}
