import { create } from "zustand";
import { layersSlice, LayersSlice } from "@/store/slices/layers";
import { devtools } from "zustand/middleware";

export const useAppStore = create<LayersSlice>()(
  devtools((...props) => {
    return {
      ...layersSlice(...props)
    };
  })
);
