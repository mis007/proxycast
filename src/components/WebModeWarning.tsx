/**
 * Web Mode Warning Component
 *
 * Displays a warning banner when running in web mode (npm run dev)
 * to inform users that some features may not work without Tauri backend
 */

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import styled from "styled-components";
import { hasTauriRuntimeMarkers } from "@/lib/tauri-runtime";

const WarningBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #78350f;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
`;

const Content = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.div`
  font-weight: 600;
`;

const Description = styled.div`
  font-size: 12px;
  opacity: 0.9;
`;

const Code = styled.code`
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #78350f;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

export function WebModeWarning() {
  const [visible, setVisible] = useState(true);

  // Check if running in Tauri
  const isTauri = hasTauriRuntimeMarkers();

  // Only show in web mode (not Tauri)
  if (isTauri || !visible) {
    return null;
  }

  return (
    <WarningBanner>
      <Content>
        <IconWrapper>
          <AlertTriangle size={20} />
        </IconWrapper>
        <Message>
          <Title>⚠️ Web Mode - Limited Functionality</Title>
          <Description>
            Running in browser mode. Some features require Tauri backend. For
            full functionality, run: <Code>npm run tauri dev</Code>
          </Description>
        </Message>
      </Content>
      <CloseButton onClick={() => setVisible(false)} title="Close">
        <X size={18} />
      </CloseButton>
    </WarningBanner>
  );
}
