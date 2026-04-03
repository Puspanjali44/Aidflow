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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/browse" element={<BrowseNGO />} />
        <Route path="/my-donations" element={<MyDonations />} />
        <Route path="/badges" element={<Badges />} />

        <Route path="/project/:id" element={<ProjectDetailsPublic />} />

        <Route path="/ngo-dashboard" element={<NGODashboard />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/ngo-projects" element={<NgoProjects />} />
        <Route path="/settings" element={<NgoSettings />} />
        <Route path="/analytics" element={<Analytics />} />

        <Route path="/projects/:id" element={<ProjectDetails />} />

        <Route path="/khalti-return" element={<KhaltiReturn />} />

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