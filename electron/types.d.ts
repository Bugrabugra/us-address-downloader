import { DbSettings } from "./types/settings";

type GetItemsParams = {
  pathName: string;
  regex: RegExp;
};

export type ElectronApi = {
  getItems: ({ pathName, regex }: GetItemsParams) => Promise<string[]>;
  openSettingsMenu: (callback: () => void) => void;
  setToStore: (object: Record<string, string | number>) => void;
  getFromStore: () => Promise<Record<string, string | number>>;
  selectFolder: () => Promise<string>;
  testDbConnection: ({
    dbValues
  }: {
    dbValues: DbSettings;
  }) => Promise<{ status: "success" | "error" }>;
};
