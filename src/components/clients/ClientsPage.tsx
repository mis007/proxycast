import { useState } from "react";
import { AppType } from "@/lib/api/switch";
import { AppTabs } from "./AppTabs";
import { ProviderList } from "./ProviderList";

interface ClientsPageProps {
  hideHeader?: boolean;
}

export function ClientsPage({ hideHeader = false }: ClientsPageProps) {
  const [activeApp, setActiveApp] = useState<AppType>("claude");

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div>
          <h2 className="text-2xl font-bold">配置切换</h2>
          <p className="text-muted-foreground text-sm">
            一键切换 API 配置，可独立使用。添加 "Lime" 可将凭证池转为标准
            API（
            <code className="px-1 py-0.5 rounded bg-muted text-xs">
              localhost:8999
            </code>
            ）
          </p>
        </div>
      )}

      <AppTabs activeApp={activeApp} onAppChange={setActiveApp} />
      <ProviderList appType={activeApp} />
    </div>
  );
}
