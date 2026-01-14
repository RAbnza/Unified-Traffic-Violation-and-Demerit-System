import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function TestPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogout() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || payload?.error) {
        throw new Error(payload?.error?.message || "Logout failed");
      }
      localStorage.removeItem("authToken");
      setMessage("Logged out successfully.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Login Successful</h1>
        <p className="text-muted-foreground mb-6">This is a temporary page for testing.</p>
        <div className="text-red-600 text-sm min-h-5">{error}</div>
        <div className="text-green-600 text-sm min-h-5">{message}</div>
        <div className="mt-4">
          <Button className="font-bold" variant="outline" onClick={() => navigate("/")}>Back to Landing</Button>
          <Button className="font-bold ml-2" onClick={handleLogout} disabled={loading}>
            {loading ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TestPage;
