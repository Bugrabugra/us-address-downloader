import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import { release } from "node:os";
import { join } from "node:path";
import { Scraper } from "./utils/Xray";
import { template } from "./utils/menu";
import Store from "electron-store";
import { Settings } from "../types/settings";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { baseUrl } from "./contants";
import { ElectronDownloadManager } from "electron-dl-manager";
import bytes from "bytes";

const manager = new ElectronDownloadManager();

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//

process.env.DIST_ELECTRON = join(__dirname, "../");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

const store = new Store<Settings>({
  defaults: {
    host: "",
    database: "",
    port: 0,
    downloadFolder: ""
  }
});

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

async function createWindow() {
  const scrapper = new Scraper();

  win = new BrowserWindow({
    title: "Main window",
    icon: join(process.env.PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // const regex = /^([A-Z]).*\/$/;
  // const regex = /^([A-Za-z]).*zip$/;
  ipcMain.handle("get-items", (_, pathSegment, regex) => {
    return scrapper.getItems({ pathSegment, regex });
  });

  ipcMain.on("set-to-store", (_, object) => {
    if (object.password) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(object.password, salt);
      store.set({
        ...object,
        password: hash
      });
    } else {
      store.set(object);
    }
  });

  ipcMain.handle("select-folder", async () => {
    // console.log(app.getPath("userData"));
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"]
    });
    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  });

  ipcMain.handle("test-db-connection", async (_, dbValues) => {
    const connectionString =
      dbValues.username && dbValues.password
        ? `postgres://${dbValues.username}:${dbValues.password}@${dbValues.host}:${dbValues.port}/${dbValues.database}`
        : `postgres://${dbValues.host}:${dbValues.port}/${dbValues.database}`;
    const pool = new Pool({ connectionString });

    try {
      await pool.connect();
      const response = await pool.query(
        "select * from pg_extension where extname='postgis'"
      );
      return {
        isDatabaseVerified: Array.isArray(response.rows),
        isPostGISInstalled: response.rows.length > 0,
        error: null
      };
    } catch (error) {
      dialog.showErrorBox("Error", error.message);
      return {
        isDatabaseVerified: false,
        isPostGISInstalled: false,
        error: error.message
      };
    } finally {
      pool.end();
    }
  });

  ipcMain.handle("download-zip-files", async (event, layerName, zipFiles) => {
    await zipFiles.reduce(async (promise, zipFile) => {
      await promise;

      await manager.download({
        window: win,
        url: `${baseUrl}${layerName}/${zipFile}`,
        saveAsFilename: zipFile,
        directory: store.get("downloadFolder"),
        callbacks: {
          onDownloadProgress: async ({ item, percentCompleted }) => {
            // Send the download progress back to the renderer
            win.webContents.send("download-progress", {
              layerName,
              zipFile,
              percentCompleted,
              // Get the number of bytes received so far
              bytesReceived: bytes(item.getReceivedBytes(), { unit: "mb" })
            });
          },
          onDownloadCompleted: async () => {
            // Send the download completion back to the renderer
            win.webContents.send("download-completed", {
              zipFile
              // Get the path to the file that was downloaded
              // filePath: item.getSavePath()
            });
          }
        }
      });
    }, Promise.resolve());
  });

  // TODO ts hatasini duzelt
  Menu.setApplicationMenu(Menu.buildFromTemplate(template(win)));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
