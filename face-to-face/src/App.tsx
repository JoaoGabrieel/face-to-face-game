import { Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/userContext";
import { GameProvider } from "./context/gameContext";
import UsernamePage from "./pages/UsernamePage";
import LobbyPage from "./pages/LobbyPage";
import CoringaPage from "./pages/CoringaPage";
import GamePage from "./pages/GamePage";

function App() {
  return (
    <UserProvider>
      <GameProvider>
        <Routes>
          <Route path="/" element={<UsernamePage />} />
          <Route path="/lobby/:roomId" element={<LobbyPage />} />
          <Route path="/coringa/:roomId" element={<CoringaPage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
        </Routes>
      </GameProvider>
    </UserProvider>
  );
}

export default App;
