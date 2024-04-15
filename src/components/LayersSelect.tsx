import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { useAppStore } from "@/store";
import { DefaultOptionType } from "rc-select/lib/Select";

const LayersSelect = () => {
  const { addLayer } = useAppStore();
  const [options, setOptions] = useState<DefaultOptionType[]>([]);

  useEffect(() => {
    getLayerNames();
  }, []);

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

  const handleClickItem = (value: string) => {
    addLayer(value);
  };

  return (
    <Select
      placeholder="Please select a layer"
      onChange={handleClickItem}
      options={options}
      style={{ width: "100%" }}
    />
  );
};

export default LayersSelect;
