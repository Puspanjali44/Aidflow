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
import AdminNgoVerification from "./pages/Adminngoverification";
import ProjectApprovalPage from "./pages/ProjectApprovalPage";
import AdminLayout from "./components/AdminLayout";
import NgoSettings from "./pages/NgoSettings";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import Analytics from "./pages/Analytics";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectDetailsPublic from "./pages/ProjectDetailsPublic";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import "./pages/Admin.css";
import KhaltiReturn from "./pages/KhaltiReturn";

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* DONOR ROUTES */}
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/browse" element={<BrowseNGO />} />
        <Route path="/my-donations" element={<MyDonations />} />
        <Route path="/badges" element={<Badges />} />

        {/* DONOR PROJECT DETAIL */}
        <Route path="/project/:id" element={<ProjectDetailsPublic />} />

        {/* NGO ROUTES */}
        <Route path="/ngo-dashboard" element={<NGODashboard />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/ngo-projects" element={<NgoProjects />} />
        <Route path="/settings" element={<NgoSettings />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* NGO PROJECT DETAIL */}
        <Route path="/projects/:id" element={<ProjectDetails />} />

        {/* KHALTI RETURN */}
        <Route path="/khalti-return" element={<KhaltiReturn />} />

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="ngo-verification" element={<AdminNgoVerification />} />
          <Route path="project-approval" element={<ProjectApprovalPage />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;