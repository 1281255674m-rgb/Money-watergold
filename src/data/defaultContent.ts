import type { SiteContent } from "../types";

export const defaultContent: SiteContent = {
  brandName: "浩航科技",
  companyName: "济南浩航网络科技公司",
  slogan: "同心共筑梦想，共创校园价值",
  heroEyebrow: "山东高校校园代理招募计划",
  heroDescription:
    "从身边一条真实需求开始，连接校园与可靠服务。我们正在山东寻找愿意观察、沟通、共创的学生代理。",
  recruitmentTitle: "你了解校园，我们认真承接",
  recruitmentDescription:
    "不要求推销固定商品。发现同学的真实需求，介绍给浩航科技并通过微信完成初步对接，就是合作的开始。",
  services: [
    {
      id: "graduation-recycle",
      title: "毕业季物品回收",
      shortTitle: "毕业季回收",
      summary: "围绕书籍、被褥等毕业物品，连接校园内真实回收需求。",
      details: ["毕业书籍回收", "被褥等物品回收", "校内需求集中对接"],
      icon: "recycle",
    },
    {
      id: "presentation-design",
      title: "PPT 与展示设计",
      shortTitle: "展示设计",
      summary: "帮助学生优化演示逻辑、视觉表达与答辩呈现。",
      details: ["PPT视觉设计", "内容结构优化", "答辩与路演表达"],
      icon: "presentation",
    },
    {
      id: "learning-support",
      title: "学习与学术方法辅导",
      shortTitle: "学习辅导",
      summary: "提供答疑、方法、资料整理与工具使用方面的合规支持。",
      details: ["课程答疑", "学习方法辅导", "资料检索与整理"],
      icon: "learning",
    },
    {
      id: "postgraduate-planning",
      title: "考研规划",
      shortTitle: "考研规划",
      summary: "围绕目标选择、备考节奏与阶段复盘提供规划支持。",
      details: ["目标与方向梳理", "阶段计划制定", "备考节奏复盘"],
      icon: "planning",
    },
    {
      id: "campus-co-create",
      title: "校园需求共创",
      shortTitle: "校园共创",
      summary: "每所学校都有不同需求。欢迎提出新的服务想法，与我们一起验证。",
      details: ["本校特色需求", "校园资源合作", "新服务共同验证"],
      icon: "sparkles",
    },
  ],
  rules: [
    { title: "需求推荐", description: "发现身边真实需求，通过微信完成介绍。" },
    { title: "成交确认", description: "明确需求、服务边界与合作归属，关键过程留痕。" },
    { title: "合作结算", description: "具体比例与结算方式，在合作确认后按规则执行。" },
    { title: "持续沟通", description: "先通过私人微信交流，确认合作后进入企业微信。" },
  ],
  faqs: [
    { question: "需要有销售经验吗？", answer: "不需要。我们更看重你是否了解本校、愿意认真沟通并尊重真实需求。" },
    { question: "必须每天投入很多时间吗？", answer: "不需要固定坐班。根据身边需求和自己的时间参与，具体合作通过企业微信确认。" },
    { question: "学校不在列表里怎么办？", answer: "可以直接填写学校名称。第一阶段面向山东省内高校持续招募。" },
    { question: "报名后多久能收到回复？", answer: "提交后建议先添加私人微信，我们会结合报名信息尽快沟通；确认合作意向后再邀请进入企业微信。" },
    {
      question: "学习辅导包含哪些内容？",
      answer: "仅提供答疑、方法辅导、资料整理和展示优化，不提供代写、替考或虚假学术材料。",
    },
  ],
  publicMetrics: [],
  contactQrUrl: "/wechat-enterprise.png",
  contactLabel: "企业微信",
  personalContactQrUrl: "/wechat-personal.png",
  personalContactLabel: "私人微信 · 茂实",
  updatedAt: new Date(0).toISOString(),
};
