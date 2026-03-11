import React from "react";

function Settings() {
  return (
    <div style={{
      padding: '44px 48px',
      background: 'var(--bg-base)',
      minHeight: '100vh',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 30,
        fontWeight: 800,
        color: 'var(--text-primary)',
        letterSpacing: -0.8,
      }}>Settings</h1>
    </div>
  );
}

export default Settings;
