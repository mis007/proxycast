import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSafeInvoke } = vi.hoisted(() => ({
  mockSafeInvoke: vi.fn(),
}));

vi.mock("@/lib/dev-bridge", () => ({
  safeInvoke: mockSafeInvoke,
}));

import {
  createAgentRuntimeSession,
  deleteAgentRuntimeSession,
  getAsterAgentStatus,
  generateAgentRuntimeSessionTitle,
  getAgentRuntimeSession,
  interruptAgentRuntimeTurn,
  listAgentRuntimeSessions,
  respondAgentRuntimeAction,
  submitAgentRuntimeTurn,
  updateAgentRuntimeSession,
} from "./agentRuntime";

describe("Agent API 治理护栏", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createAgentRuntimeSession 应走统一 runtime create 命令", async () => {
    mockSafeInvoke.mockResolvedValueOnce("session-created");

    await expect(
      createAgentRuntimeSession("workspace-2", "新会话", "auto"),
    ).resolves.toBe("session-created");

    expect(mockSafeInvoke).toHaveBeenCalledWith(
      "agent_runtime_create_session",
      {
        workspaceId: "workspace-2",
        name: "新会话",
        executionStrategy: "auto",
      },
    );
  });

  it("getAsterAgentStatus 应返回现役状态结构", async () => {
    mockSafeInvoke.mockResolvedValueOnce({
      initialized: true,
      provider_configured: true,
      provider_name: "Anthropic",
      model_name: "claude-sonnet-4-20250514",
    });

    await expect(getAsterAgentStatus()).resolves.toEqual({
      initialized: true,
      provider_configured: true,
      provider_name: "Anthropic",
      model_name: "claude-sonnet-4-20250514",
    });
  });

  it("submitAgentRuntimeTurn 应走统一 runtime submit 命令", async () => {
    mockSafeInvoke.mockResolvedValueOnce(undefined);

    await submitAgentRuntimeTurn({
      message: "runtime hello",
      session_id: "session-runtime",
      event_name: "event-runtime",
      workspace_id: "workspace-runtime",
      turn_config: {
        execution_strategy: "react",
        provider_config: {
          provider_id: "provider-runtime",
          provider_name: "Provider Runtime",
          model_name: "model-runtime",
        },
        metadata: {
          source: "hook-facade",
        },
      },
    });

    expect(mockSafeInvoke).toHaveBeenCalledWith("agent_runtime_submit_turn", {
      request: {
        message: "runtime hello",
        session_id: "session-runtime",
        event_name: "event-runtime",
        workspace_id: "workspace-runtime",
        turn_config: {
          execution_strategy: "react",
          provider_config: {
            provider_id: "provider-runtime",
            provider_name: "Provider Runtime",
            model_name: "model-runtime",
          },
          metadata: {
            source: "hook-facade",
          },
        },
      },
    });
  });

  it("submitAgentRuntimeTurn 应透传 search_mode 与 queue_if_busy", async () => {
    mockSafeInvoke.mockResolvedValueOnce(undefined);

    await submitAgentRuntimeTurn({
      message: "查一下今天的汇率",
      session_id: "session-runtime-search",
      event_name: "event-runtime-search",
      workspace_id: "workspace-runtime-search",
      queue_if_busy: true,
      queued_turn_id: "queued-turn-1",
      turn_config: {
        execution_strategy: "auto",
        web_search: true,
        search_mode: "allowed",
      },
    });

    expect(mockSafeInvoke).toHaveBeenCalledWith("agent_runtime_submit_turn", {
      request: {
        message: "查一下今天的汇率",
        session_id: "session-runtime-search",
        event_name: "event-runtime-search",
        workspace_id: "workspace-runtime-search",
        queue_if_busy: true,
        queued_turn_id: "queued-turn-1",
        turn_config: {
          execution_strategy: "auto",
          web_search: true,
          search_mode: "allowed",
        },
      },
    });
  });

  it("respondAgentRuntimeAction 应走统一 action 响应命令", async () => {
    mockSafeInvoke.mockResolvedValueOnce(undefined);

    await respondAgentRuntimeAction({
      session_id: "session-runtime",
      request_id: "req-runtime",
      action_type: "ask_user",
      confirmed: true,
      response: '{"answer":"A"}',
      user_data: { answer: "A" },
    });

    expect(mockSafeInvoke).toHaveBeenCalledWith(
      "agent_runtime_respond_action",
      {
        request: {
          session_id: "session-runtime",
          request_id: "req-runtime",
          action_type: "ask_user",
          confirmed: true,
          response: '{"answer":"A"}',
          user_data: { answer: "A" },
        },
      },
    );
  });

  it("interruptAgentRuntimeTurn 与 updateAgentRuntimeSession 应走统一 runtime 命令", async () => {
    mockSafeInvoke.mockResolvedValueOnce(true).mockResolvedValueOnce(undefined);

    await interruptAgentRuntimeTurn({
      session_id: "session-runtime",
      turn_id: "turn-1",
    });
    await updateAgentRuntimeSession({
      session_id: "session-runtime",
      name: "新标题",
      execution_strategy: "auto",
    });

    expect(mockSafeInvoke).toHaveBeenNthCalledWith(
      1,
      "agent_runtime_interrupt_turn",
      {
        request: {
          session_id: "session-runtime",
          turn_id: "turn-1",
        },
      },
    );
    expect(mockSafeInvoke).toHaveBeenNthCalledWith(
      2,
      "agent_runtime_update_session",
      {
        request: {
          session_id: "session-runtime",
          name: "新标题",
          execution_strategy: "auto",
        },
      },
    );
  });

  it("listAgentRuntimeSessions 应返回现役 runtime 会话列表", async () => {
    mockSafeInvoke.mockResolvedValueOnce([
      {
        id: "session-runtime-1",
        name: "Runtime Session",
        model: "claude-sonnet-4-20250514",
        created_at: 1710000000,
        updated_at: 1710000123,
        messages_count: 3,
        execution_strategy: "auto",
        workspace_id: "workspace-1",
        working_dir: "/tmp/workspace-1",
      },
    ]);

    await expect(listAgentRuntimeSessions()).resolves.toEqual([
      {
        id: "session-runtime-1",
        name: "Runtime Session",
        model: "claude-sonnet-4-20250514",
        created_at: 1710000000,
        updated_at: 1710000123,
        messages_count: 3,
        workspace_id: "workspace-1",
        working_dir: "/tmp/workspace-1",
        execution_strategy: "auto",
      },
    ]);
    expect(mockSafeInvoke).toHaveBeenCalledWith("agent_runtime_list_sessions");
  });

  it("getAgentRuntimeSession 应返回现役 runtime 详情并归一 queued_turns", async () => {
    mockSafeInvoke.mockResolvedValueOnce({
      id: "session-runtime-2",
      name: "Runtime Detail",
      model: "gpt-5.4",
      created_at: 1710001000,
      updated_at: 1710002000,
      workspace_id: "workspace-2",
      working_dir: "/tmp/workspace-2",
      execution_strategy: "react",
      queued_turns: [
        {
          queued_turn_id: "queued-1",
          message_text: "排队中的任务",
          message_preview: "排队中的任务",
          created_at: 1710001500,
          image_count: 0,
          position: 2,
        },
      ],
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "hello" }],
          timestamp: 1710001000,
        },
        {
          role: "assistant",
          content: [{ type: "text", text: "world" }],
          timestamp: 1710002000,
        },
      ],
    });

    await expect(getAgentRuntimeSession("session-runtime-2")).resolves.toEqual({
      id: "session-runtime-2",
      name: "Runtime Detail",
      model: "gpt-5.4",
      created_at: 1710001000,
      updated_at: 1710002000,
      workspace_id: "workspace-2",
      working_dir: "/tmp/workspace-2",
      execution_strategy: "react",
      queued_turns: [
        {
          queued_turn_id: "queued-1",
          message_text: "排队中的任务",
          message_preview: "排队中的任务",
          created_at: 1710001500,
          image_count: 0,
          position: 2,
        },
      ],
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "hello" }],
          timestamp: 1710001000,
        },
        {
          role: "assistant",
          content: [{ type: "text", text: "world" }],
          timestamp: 1710002000,
        },
      ],
    });
    expect(mockSafeInvoke).toHaveBeenCalledWith("agent_runtime_get_session", {
      sessionId: "session-runtime-2",
    });
  });

  it("deleteAgentRuntimeSession / updateAgentRuntimeSession / generateAgentRuntimeSessionTitle 应走现役命令", async () => {
    mockSafeInvoke
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce("新的智能标题");

    await deleteAgentRuntimeSession("session-runtime-3");
    await updateAgentRuntimeSession({
      session_id: "session-runtime-3",
      name: "重命名后的标题",
    });
    await expect(
      generateAgentRuntimeSessionTitle("session-runtime-3"),
    ).resolves.toBe("新的智能标题");

    expect(mockSafeInvoke).toHaveBeenNthCalledWith(
      1,
      "agent_runtime_delete_session",
      {
        sessionId: "session-runtime-3",
      },
    );
    expect(mockSafeInvoke).toHaveBeenNthCalledWith(
      2,
      "agent_runtime_update_session",
      {
        request: {
          session_id: "session-runtime-3",
          name: "重命名后的标题",
        },
      },
    );
    expect(mockSafeInvoke).toHaveBeenNthCalledWith(3, "agent_generate_title", {
      sessionId: "session-runtime-3",
    });
  });

});
