import NGOSidebar from "./NGOSidebar";
import "../pages/NGODashboard.css";

function NgoLayout({ children }) {
  return (
    <div className="ngo-layout">
      <NGOSidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

export default NgoLayout;