import { FormEvent, useState } from "react";
import { supabase } from "./lib/supabase";

type Mode = "sign-in" | "sign-up";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else if (!data.session) setMessage("Account created. Check your email to confirm your account.");
      else setMessage("Account created. Welcome to Beacon.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    }
    setLoading(false);
  }

  return (
    <main className="app-shell">
      <section className="auth-card">
        <p className="eyebrow">Beacon 2.0</p>
        <h1>{mode === "sign-in" ? "Welcome back." : "Create your Beacon account."}</h1>
        <p className="muted">Your account will own your goals, journal, conversations, and memories.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={6} required /></label>
          <button type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}</button>
        </form>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button type="button" className="secondary-button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>
          {mode === "sign-in" ? "Create a new account" : "I already have an account"}
        </button>
      </section>
    </main>
  );
}
