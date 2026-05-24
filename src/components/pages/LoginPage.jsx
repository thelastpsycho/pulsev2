import { useState } from 'react'
// ============================================================================
// Login page
// ============================================================================

const safeWindow = () => ({
  UI: typeof window !== 'undefined' && window.PulseUI || { Icon: () => null, Button: () => null, TOKENS: {} },
  Form: typeof window !== 'undefined' && window.PulseForm || { Field: () => null, Input: () => null, Checkbox: () => null }
});

const w = safeWindow();
const IconLog = w.UI.Icon; const ButtonLog = w.UI.Button; const TLog = w.UI.TOKENS;
const FieldLog = w.Form.Field; const InputLog = w.Form.Input; const CbxLog = w.Form.Checkbox;

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true); setError(null);
    try {
      const r = await window.PulseAPI.Auth.login({ email, password });
      onLogin(r);
    } catch (err) {
      setError(err.errors?.email?.[0] || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      display: "grid", placeItems: "center",
      background: "linear-gradient(180deg, #fbfbfd 0%, #f2f2f5 100%)",
      padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(180deg, #1d1d1f 0%, #2c2c2e 100%)",
            display: "grid", placeItems: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
            marginBottom: 18,
          }}>
            <IconLog name="pulse" size={34} color="#fff" strokeWidth={2.2}/>
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: TLog.text }}>GuestPulse</div>
          <div style={{ fontSize: 14, color: TLog.muted, marginTop: 4 }}>Hotel operations &amp; complaint management</div>
        </div>

        <form onSubmit={submit}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "22px 22px 16px",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06)",
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 18 }}>Welcome back</div>

            <FieldLog label="Email">
              <InputLog value={email} onChange={setEmail} icon="mail" placeholder="you@anvayabali.com" autoFocus/>
            </FieldLog>
            <FieldLog label="Password" error={error} style={{ marginBottom: 8 }}>
              <InputLog value={password} onChange={setPassword}
                icon="key" type={showPw ? "text" : "password"} placeholder="••••••••"
                suffix={
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: TLog.mutedLight }}>
                    <IconLog name={showPw ? "eye-off" : "eye"} size={15}/>
                  </button>
                }
                onKeyDown={(e) => e.key === "Enter" && submit(e)}
              />
            </FieldLog>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <CbxLog checked label="Stay signed in" onChange={() => {}}/>
              <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 13, color: TLog.accent, textDecoration: "none", fontWeight: 500 }}>Forgot?</a>
            </div>
          </div>

          <ButtonLog type="submit" size="lg" fullWidth loading={loading} onClick={submit}>
            Sign in
          </ButtonLog>
        </form>

        <div style={{ textAlign: "center", marginTop: 22, fontSize: 12, color: TLog.mutedLight, lineHeight: 1.5 }}>
          Duty Manager portal · v4.0.0 · Need access? Contact your General Manager.
        </div>
      </div>
    </div>
  );
}

window.PageLogin = LoginPage;
