import { app, BrowserWindow } from "electron";

const isMac = process.platform === "darwin";

export const template = (win: BrowserWindow) => {
  return [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              {
                label: "Settings",
                click: () => {
                  win.webContents.send("open-settings-menu");
                }
              },
              { type: "separator" },
              { role: "quit" }
            ]
          }
        ]
      : [])
  ];
};
