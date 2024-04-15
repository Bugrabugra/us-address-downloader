import { DbSettings } from "./types/settings";

type GetItemsParams = {
  pathName: string;
  regex: RegExp;
};

type DownloadZipFilesParams = {
  layerName: string;
  zipFiles: string[];
};

export type ElectronApi = {
  getItems: ({ pathName, regex }: GetItemsParams) => Promise<string[]>;
  openSettingsMenu: (callback: () => void) => void;
  setToStore: (object: Record<string, string | number>) => void;
  getFromStore: () => Promise<Record<string, string | number>>;
  selectFolder: () => Promise<string>;
  testDbConnection: ({ dbValues }: { dbValues: DbSettings }) => Promise<{
    isDatabaseVerified: boolean;
    isPostGISInstalled: boolean;
    error: string | null;
  }>;
  downloadZipFiles: ({
    layerName,
    zipFiles
  }: DownloadZipFilesParams) => Promise<void>;
  downloadProgress: (
    callback: ({ layerName, zipFile, percentCompleted, bytesReceived }) => void
  ) => void;
  downloadCompleted: (callback: ({ zipFile }) => void) => void;
};
