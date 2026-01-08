import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Landing() {
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("light");
  const navigate = useNavigate();

  // Fetch sample backend message
  useEffect(() => {
    fetch("http://localhost:3000/api/test")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const systemDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ? stored : systemDark ? "dark" : "light";
    setTheme(initial);
  }, []);

  // Apply theme class and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const isLoggedIn = useMemo(() => Boolean(localStorage.getItem("authToken")), []);
  const authUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "null");
    } catch {
      return null;
    }
  }, []);
  const goToLogin = () => navigate("/login");
  const goToTest = () => navigate("/test");

  return (
    <div className="min-h-screen p-6 bg-background text-foreground transition-colors">
      <header className="">
        <Card>
          <CardHeader>
            <CardTitle>Unified Traffic Violation & Demerit System</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction className="flex gap-2">
              <Button className="font-bold" variant="outline" onClick={toggleTheme}>
                Switch Theme
              </Button>
              {isLoggedIn ? (
                <Button className="font-bold" onClick={goToTest}>
                  {authUser?.username ? `Welcome, ${authUser.username}` : "Go to Test Page"}
                </Button>
              ) : (
                <Button className="font-bold" onClick={goToLogin}>
                  Go to Login
                </Button>
              )}
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>Card Content</p>
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card>
      </header>

      <main>
        <div className="mt-6 rounded-lg border border-border bg-card text-card-foreground p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Backend says:</p>
          <p className="mt-1">{message || "Loading..."}</p>
        </div>
      </main>
    </div>
  );
}

export default Landing;
