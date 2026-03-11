import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginPage from "./LoginPage";
import DonorDashboard from "./DonorDashboard";
import BrowseNGO from "./BrowseNGO";
import MyDonations from "./pages/MyDonations";
import Badges from "./Badges";
import NgoProjects from "./pages/NgoProjects";
import NGODashboard from "./pages/NGODashboard";
import CreateProject from "./pages/CreateProject";
import AdminDashboard from "./pages/AdminDashboard";
import NgoSettings from "./pages/NgoSettings";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import Analytics from "./pages/Analytics";
import ProjectDetails from "./pages/ProjectDetails";

function App() {
  return (
    <Router>
      <Routes>

        {/* LANDING PAGE */}
        <Route path="/" element={<LandingPage />} />

        {/* LOGIN + REGISTER (SAME PAGE) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/analytics" element={<Analytics />} />
        

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
        <Route path="/about" element={<AboutPage />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />


      </Routes>
    </Router>
  );
}

export default App;