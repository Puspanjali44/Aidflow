import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/projects/admin/all", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setProjects(data);
  };

  const approveProject = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/projects/${id}/approve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProjects();
  };

  const rejectProject = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/projects/${id}/reject`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProjects();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const styles = {
    wrapper: {
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-base)',
    },
    sidebar: {
      width: 260,
      background: 'var(--bg-white)',
      padding: '28px 16px',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
    },
    sidebarLogo: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      fontWeight: 800,
      color: 'var(--green)',
      letterSpacing: -0.5,
      marginBottom: 8,
      padding: '0 4px',
    },
    sidebarSubtitle: {
      fontSize: 10.5,
      color: 'var(--text-light)',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      padding: '0 4px',
      marginBottom: 36,
    },
    main: {
      flex: 1,
      padding: '44px 48px',
      overflowY: 'auto',
    },
    title: {
      fontFamily: 'var(--font-display)',
      fontSize: 30,
      fontWeight: 800,
      color: 'var(--text-primary)',
      letterSpacing: -0.8,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginBottom: 32,
    },
    card: {
      background: 'var(--bg-white)',
      padding: '24px 26px',
      marginBottom: 16,
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-light)',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.22s',
      position: 'relative',
      overflow: 'hidden',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-primary)',
      marginBottom: 8,
    },
    cardDesc: {
      fontSize: 13.5,
      color: 'var(--text-secondary)',
      lineHeight: 1.6,
      marginBottom: 8,
    },
    cardMeta: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginBottom: 4,
    },
    badge: (status) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: status === 'under_review'
        ? 'rgba(245, 158, 11, 0.06)'
        : status === 'active'
        ? 'rgba(27, 67, 50, 0.06)'
        : 'rgba(220, 53, 69, 0.06)',
      color: status === 'under_review'
        ? 'var(--orange)'
        : status === 'active'
        ? 'var(--green)'
        : 'var(--red)',
      border: `1px solid ${
        status === 'under_review'
          ? 'rgba(245, 158, 11, 0.2)'
          : status === 'active'
          ? 'rgba(27, 67, 50, 0.15)'
          : 'rgba(220, 53, 69, 0.15)'
      }`,
      marginBottom: 12,
    }),
    btnGroup: {
      display: 'flex',
      gap: 8,
      marginTop: 16,
    },
    approveBtn: {
      padding: '8px 20px',
      borderRadius: 8,
      border: 'none',
      background: 'linear-gradient(135deg, var(--green), var(--green-hover))',
      color: 'var(--bg-base)',
      fontFamily: 'var(--font-body)',
      fontSize: 12.5,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.18s',
      boxShadow: '0 2px 10px rgba(27, 67, 50, 0.12)',
    },
    rejectBtn: {
      padding: '8px 20px',
      borderRadius: 8,
      border: '1px solid rgba(220, 53, 69, 0.15)',
      background: 'var(--bg-white)',
      color: 'var(--red)',
      fontFamily: 'var(--font-body)',
      fontSize: 12.5,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.18s',
    },
    logoutBtn: {
      marginTop: 'auto',
      width: '100%',
      background: 'var(--bg-white)',
      border: '1px solid var(--border-light)',
      padding: 11,
      borderRadius: 10,
      color: 'var(--red)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontSize: 13.5,
      fontWeight: 700,
      textAlign: 'center',
    },
  };

  const pendingCount = projects.filter(p => p.status === 'under_review').length;

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarLogo}>AidFlow</div>
        <div style={styles.sidebarSubtitle}>Admin Panel</div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <p style={styles.subtitle}>
          {pendingCount > 0
            ? `${pendingCount} project${pendingCount > 1 ? 's' : ''} awaiting review`
            : 'All projects reviewed'}
        </p>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📋</div>
            <p>No projects to review.</p>
          </div>
        ) : (
          projects.map((project, index) => (
            <div
              key={project._id}
              style={{
                ...styles.card,
                animation: `slideUp 0.4s ease both`,
                animationDelay: `${index * 0.06}s`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={styles.cardTitle}>{project.title}</h3>
                <span style={styles.badge(project.status)}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <p style={styles.cardDesc}>{project.description}</p>
              <p style={styles.cardMeta}>NGO: {project.ngo?.name || '—'}</p>

              {project.status === "under_review" && (
                <div style={styles.btnGroup}>
                  <button style={styles.approveBtn} onClick={() => approveProject(project._id)}>
                    Approve
                  </button>
                  <button style={styles.rejectBtn} onClick={() => rejectProject(project._id)}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
