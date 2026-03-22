import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginPage           from "./LoginPage";
import DonorDashboard      from "./DonorDashboard";
import BrowseNGO           from "./BrowseNGO";
import MyDonations         from "./pages/MyDonations";
import Badges              from "./Badges";
import NgoProjects         from "./pages/NgoProjects";
import NGODashboard        from "./pages/NGODashboard";
import CreateProject       from "./pages/CreateProject";
import AdminDashboard      from "./pages/AdminDashboard";
import NgoSettings         from "./pages/NgoSettings";
import LandingPage         from "./pages/LandingPage";
import AboutPage           from "./pages/AboutPage";
import Analytics           from "./pages/Analytics";
import ProjectDetails      from "./pages/ProjectDetails";       // NGO view (edit)
import ProjectDetailsPublic from "./pages/ProjectDetailsPublic"; // Donor view (read-only)

function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC */}
        <Route path="/"       element={<LandingPage />} />
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/about"  element={<AboutPage />} />

        {/* DONOR ROUTES */}
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/browse"          element={<BrowseNGO />} />
        <Route path="/my-donations"    element={<MyDonations />} />
        <Route path="/badges"          element={<Badges />} />

        {/* ✅ DONOR — project detail page (read-only + Donate button) */}
        <Route path="/project/:id"  element={<ProjectDetailsPublic />} />

        {/* NGO ROUTES */}
        <Route path="/ngo-dashboard"   element={<NGODashboard />} />
        <Route path="/create-project"  element={<CreateProject />} />
        <Route path="/ngo-projects"    element={<NgoProjects />} />
        <Route path="/settings"        element={<NgoSettings />} />
        <Route path="/analytics"       element={<Analytics />} />

        {/* ✅ NGO — project detail page (full edit) */}
        <Route path="/projects/:id" element={<ProjectDetails />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>
    </Router>
  );
}

export default App;