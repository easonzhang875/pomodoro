const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 发送系统通知
  sendNotification: (title, body) =>
    ipcRenderer.invoke('send-notification', { title, body }),

  // 更新托盘文字
  updateTray: (text) =>
    ipcRenderer.invoke('update-tray', text),

  // 切换窗口置顶
  setAlwaysOnTop: (flag) =>
    ipcRenderer.invoke('set-always-on-top', flag),

  // 最小化窗口
  minimizeWindow: () =>
    ipcRenderer.invoke('minimize-window'),

  // 关闭窗口（隐藏到托盘）
  closeWindow: () =>
    ipcRenderer.invoke('close-window'),
});
