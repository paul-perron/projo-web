// src/pages/auth/LoginPage.tsx
import { Alert, Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();

  const from = useMemo(() => {
    const state = location.state as any;
    return state?.from ?? "/assignments";
  }, [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setPending(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setPending(false);

    if (error || !data.session) {
      setErr(error?.message ?? "Login failed.");
      return;
    }

    nav(from, { replace: true });
  }

  return (
    <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center", p: 2 }}>
      <Paper sx={{ width: "100%", maxWidth: 420, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          PROJO Login
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            fullWidth
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
          />

          <Button variant="contained" onClick={submit} disabled={pending || !email || !password}>
            {pending ? "Signing in…" : "Sign In"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}