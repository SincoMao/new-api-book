import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'new-api 通透说明书',
  description: '从零到精通 · 以透明无损转发为主线',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  head: [['meta', { name: 'theme-color', content: '#3c8772' }]],
  themeConfig: {
    outline: { level: [2, 3], label: '本页导航' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdatedText: '最后更新',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    nav: [
      { text: '首页', link: '/' },
      { text: '认识 new-api', link: '/guide/01-认识new-api' },
      { text: '无损转发原理', link: '/guide/05-转发核心机制-透明无损原理' },
      { text: '客户端实战', link: '/guide/11-客户端透明无损对接实战' },
      { text: '附录', link: '/guide/附录A-环境变量表' },
      { text: '研究底稿', link: '/research/00-说明书大纲-初稿' }
    ],
    sidebar: {
      '/guide/': [
        { text: '前言', link: '/guide/00-前言' },
        { text: '第1章 · 认识 new-api', link: '/guide/01-认识new-api' },
        { text: '第2章 · 技术架构全景', link: '/guide/02-技术架构全景' },
        { text: '第3章 · 部署与运维', link: '/guide/03-部署与运维' },
        { text: '第4章 · 渠道系统', link: '/guide/04-渠道系统' },
        { text: '第5章 · 转发核心机制（透明无损原理）', link: '/guide/05-转发核心机制-透明无损原理' },
        { text: '第6章 · 配置与参数调教', link: '/guide/06-配置与参数调教' },
        { text: '第7章 · 令牌·用户·分组', link: '/guide/07-令牌-用户-分组' },
        { text: '第8章 · 计费与成本', link: '/guide/08-计费与成本' },
        { text: '第9章 · 日志·统计·监控', link: '/guide/09-日志-统计-监控' },
        { text: '第10章 · 安全', link: '/guide/10-安全' },
        { text: '第11章 · 客户端透明无损对接实战', link: '/guide/11-客户端透明无损对接实战' },
        {
          text: '附录', collapsed: false, items: [
            { text: 'A · 环境变量表', link: '/guide/附录A-环境变量表' },
            { text: 'B · 转发端点表', link: '/guide/附录B-转发端点表' },
            { text: 'C · 渠道类型枚举表', link: '/guide/附录C-渠道类型枚举表' },
            { text: 'D · 无损风险点速查表', link: '/guide/附录D-无损风险点速查表' },
            { text: 'E · 术语表', link: '/guide/附录E-术语表' },
            { text: 'F · 故障排查 FAQ', link: '/guide/附录F-故障排查FAQ' }
          ]
        },
        { text: '写作规范', link: '/guide/写作规范' }
      ],
      '/research/': [
        {
          text: '研究底稿（带源码 file:line）', items: [
            { text: '00 · 说明书大纲初稿', link: '/research/00-说明书大纲-初稿' },
            { text: '01 · 部署与运维', link: '/research/01-部署与运维-研究素材' },
            { text: '02 · OpenAI 适配器无损透传', link: '/research/02-openai-adaptor无损透传机制-研究素材' },
            { text: '03 · PassThrough 无损透传（亲自验证）', link: '/research/03-PassThrough无损透传机制-亲自验证' },
            { text: '04 · Claude 与 Gemini 适配器', link: '/research/04-Claude与Gemini适配器-无损透传研究' },
            { text: '05 · claude_handler 命门', link: '/research/05-claude_handler命门定论-PassThrough与max_tokens' },
            { text: '06 · 官方文档完整研究', link: '/research/06-官方文档完整研究报告' },
            { text: '07 · 渠道系统', link: '/research/07-渠道系统-完整研究报告' },
            { text: '08 · 转发核心流水线', link: '/research/08-转发核心流水线-完整研究报告' },
            { text: '09 · 转发端点与客户端对接', link: '/research/09-转发端点与客户端对接-完整研究报告' },
            { text: '10 · 配置与参数调教', link: '/research/10-配置与参数调教-完整研究报告' }
          ]
        }
      ]
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/SincoMao/new-api-book' }],
    footer: {
      message: '基于 new-api 源码 commit 1721144221（2026-07-21）撰写 · 以源码为唯一事实依据 · new-api 迭代快，请以你本地源码为准',
      copyright: 'AGPLv3 · 仅供学习研究'
    }
  }
})
