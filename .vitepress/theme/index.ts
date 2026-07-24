import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ZoomFlowchart from './components/ZoomFlowchart.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ZoomFlowchart', ZoomFlowchart)
  }
} satisfies Theme
