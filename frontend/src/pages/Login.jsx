import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e) {
    e?.preventDefault?.();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = await res.json();
      if (!res.ok || payload?.error) {
        throw new Error(payload?.error?.message || "Login failed");
      }
      // Save token for authenticated routes (used by logout)
      if (payload?.data?.token) {
        localStorage.setItem("authToken", payload.data.token);
      }
      // Save user for UI state
      if (payload?.data?.user) {
        localStorage.setItem("authUser", JSON.stringify(payload.data.user));
      }
      navigate("/test");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-background text-foreground transition-colors grid place-items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSignIn}>
            <div className="grid gap-2 text-left">
              <label htmlFor="username" className="text-sm text-muted-foreground">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="border border-border rounded-md px-3 py-2 bg-input text-foreground"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2 text-left">
              <label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="border border-border rounded-md px-3 py-2 bg-input text-foreground"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="text-red-600 text-sm min-h-5">{error}</div>
            <div className="sr-only" aria-live="polite">{loading ? "Signing in…" : ""}</div>
          </form>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button className="font-bold" variant="outline" onClick={() => navigate("/")}>Back to Landing</Button>
          <Button className="font-bold" onClick={handleSignIn} disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Login;
