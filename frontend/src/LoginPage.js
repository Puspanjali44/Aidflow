import React, { useState } from "react";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.png";

function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("donor");

  const [name, setName] = useState("");
  const [ngoName, setNgoName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        if (data.role === "donor") navigate("/donor-dashboard");
        else navigate("/ngo-dashboard");
      } else {
        alert(data.message);
      }
    } catch {
      alert("Server error");
    }
  };

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: role === "donor" ? name : ngoName,
          email,
          password,
          registrationNumber: regNumber,
          role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful! Please login.");
        setMode("login");
      } else {
        alert(data.message);
      }
    } catch {
      alert("Server error");
    }
  };

  return (
    <div className="login-wrapper">
      {/* LEFT */}
      <div className="left-section">
  <img src={logo} alt="AidFlow Logo" className="logo" />
  <h1>AidFlow</h1>
  <p>Transparent. Secure. Impactful.</p>
  <p>Connecting Donors & NGOs</p>
</div>

      {/* RIGHT */}
      <div className="right-section">
        <div className="login-card">
          <h2>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>

          {/* ROLE SELECT (Only on Register) */}
          {mode === "register" && (
            <div className="role-toggle">
              <button
                className={role === "donor" ? "active" : ""}
                onClick={() => setRole("donor")}
              >
                Donor
              </button>
              <button
                className={role === "ngo" ? "active" : ""}
                onClick={() => setRole("ngo")}
              >
                NGO
              </button>
            </div>
          )}

          {/* NGO Fields */}
          {mode === "register" && role === "ngo" && (
            <>
              <input
                type="text"
                placeholder="NGO Name"
                value={ngoName}
                onChange={(e) => setNgoName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Registration Number"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
              />
            </>
          )}

          {/* Donor Field */}
          {mode === "register" && role === "donor" && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* MAIN BUTTON */}
          <button
            className="primary-btn"
            onClick={mode === "login" ? handleLogin : handleRegister}
          >
            {mode === "login" ? "Login" : "Register"}
          </button>

          {/* SMALL SWITCH BUTTON */}
          <div className="extra-links">
            {mode === "login" ? (
              <>
                <span>Don’t have an account?</span>
                <button
                  className="secondary-btn"
                  onClick={() => setMode("register")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button
                  className="secondary-btn"
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;