import styled from "styled-components";
import type { HintRouteItem } from "../hooks/useHintRoutes";

interface HintRoutePopupProps {
  routes: HintRouteItem[];
  activeIndex: number;
  onSelect: (hint: string) => void;
}

const Popup = styled.div`
  position: absolute;
  bottom: 100%;
  left: 8px;
  margin-bottom: 4px;
  background: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 4px;
  min-width: 180px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
`;

const Item = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: ${(props) =>
    props.$active ? "hsl(var(--accent))" : "transparent"};
  color: hsl(var(--foreground));
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  line-height: 1.4;

  &:hover {
    background: hsl(var(--accent));
  }
`;

const Label = styled.span`
  font-weight: 500;
`;

const Model = styled.span`
  font-size: 11px;
  color: hsl(var(--muted-foreground));
`;

export function HintRoutePopup({
  routes,
  activeIndex,
  onSelect,
}: HintRoutePopupProps) {
  if (routes.length === 0) {
    return null;
  }

  return (
    <Popup>
      {routes.map((route, index) => (
        <Item
          key={route.hint}
          $active={index === activeIndex}
          onClick={() => onSelect(route.hint)}
        >
          <Label>[{route.hint}]</Label>
          <Model>
            {route.provider} / {route.model}
          </Model>
        </Item>
      ))}
    </Popup>
  );
}
