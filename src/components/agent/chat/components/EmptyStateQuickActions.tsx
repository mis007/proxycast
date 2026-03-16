import {
  EMPTY_STATE_META_PILL_CLASSNAME,
  EMPTY_STATE_PANEL_CLASSNAME,
  EMPTY_STATE_PANEL_EMBEDDED_CLASSNAME,
  EMPTY_STATE_PRESET_BUTTON_CLASSNAME,
  EMPTY_STATE_RECOMMENDATION_CARD_CLASSNAME,
} from "./emptyStateSurfaceTokens";

export interface EmptyStateQuickActionItem {
  key: string;
  title: string;
  description: string;
  badge: string;
  prompt: string;
}

export interface EmptyStateQuickPresetItem {
  key: string;
  label: string;
  icon?: string;
  prompt: string;
}

interface EmptyStateQuickActionsProps {
  title: string;
  description: string;
  selectedTextPreview?: string;
  presets?: EmptyStateQuickPresetItem[];
  items: EmptyStateQuickActionItem[];
  embedded?: boolean;
  onPresetAction?: (item: EmptyStateQuickPresetItem) => void;
  onAction: (item: EmptyStateQuickActionItem) => void;
}

export function EmptyStateQuickActions({
  title,
  description,
  selectedTextPreview,
  presets = [],
  items,
  embedded = false,
  onPresetAction,
  onAction,
}: EmptyStateQuickActionsProps) {
  if (items.length === 0 && presets.length === 0) {
    return null;
  }

  return (
    <section
      className={embedded ? EMPTY_STATE_PANEL_EMBEDDED_CLASSNAME : EMPTY_STATE_PANEL_CLASSNAME}
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <p className="mt-1 text-xs leading-5 text-slate-500 md:text-sm">
            {description}
          </p>
        </div>
      </div>

      {presets.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => onPresetAction?.(preset)}
              className={EMPTY_STATE_PRESET_BUTTON_CLASSNAME}
            >
              {preset.icon ? (
                <span aria-hidden="true" className="text-base leading-none">
                  {preset.icon}
                </span>
              ) : null}
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedTextPreview ? (
        <div className="mt-2.5 rounded-2xl border border-sky-200/70 bg-sky-50/85 px-3.5 py-2.5 text-xs leading-5 text-slate-600">
          已检测到当前选中内容，点击推荐动作时会自动携带上下文：
          <span className="ml-1 font-medium text-slate-900">
            “{selectedTextPreview}”
          </span>
        </div>
      ) : null}

      <div className="mt-2.5 grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onAction(item)}
            className={EMPTY_STATE_RECOMMENDATION_CARD_CLASSNAME}
          >
            <div className="flex w-full items-start justify-between gap-3">
              <span className={EMPTY_STATE_META_PILL_CLASSNAME}>
                {item.badge}
              </span>
              <span className="text-[11px] font-medium text-slate-400 transition-colors group-hover:text-slate-500">
                立即开始
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                {item.title}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default EmptyStateQuickActions;
