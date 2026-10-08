/** Locale-owned connection and deployment guidance. @module */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** Dictionary namespace for Data-Juicer controls. */
export const NS = 'data-juicer'

/** Chinese dictionary and key source. */
export const zh = {
  setup: '请在运行 DSH 的同一台机器上安装并启动 Data-Juicer recipe-flow 服务。启用本插件不会安装 Python、Data-Juicer 或模型。',
  endpoint: '服务地址',
  retry: '检查连接',
  'phase.connecting': '正在检查连接',
  'phase.ready': '已连接，算子查询可用',
  'phase.unavailable': '服务不可用，请检查部署和地址后重试',
  'phase.closed': '集成已关闭',
  disconnected: '无法读取服务状态，请检查 DSH 连接',
  details: '诊断信息',
  discoveryOnly: '目前仅提供配置、数据加载策略和算子查询，不会执行数据处理或分析',
} satisfies Record<string, string>

/** Key union shared by both dictionaries. */
export type DataJuicerKey = keyof typeof zh

/** English dictionary checked against the Chinese key set. */
export const en = {
  setup: 'Install and start a Data-Juicer recipe-flow service on the same machine as DSH. Enabling this plugin does not install Python, Data-Juicer, or models.',
  endpoint: 'Service endpoint',
  retry: 'Check connection',
  'phase.connecting': 'Checking connection',
  'phase.ready': 'Connected; operator discovery is available',
  'phase.unavailable': 'Service unavailable. Check deployment and endpoint, then retry.',
  'phase.closed': 'Integration closed',
  disconnected: 'Cannot read service status. Check the DSH connection.',
  details: 'Diagnostics',
  discoveryOnly: 'Configuration, loading strategies, and operator discovery only. Processing and analysis are not executed.',
} satisfies Record<DataJuicerKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Data-Juicer deployment and connection copy. */
    'data-juicer': DataJuicerKey
  }
}
