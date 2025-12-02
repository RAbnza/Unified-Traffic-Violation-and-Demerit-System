import { useEffect, useState } from "react";
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

function App() {
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("light");

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

  return (
    <div className="min-h-screen p-6 bg-background text-foreground transition-colors">
      <header className="">
        <Card>
          <CardHeader>
            <CardTitle>Unified Traffic Violation & Demerit System</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>
              <Button
                className="font-bold"
                variant="outline"
                onClick={toggleTheme}
              >
                Switch Theme
              </Button>
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

export default App;
