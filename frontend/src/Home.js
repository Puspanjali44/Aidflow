import React from "react";

function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      textAlign: 'center',
      padding: 40,
    }}>
      <div style={{
        fontSize: 56,
        marginBottom: 24,
        filter: 'none',
      }}>🎉</div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: -1,
        marginBottom: 12,
      }}>Welcome to AidFlow</h1>
      <p style={{
        fontSize: 15,
        color: 'var(--text-secondary)',
      }}>You are successfully logged in.</p>
    </div>
  );
}

export default Home;
