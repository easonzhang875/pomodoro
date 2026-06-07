const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// ---- 创建主窗口 ----
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 520,
    resizable: false,
    frame: false,           // 无边框窗口
    transparent: true,      // 透明背景（实现圆角）
    alwaysOnTop: false,
    icon: path.join(__dirname, 'assets', 'icon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 关闭窗口时隐藏到托盘，而不是退出
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---- 系统托盘 ----
function createTray() {
  // 用 SVG 生成托盘图标（16x16 小图标）
  const iconPath = path.join(__dirname, 'assets', 'icon.svg');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow?.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow?.show();
          mainWindow?.focus();
        }
      },
    },
    {
      label: '置顶窗口',
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        mainWindow?.setAlwaysOnTop(menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('番茄钟');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

// ---- IPC 处理 ----
function setupIPC() {
  // 发送系统通知
  ipcMain.handle('send-notification', async (_event, { title, body }) => {
    if (Notification.isSupported()) {
      const notif = new Notification({
        title,
        body,
        icon: path.join(__dirname, 'assets', 'icon.svg'),
      });
      notif.show();

      // 点击通知时显示窗口
      notif.on('click', () => {
        mainWindow?.show();
        mainWindow?.focus();
      });
    }
    return true;
  });

  // 更新托盘提示文字
  ipcMain.handle('update-tray', async (_event, text) => {
    tray?.setToolTip(text);
    return true;
  });

  // 切换置顶
  ipcMain.handle('set-always-on-top', async (_event, flag) => {
    mainWindow?.setAlwaysOnTop(flag);
    return mainWindow?.isAlwaysOnTop();
  });

  // 最小化窗口
  ipcMain.handle('minimize-window', async () => {
    mainWindow?.minimize();
  });

  // 关闭窗口
  ipcMain.handle('close-window', async () => {
    mainWindow?.hide();
  });
}

// ---- 应用生命周期 ----
app.whenReady().then(() => {
  setupIPC();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
