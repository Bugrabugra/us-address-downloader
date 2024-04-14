export type FolderSettings = {
  downloadFolder: string;
};

export type DbSettings = {
  host: string;
  port: number;
  database: string;
};

export type Settings = FolderSettings & DbSettings;
