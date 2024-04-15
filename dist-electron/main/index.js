var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_electron = require("electron");
var import_node_os = require("node:os");
var import_node_path = require("node:path");
var import_Xray = require("./utils/Xray");
var import_menu = require("./utils/menu");
var import_electron_store = __toESM(require("electron-store"));
var import_pg = require("pg");
var import_bcrypt = __toESM(require("bcrypt"));
var import_contants = require("./contants");
var import_electron_dl_manager = require("electron-dl-manager");
var import_bytes = __toESM(require("bytes"));
const manager = new import_electron_dl_manager.ElectronDownloadManager();
process.env.DIST_ELECTRON = (0, import_node_path.join)(__dirname, "../");
process.env.DIST = (0, import_node_path.join)(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? (0, import_node_path.join)(process.env.DIST_ELECTRON, "../public") : process.env.DIST;
const store = new import_electron_store.default({
  defaults: {
    host: "",
    database: "",
    port: 0,
    downloadFolder: ""
  }
});
if ((0, import_node_os.release)().startsWith("6.1"))
  import_electron.app.disableHardwareAcceleration();
if (process.platform === "win32")
  import_electron.app.setAppUserModelId(import_electron.app.getName());
if (!import_electron.app.requestSingleInstanceLock()) {
  import_electron.app.quit();
  process.exit(0);
}
let win = null;
const preload = (0, import_node_path.join)(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = (0, import_node_path.join)(process.env.DIST, "index.html");
async function createWindow() {
  const scrapper = new import_Xray.Scraper();
  win = new import_electron.BrowserWindow({
    title: "Main window",
    icon: (0, import_node_path.join)(process.env.PUBLIC, "favicon.ico"),
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
    win.loadURL(url);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  win.webContents.setWindowOpenHandler(({ url: url2 }) => {
    if (url2.startsWith("https:"))
      import_electron.shell.openExternal(url2);
    return { action: "deny" };
  });
  import_electron.ipcMain.handle("get-items", (_, pathSegment, regex) => {
    return scrapper.getItems({ pathSegment, regex });
  });
  import_electron.ipcMain.on("set-to-store", (_, object) => {
    if (object.password) {
      const salt = import_bcrypt.default.genSaltSync(10);
      const hash = import_bcrypt.default.hashSync(object.password, salt);
      store.set({
        ...object,
        password: hash
      });
    } else {
      store.set(object);
    }
  });
  import_electron.ipcMain.handle("select-folder", async () => {
    const { canceled, filePaths } = await import_electron.dialog.showOpenDialog(win, {
      properties: ["openDirectory"]
    });
    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  });
  import_electron.ipcMain.handle("test-db-connection", async (_, dbValues) => {
    const connectionString = dbValues.username && dbValues.password ? `postgres://${dbValues.username}:${dbValues.password}@${dbValues.host}:${dbValues.port}/${dbValues.database}` : `postgres://${dbValues.host}:${dbValues.port}/${dbValues.database}`;
    const pool = new import_pg.Pool({ connectionString });
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
      import_electron.dialog.showErrorBox("Error", error.message);
      return {
        isDatabaseVerified: false,
        isPostGISInstalled: false,
        error: error.message
      };
    } finally {
      pool.end();
    }
  });
  import_electron.ipcMain.handle("download-zip-files", async (event, layerName, zipFiles) => {
    await zipFiles.reduce(async (promise, zipFile) => {
      await promise;
      await manager.download({
        window: win,
        url: `${import_contants.baseUrl}${layerName}/${zipFile}`,
        saveAsFilename: zipFile,
        directory: store.get("downloadFolder"),
        callbacks: {
          onDownloadProgress: async ({ item, percentCompleted }) => {
            win.webContents.send("download-progress", {
              layerName,
              zipFile,
              percentCompleted,
              // Get the number of bytes received so far
              bytesReceived: (0, import_bytes.default)(item.getReceivedBytes(), { unit: "mb" })
            });
          },
          onDownloadCompleted: async () => {
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
  import_electron.Menu.setApplicationMenu(import_electron.Menu.buildFromTemplate((0, import_menu.template)(win)));
}
import_electron.app.whenReady().then(createWindow);
import_electron.app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin")
    import_electron.app.quit();
});
import_electron.app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized())
      win.restore();
    win.focus();
  }
});
import_electron.app.on("activate", () => {
  const allWindows = import_electron.BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
import_electron.ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new import_electron.BrowserWindow({
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

//# sourceMappingURL=index.js.map