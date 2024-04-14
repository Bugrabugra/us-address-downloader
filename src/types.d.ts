type GetItemsParams = {
  pathName: string;
  regex: RegExp;
};

type DbSettings = {
  host: string;
  port: number;
  database: string;
};

export type ElectronApi = {
  getItems: ({ pathName, regex }: GetItemsParams) => Promise<string[]>;
  openSettingsMenu: (callback: () => void) => void;
  setToStore: (object: Record<string, string | number>) => Promise<void>;
  getFromStore: () => Promise<Record<string, string | number>>;
  selectFolder: () => Promise<string>;
  testDbConnection: ({ dbValues }: { dbValues: DbSettings }) => Promise<{
    status: "success" | "error";
  }>;
};

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}
