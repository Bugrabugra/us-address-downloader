import "./App.scss";
import LayersCollapse from "@/components/LayersCollapse";
import { useEffect, useState } from "react";
import SettingsModal from "@/components/SettingsModal";
import LayersSelect from "@/components/LayersSelect";

function App() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const listenOpenSettingsMenu = () => {
    window.electronApi.openSettingsMenu(() => {
      setIsModalVisible(true);
    });
  };

  useEffect(() => {
    listenOpenSettingsMenu();
  }, []);

  return (
    <div className="App">
      <SettingsModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <LayersSelect />

        <LayersCollapse />
      </div>
    </div>
  );
}

export default App;
