import { ClientsPage } from "../clients/ClientsPage";

export function ConfigManagementPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">配置管理</h2>
        <p className="text-muted-foreground text-sm">
          一键切换 API 配置，可独立使用。添加 "Lime" 可将凭证池转为标准
          API（
          <code className="px-1 py-0.5 rounded bg-muted text-xs">
            localhost:8999
          </code>
          ）
        </p>
      </div>

      <ClientsPage hideHeader />
    </div>
  );
}
