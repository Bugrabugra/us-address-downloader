import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { DefaultOptionType } from "rc-select/lib/Select";
import { useAppStore } from "@/store";

const LayersList = () => {
  const { addLayer, layers } = useAppStore();
  const [options, setOptions] = useState<DefaultOptionType[]>([]);

  const getLayerNames = async () => {
    const items = await window.electronApi.getItems({
      pathName: "",
      regex: /^([A-Z]).*\/$/
    });

    const optionsFromItems = items.map((item: string) => {
      return { label: item, value: item };
    });

    setOptions(optionsFromItems);
  };

  useEffect(() => {
    getLayerNames();
  }, []);

  const handleClickItem = (value: string) => {
    addLayer(value);
  };

  return (
    <Select
      onChange={handleClickItem}
      options={options}
      style={{ width: 200 }}
    />
  );
};

export default LayersList;
