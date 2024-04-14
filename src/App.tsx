import "./App.scss";
import LayersList from "@/components/LayersList";
import { useEffect, useState } from "react";
import SettingsModal from "@/components/SettingsModal";

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
      <LayersList />
    </div>
  );
}

export default App;
