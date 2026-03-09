import styled from "styled-components";
import type {
  A2UIFormData,
  A2UIResponse,
} from "@/components/content-creator/a2ui/types";
import { CHAT_FLOATING_A2UI_TASK_CARD_PRESET } from "@/components/content-creator/a2ui/taskCardPresets";
import { A2UITaskCard } from "../../A2UITaskCard";

interface A2UIFloatingFormProps {
  response: A2UIResponse;
  onSubmit: (formData: A2UIFormData) => void;
}

const Card = styled.div`
  position: relative;
  margin-bottom: 10px;
  max-width: 100%;
  max-height: min(44vh, 420px);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
    border-radius: 999px;
  }
`;

export function A2UIFloatingForm({
  response,
  onSubmit,
}: A2UIFloatingFormProps) {
  return (
    <Card>
      <A2UITaskCard
        response={response}
        onSubmit={onSubmit}
        compact={true}
        preset={CHAT_FLOATING_A2UI_TASK_CARD_PRESET}
        className="m-0"
      />
    </Card>
  );
}
