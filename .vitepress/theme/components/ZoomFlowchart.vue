<template>
  <div class="zoom-flowchart">
    <div class="zoom-toolbar">
      <button @click="zoomIn" title="放大">＋</button>
      <button @click="zoomOut" title="缩小">－</button>
      <button @click="reset" title="重置">重置</button>
      <span class="zoom-hint">🖱️ 滚轮缩放 · 拖拽平移 · 双击重置</span>
    </div>
    <div
      ref="viewport"
      class="zoom-viewport"
      @mousedown.prevent="onMouseDown"
      @wheel.prevent="onWheel"
      @dblclick="reset"
    >
      <div
        class="zoom-content"
        :style="{ transform: `translate(${px}px, ${py}px) scale(${scale})` }"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const scale = ref(0.8)
const px = ref(0)
const py = ref(0)

let dragging = false
let lastX = 0
let lastY = 0

function onMouseDown(e) {
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
function onMouseMove(e) {
  if (!dragging) return
  px.value += e.clientX - lastX
  py.value += e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
}
function onMouseUp() {
  dragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}
function onWheel(e) {
  const delta = e.deltaY > 0 ? -0.08 : 0.08
  scale.value = Math.max(0.3, Math.min(3, +(scale.value + delta).toFixed(2)))
}
function zoomIn() { scale.value = Math.min(3, +(scale.value + 0.15).toFixed(2)) }
function zoomOut() { scale.value = Math.max(0.3, +(scale.value - 0.15).toFixed(2)) }
function reset() { scale.value = 0.8; px.value = 0; py.value = 0 }

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
.zoom-flowchart {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  margin: 20px 0;
}
.zoom-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
  position: relative;
  z-index: 1;
}
.zoom-toolbar button {
  padding: 2px 10px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  cursor: pointer;
  font-size: 14px;
  color: var(--vp-c-text-1);
  line-height: 1.5;
}
.zoom-toolbar button:hover {
  background: var(--vp-c-bg-soft-up);
}
.zoom-hint {
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin-left: auto;
  white-space: nowrap;
}
.zoom-viewport {
  height: 70vh;
  min-height: 500px;
  overflow: hidden;
  cursor: grab;
  position: relative;
  background: var(--vp-c-bg-soft);
}
.zoom-viewport:active {
  cursor: grabbing;
}
.zoom-content {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  padding: 20px;
  min-width: 100%;
}
.zoom-content :deep(pre) {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.55;
  white-space: pre;
  background: transparent !important;
  padding: 0 !important;
  color: var(--vp-c-text-1);
}
</style>
