export type VoiceoverSpeedType = "0.8x" | "1.0x" | "1.2x";
export type VoiceoverToneTabType = "mine" | "library";
export type VoiceoverToneId =
  | "gaolengyujie"
  | "aojiaobazong"
  | "shuangkuaisisi"
  | "wennuanahu"
  | "shaonianzixin"
  | "yuanboxiaoshu"
  | "yangguangqingnian"
  | "wanwanxiaohe";
export type BgmDurationType = "30s";
export type SfxDurationType = "10s";
export type PodcastModeType = "deep" | "quick" | "debate";
export type PodcastSpeakerModeType = "dual" | "single";

export const VOICEOVER_SPEED_OPTIONS: Array<{
  value: VoiceoverSpeedType;
  label: string;
}> = [
  { value: "0.8x", label: "0.8x" },
  { value: "1.0x", label: "1.0x" },
  { value: "1.2x", label: "1.2x" },
];

export const VOICEOVER_TONE_OPTIONS: Array<{
  id: VoiceoverToneId;
  label: string;
  gender: "男声" | "女声";
}> = [
  { id: "gaolengyujie", label: "高冷御姐", gender: "女声" },
  { id: "aojiaobazong", label: "傲娇霸总", gender: "男声" },
  { id: "shuangkuaisisi", label: "爽快思思", gender: "女声" },
  { id: "wennuanahu", label: "温暖阿虎", gender: "男声" },
  { id: "shaonianzixin", label: "少年梓辛", gender: "男声" },
  { id: "yuanboxiaoshu", label: "渊博小叔", gender: "男声" },
  { id: "yangguangqingnian", label: "阳光青年", gender: "男声" },
  { id: "wanwanxiaohe", label: "湾湾小何", gender: "女声" },
];

export const BGM_DURATION_OPTIONS: Array<{
  value: BgmDurationType;
  label: string;
}> = [{ value: "30s", label: "30s" }];

export const SFX_DURATION_OPTIONS: Array<{
  value: SfxDurationType;
  label: string;
}> = [{ value: "10s", label: "10s" }];

export const PODCAST_MODE_OPTIONS: Array<{
  value: PodcastModeType;
  label: string;
}> = [
  { value: "deep", label: "深度模式" },
  { value: "quick", label: "快速模式" },
  { value: "debate", label: "辩论模式" },
];

export const PODCAST_QUICK_IMPORT_PROMPT = `Agent 炒作何时停？2026 年，请让智能体走下神坛
2026年，AI Agent（智能体）终于从 PPT 里的“万能灵药”变成了企业报表里的“成本项”。当 Computer Use 成为标配，当多智能体协作（Multi-Agent Systems）开始编织数字流水线，那个曾经被吹得天花乱坠的泡沫，终于开始加速破裂。
一、 从“会聊”到“会办”，红利期已过
如果说 2024 年我们还在为 Agent 能写一段代码而欢呼，那么 2026 年的职场早已习惯了嵌入式 AI 的存在。无论是 Salesforce 还是 Office 365，原生智能体已经接管了繁琐的 ERP 和 CRM 操作。这种“去工具化”趋势意味着，单纯靠底层模型能力包装的 Agent 已经失去了溢价能力。
二、 40% 的项目失败率：CFO 的冷酷校准
今年是 AI 行业的“Show me the money”之年。根据行业调研，约 40% 的 Agent 项目因无法量化 ROI（投资回报率）而宣告失败。CFO 们不再听信“改变生产力”的宏大叙事，他们只关心 Token 消耗的成本黑洞与实际业务产出是否对等。那些只有 Demo、没有垂直场景深耕的“套壳”公司，正迎来最残酷的倒闭潮。
三、 落地之痛：数据孤岛与信任危机
尽管技术在飞跃，但 Agent 依然被困在企业内部的数据孤岛中。跨系统的权限摩擦、自主决策带来的安全隐患，以及由于逻辑复杂导致的执行幻觉，让很多企业在临门一脚时选择了保守。Agent 想要真正“接管”工作，需要的不仅是更聪明的 LLM，更是底层业务流程的彻底重构。
四、 结语：泡沫退去，方见真章
Agent 的炒作不会消失，但会“降温”。当市场不再盲目追求通用智能，转而关注那些能扎根在金融、医疗、供应链等垂直领域默默干活的“数字员工”时，AI 才算真正走入了深水区。Agent 炒作何时停？当它不再是新闻，而变成像水电一样的基础设施时，它才真正成功了。`;

export function mapToneToTtsVoice(toneId: VoiceoverToneId): string {
  const toneMap: Record<VoiceoverToneId, string> = {
    gaolengyujie: "alloy",
    aojiaobazong: "onyx",
    shuangkuaisisi: "nova",
    wennuanahu: "echo",
    shaonianzixin: "fable",
    yuanboxiaoshu: "onyx",
    yangguangqingnian: "echo",
    wanwanxiaohe: "shimmer",
  };
  return toneMap[toneId] ?? "alloy";
}

export function parseVoiceSpeed(speed: VoiceoverSpeedType): number {
  const value = Number.parseFloat(speed.replace("x", ""));
  return Number.isFinite(value) ? value : 1;
}
