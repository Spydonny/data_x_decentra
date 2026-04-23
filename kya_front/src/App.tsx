import AgentPage from "./components/AgentPage";
import Dashboard from "./components/Dashboard";
import Demo from "./components/Demo";
import Explorer from "./components/Explorer";
import Landing from "./components/Landing";
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import { useKyaRuntime } from "./kya/KyaRuntime";

export default function App() {
  const { view } = useKyaRuntime();

  const pageContent =
    view.view === "register" ? (
      <Register />
    ) : view.view === "dashboard" ? (
      <Dashboard />
    ) : view.view === "agent" ? (
      <AgentPage agentId={view.agentId} />
    ) : view.view === "demo" ? (
      <Demo />
    ) : view.view === "explorer" ? (
      <Explorer />
    ) : (
      <Landing />
    );

  return (
    <div className="min-h-screen bg-[#eef3f0] text-gray-900">
      <Navbar />
      {pageContent}
    </div>
  );
}
