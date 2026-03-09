import { FileSearch } from "lucide-react";

export interface GeneratedOutputItem {
  id: string;
  title: string;
  detail: string;
  assetType?: "image" | "audio";
  assetUrl?: string;
}

export function GeneratedOutputsPanel({
  items,
}: {
  items: GeneratedOutputItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="mt-auto flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
        <FileSearch className="h-6 w-6 opacity-50" />
        <p>生成的素材输出将保存在此处。</p>
      </div>
    );
  }

  return (
    <div className="mt-auto rounded-2xl border border-border/70 bg-muted/20 p-3">
      <div className="text-xs font-semibold text-foreground">生成输出</div>
      <div className="mt-2 max-h-[300px] space-y-2 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            data-testid="workbench-generated-output-item"
            className="rounded-xl border border-border/70 bg-background/95 p-2"
          >
            <div className="text-[12px] font-semibold text-foreground">
              {item.title}
            </div>
            <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {item.detail}
            </div>
            {item.assetType === "image" && item.assetUrl ? (
              <img
                src={item.assetUrl}
                alt={item.title}
                className="mt-2 h-24 w-full rounded-md object-cover"
                loading="lazy"
                data-testid="workbench-generated-output-image"
              />
            ) : null}
            {item.assetType === "audio" && item.assetUrl ? (
              <audio
                controls
                src={item.assetUrl}
                className="mt-2 w-full"
                data-testid="workbench-generated-output-audio"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
