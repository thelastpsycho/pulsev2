// ============================================================================
// Login page
// All styling via Tailwind classes.
// ============================================================================

import React from 'react';

const { useState } = React;

const safeWindow = () => ({
  UI: typeof window !== 'undefined' && window.PulseUI || { Icon: () => null, Button: () => null, TOKENS: {}, cx: (...xs) => xs.filter(Boolean).join(" ") },
  Form: typeof window !== 'undefined' && window.PulseForm || { Field: () => null, Input: () => null, Checkbox: () => null }
});

const w = safeWindow();
const IconLog = w.UI.Icon; const ButtonLog = w.UI.Button;
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
    <div className="min-h-screen w-full grid place-items-center p-6 bg-linear-to-b from-[#fbfbfd] to-[#f2f2f5]">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-[18px] grid place-items-center mb-4.5 bg-linear-to-b from-text to-[#2c2c2e] shadow-[0_10px_30px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <IconLog name="pulse" size={34} color="#fff" strokeWidth={2.2}/>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-text">GuestPulse</div>
          <div className="text-sm text-muted mt-1">Hotel operations &amp; complaint management</div>
        </div>

        <form onSubmit={submit}>
          <div className="bg-white rounded-2xl px-[22px] pt-[22px] pb-4 border border-black/6 mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)]">
            <div className="text-lg font-semibold tracking-tight mb-[18px]">Welcome back</div>

            <FieldLog label="Email">
              <InputLog value={email} onChange={setEmail} icon="mail" placeholder="you@anvayabali.com" autoFocus/>
            </FieldLog>
            <FieldLog label="Password" error={error} className="mb-2">
              <InputLog value={password} onChange={setPassword}
                icon="key" type={showPw ? "text" : "password"} placeholder="••••••••"
                suffix={
                  <button type="button" onClick={() => setShowPw(s => !s)} className="bg-none border-none p-1 cursor-pointer text-muted-light">
                    <IconLog name={showPw ? "eye-off" : "eye"} size={15}/>
                  </button>
                }
                onKeyDown={(e) => e.key === "Enter" && submit(e)}
              />
            </FieldLog>

            <div className="flex items-center justify-between mt-2">
              <CbxLog checked label="Stay signed in" onChange={() => {}}/>
              <a href="#" onClick={e => e.preventDefault()} className="text-[13px] text-accent no-underline font-medium">Forgot?</a>
            </div>
          </div>

          <ButtonLog type="submit" size="lg" fullWidth loading={loading} onClick={submit}>
            Sign in
          </ButtonLog>
        </form>

        <div className="text-center mt-5.5 text-xs text-muted-light leading-relaxed">
          Duty Manager portal · v4.0.0 · Need access? Contact your General Manager.
        </div>
      </div>
    </div>
  );
}

window.PageLogin = LoginPage;
