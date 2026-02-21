import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import DonorDashboard from "./DonorDashboard";
import BrowseNGO from "./BrowseNGO";
import MyDonations from "./MyDonations";
import Badges from "./Badges";
import Settings from "./Settings";
import NGODashboard from "./pages/NGODashboard";
import CreateProject from "./pages/CreateProject";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DonorDashboard />} />
        <Route path="/browse" element={<BrowseNGO />} />
        <Route path="/donations" element={<MyDonations />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/ngo-dashboard" element={<NGODashboard />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;