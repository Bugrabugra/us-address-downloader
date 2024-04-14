import { StateCreator } from "zustand";
import { Layer } from "@/types/layers";

type State = {
  layers: Layer[];
};

type Action = {
  addLayer: (layerName: string) => void;
  removeLayer: (layerName: string) => void;
  updateLayer: (layerName: string, zipFiles: string[]) => void;
};

export type LayersSlice = State & Action;

export const layersSlice: StateCreator<
  LayersSlice,
  [["zustand/devtools", never]],
  [],
  LayersSlice
> = (set, get) => {
  return {
    layers: [],
    addLayer: (layerName: string) => {
      set(
        {
          layers: [...get().layers, { name: layerName, zipFiles: [] }]
        },
        false,
        {
          type: "addLayer",
          layerName
        }
      );
    },
    removeLayer: (layerName: string) => {
      set(
        {
          layers: get().layers.filter((layer) => {
            return layer.name !== layerName;
          })
        },
        false,
        {
          type: "removeLayer",
          layerName
        }
      );
    },
    updateLayer: (layerName: string, zipFiles: string[]) => {
      set(
        {
          layers: get().layers.map((layer) => {
            if (layer.name === layerName) {
              return {
                name: layerName,
                zipFiles
              };
            } else {
              return layer;
            }
          })
        },
        false,
        {
          type: "updateLayer",
          layerName,
          zipFiles
        }
      );
    }
  };
};
