import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginPage from "./LoginPage";
import DonorDashboard from "./DonorDashboard";
import BrowseNGO from "./BrowseNGO";
import MyDonations from "./pages/MyDonations"; // correct path
import Badges from "./Badges";
import Settings from "./Settings";
import NgoProjects from "./pages/NgoProjects";
import NGODashboard from "./pages/NGODashboard";
import CreateProject from "./pages/CreateProject";
import AdminDashboard from "./pages/AdminDashboard";
 import NgoSettings from "./pages/NgoSettings";

function App() {
  return (
    <Router>
      <Routes>
        {/* AUTH */}
        <Route path="/" element={<LoginPage />} />

        {/* DONOR ROUTES */}
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/browse" element={<BrowseNGO />} />
        <Route path="/my-donations" element={<MyDonations />} />
        <Route path="/badges" element={<Badges />} />
        
        

        {/* NGO ROUTES */}
        <Route path="/ngo-dashboard" element={<NGODashboard />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/ngo-projects" element={<NgoProjects />} />
        <Route path="/settings" element={<NgoSettings />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;