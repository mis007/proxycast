/**
 * 发送测试消息按钮组件
 *
 * 用于向通知渠道发送测试消息
 */

import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationChannelsApi, NotificationChannelType } from "@/lib/api/channels";

export interface SendTestMessageButtonProps {
  channelId: string;
  channelName: string;
  channelType: NotificationChannelType;
}

const DEFAULT_TEST_MESSAGES = {
  [NotificationChannelType.FEISHU]: "这是一条来自 Lime 的测试消息 📱",
  [NotificationChannelType.TELEGRAM]: "This is a test message from Lime 🚀",
  [NotificationChannelType.DISCORD]: "🎉 Test message from Lime",
};

export function SendTestMessageButton({
  channelId,
  channelName: _channelName,
  channelType,
}: SendTestMessageButtonProps) {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(
    async (message?: string) => {
      setSending(true);
      try {
        const testMessage =
          message ||
          DEFAULT_TEST_MESSAGES[channelType] ||
          t("测试消息", "这是一条测试消息");

        const result = await notificationChannelsApi.testChannel(
          channelId,
          testMessage
        );

        if (result.success) {
          toast.success(
            t("发送成功", "发送成功") + ": " + result.message
          );
        } else {
          toast.error(
            t("发送失败", "发送失败") + ": " + result.message
          );
        }
      } catch (e) {
        toast.error(
          t("发送失败", "发送失败") + ": " + (e instanceof Error ? e.message : e)
        );
      } finally {
        setSending(false);
      }
    },
    [channelId, channelType, t]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={sending}
          title={t("发送测试消息", "发送测试消息")}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSend()}>
          {t("发送默认测试消息", "发送默认测试消息")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const customMessage = prompt(
              t("请输入测试消息内容", "请输入测试消息内容"),
              DEFAULT_TEST_MESSAGES[channelType]
            );
            if (customMessage && customMessage.trim()) {
              handleSend(customMessage.trim());
            }
          }}
        >
          {t("发送自定义消息...", "发送自定义消息...")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SendTestMessageButton;
