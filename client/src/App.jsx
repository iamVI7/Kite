import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SessionPage from "./pages/SessionPage";
import JoinPage from "./pages/JoinPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/session/:roomId" element={<SessionPage />} />
      <Route path="/join/:roomId" element={<JoinPage />} />
    </Routes>
  );
}
