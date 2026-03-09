export const A2UI_RENDERER_TOKENS = {
  container: "a2ui-container space-y-4",
  thinkingText: "text-sm text-muted-foreground italic",
  errorText: "text-red-500",
  submitRow: "flex justify-end",
  submitButton:
    "inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200",
  textVariants: {
    h1: "text-2xl font-bold",
    h2: "text-xl font-semibold",
    h3: "text-lg font-semibold",
    h4: "text-base font-medium",
    h5: "text-sm font-medium",
    body: "text-sm",
    caption: "text-xs text-muted-foreground",
  },
} as const;

export default A2UI_RENDERER_TOKENS;
