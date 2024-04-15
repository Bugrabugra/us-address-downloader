import React, { useMemo } from "react";
import { Collapse, CollapseProps } from "antd";
import { useAppStore } from "@/store";
import { DeleteOutlined } from "@ant-design/icons";
import { Layer } from "@/types/layers";
import ZipFilesList from "@/components/ZipFilesList";

const LayersCollapse = () => {
  const { removeLayer, layers } = useAppStore();

  const deleteButton = (layer: Layer) => {
    return (
      <DeleteOutlined
        style={{ color: "red" }}
        onClick={(e) => {
          e.stopPropagation();
          removeLayer(layer.name);
        }}
      />
    );
  };

  const layerItems: CollapseProps["items"] = useMemo(() => {
    return layers.map((layer) => {
      return {
        key: layer.name,
        label: layer.name,
        children: <ZipFilesList layerName={layer.name} />,
        extra: deleteButton(layer)
      };
    });
  }, [layers]);

  return layerItems.length > 0 ? <Collapse items={layerItems} /> : null;
};

export default LayersCollapse;
