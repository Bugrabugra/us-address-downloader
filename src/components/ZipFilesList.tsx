import React, { useEffect, useMemo, useState } from "react";
import { Button, List, Progress, Select, Typography } from "antd";
import { DefaultOptionType } from "rc-select/lib/Select";
import { useAppStore } from "@/store";
import { Download } from "@/types/downloads";

type ZipFilesListProps = {
  layerName: string;
};

const ZipFilesList = ({ layerName }: ZipFilesListProps) => {
  const { updateLayer, layers } = useAppStore();
  const [options, setOptions] = useState<DefaultOptionType[]>([]);
  const [downloads, setDownloads] = useState<
    Record<string, Record<string, Download>>
  >({
    [layerName]: {}
  });

  useEffect(() => {
    getZipFiles();
  }, [layerName]);

  useEffect(() => {
    window.electronApi.downloadProgress(
      ({ layerName, zipFile, percentCompleted, bytesReceived }) => {
        setDownloads((prevState) => {
          if (prevState[layerName]) {
            return {
              ...prevState,
              [layerName]: {
                ...prevState[layerName],
                [zipFile]: { zipFile, percentCompleted, bytesReceived }
              }
            };
          } else {
            return prevState;
          }
        });
      }
    );
  }, []);

  useEffect(() => {
    window.electronApi.downloadCompleted(({ zipFile }) => {
      console.log(zipFile);
    });
  }, []);

  const layer = useMemo(() => {
    return layers.find((layer) => {
      return layer.name === layerName;
    });
  }, [layers]);

  const getZipFiles = async () => {
    const zipFiles = await window.electronApi.getItems({
      pathName: layerName,
      regex: /^([A-Za-z]).*zip$/
    });

    const optionsFromItems = zipFiles.map((item: string) => {
      return { label: item, value: item };
    });

    setOptions(optionsFromItems);
  };

  const handleSelectItem = (value: string[]) => {
    updateLayer(layerName, value);
  };

  const handleDownloadZipFiles = async () => {
    await window.electronApi.downloadZipFiles({
      layerName,
      zipFiles: layer?.zipFiles || []
    });
  };

  const renderDownloadItem = (item: Download) => {
    return (
      <List.Item>
        <div
          style={{
            display: "flex",
            gap: 30,
            width: "100%",
            justifyContent: "space-between"
          }}
        >
          <Typography>{item.zipFile}</Typography>
          <Progress style={{ width: 250 }} percent={item.percentCompleted} />
          <Typography style={{ display: "flex", flex: 1 }}>
            {item.bytesReceived}
          </Typography>
        </div>
      </List.Item>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Select
        mode="multiple"
        style={{ width: "100%" }}
        placeholder="Please select zipfiles to download"
        options={options}
        maxTagCount={3}
        onChange={handleSelectItem}
      />

      <Button type="primary" onClick={handleDownloadZipFiles}>
        Download zip files
      </Button>

      <List
        dataSource={Object.keys(downloads[layerName]).map((key) => {
          return downloads[layerName][key];
        })}
        renderItem={renderDownloadItem}
      />
    </div>
  );
};

export default ZipFilesList;
