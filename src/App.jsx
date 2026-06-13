import React, { useState, useEffect } from "react";

export default function App() {

  // ===== STATES =====
  const [user, setUser] = useState(null);
  const [samples, setSamples] = useState([]);
  const [lotNumber, setLotNumber] = useState("");
  const [lotInput, setLotInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  // ===== LOAD =====
  useEffect(() => {
    const saved = localStorage.getItem("data");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSamples(parsed.samples || []);
      setLotNumber(parsed.lot || "");
    }
  }, []);

  // ===== SAVE =====
  useEffect(() => {
    localStorage.setItem("data", JSON.stringify({
      samples,
      lot: lotNumber
    }));
  }, [samples, lotNumber]);

  // ===== LOT INCREMENT =====
  const incrementLot = (lot) => {
    const match = lot.match(/(.*?)(\d+)$/);
    if (!match) return lot;

    const prefix = match[1];
    const number = match[2];
    return prefix + String(parseInt(number) + 1).padStart(number.length, "0");
  };

  // ===== PRODUCTION =====
  const takeSample = (type) => {
    if (!lotNumber) {
      alert("❌ QAQC must set the first lot!");
      return;
    }

    let sampleLot = "-";

    if (type === "NORMAL") {
      sampleLot = lotNumber;
      setLotNumber(prev => incrementLot(prev));
    }

    const newSample = {
      id: Date.now(),
      time: new Date().toLocaleString(),
      takenBy: user.name,
      type,
      lot: sampleLot,
      status: "READY"
    };

    setSamples(prev => [newSample, ...prev]);
  };

  // ===== QAQC =====
  const setLot = () => {
    if (!lotInput.trim()) {
      alert("Enter valid lot");
      return;
    }
    setLotNumber(lotInput.trim());
    setLotInput("");
  };

  const verifySample = (id) => {
    setSamples(prev =>
      prev.map(s => s.id === id ? { ...s, status: "VERIFIED" } : s)
    );
  };

  const failSample = (id) => {
    setSamples(prev =>
      prev.map(s => s.id === id ? { ...s, status: "FAILED" } : s)
    );
  };

  // ===== ADMIN =====
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const refreshApp = () => {
    window.location.reload();
  };

  const resetSystem = () => {
    if (window.confirm("Reset all data?")) {
      localStorage.clear();
      setSamples([]);
      setLotNumber("");
    }
  };

  // ===== LOGIC =====
  const lotNotSet = !lotNumber;
  const hasFailed = samples.some(s => s.status === "FAILED");

  const total = samples.length;
  const pending = samples.filter(s => s.status === "READY").length;
  const verified = samples.filter(s => s.status === "VERIFIED").length;
  const failed = samples.filter(s => s.status === "FAILED").length;

  // ===== LOGIN =====
  if (!user) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Login</h2>

        <input
          placeholder="Enter name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />

        <br /><br />

        <button onClick={() => {
          if (!nameInput) return;
          setUser({ name: nameInput, role: "Production" });
        }}>
          Production
        </button>

        <button onClick={() => {
          if (!nameInput) return;
          setUser({ name: nameInput, role: "QAQC" });
        }}>
          QAQC
        </button>
      </div>
    );
  }

  // ===== MAIN UI =====
  return (
    <div style={{ padding: 20 }}>

      <h1>QAQC Tracking System</h1>
      <p>{user.name} ({user.role})</p>

      {/* ADMIN */}
      {user.name === "ADMIN" && (
        <div>
          <button onClick={logout}>🔓 Logout</button>
          <button onClick={refreshApp} style={{ marginLeft: 10 }}>
            🔄 Refresh
          </button>
          <button onClick={resetSystem} style={{ marginLeft: 10 }}>
            ⚠️ Reset
          </button>
        </div>
      )}

      <hr />

      {/* DASHBOARD */}
      <h3>📊 Dashboard</h3>
      <p>
        Total: {total} | Pending: {pending} | Verified: {verified} | Failed: {failed}
      </p>

      <hr />

      <h3>Current Lot: {lotNumber || "NOT SET"}</h3>

      <hr />

      {/* PRODUCTION */}
      {user.role === "Production" && (
        <div>

          <h2>Production Panel</h2>

          {lotNotSet && (
            <p style={{ color: "red" }}>⚠️ QAQC HAS NOT SET LOT</p>
          )}

          {hasFailed && (
            <p style={{ color: "orange" }}>⚠️ RETAKE SAMPLE REQUIRED</p>
          )}

          <button onClick={() => takeSample("NORMAL")}>
            ✅ Normal Sample
          </button>

          <button onClick={() => takeSample("OTHER")}>
            ⚠️ Other Sample
          </button>

        </div>
      )}

      {/* QAQC */}
      {user.role === "QAQC" && (
        <div>

          <h2>QAQC Panel</h2>

          <input
            placeholder="Enter lot"
            value={lotInput}
            onChange={(e) => setLotInput(e.target.value)}
          />

          <br /><br />

          <button onClick={setLot}>✅ Set Lot</button>

          <h3>🔔 Notifications</h3>

          {samples.filter(s => s.status === "READY").map(s => (
            <p key={s.id}>⚠️ {s.takenBy} → {s.lot}</p>
          ))}

        </div>
      )}

      <hr />

      {/* SAMPLE LIST */}
      <h2>All Samples</h2>

      {samples.map(s => (
        <div key={s.id} style={{ border: "1px solid black", margin: 10, padding: 10 }}>
          <p>{s.time}</p>
          <p>Lot: {s.lot}</p>
          <p>Status: {s.status}</p>

          {user.role === "QAQC" && s.status === "READY" && (
            <>
              <button onClick={() => verifySample(s.id)}>✅ Verify</button>
              <button onClick={() => failSample(s.id)} style={{ marginLeft: 5 }}>
                ❌ Fail
              </button>
            </>
          )}
        </div>
      ))}

    </div>
  );
}