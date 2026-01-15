import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";


function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("authUser");
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        const role = userData.role_name?.toLowerCase();
        if (role === "super admin") {
          navigate("/superadmin");
        } else if (role === "officer") {
          navigate("/officer");
        } else if (role === "auditor") {
          navigate("/auditor");
        } else if (role === "lgu admin") {
          navigate("/lgu-admin");
        } else if (role === "lgu staff") {
          navigate("/lgu-staff");
        }
      } catch (e) {
        // Invalid user data, continue to login
      }
    }
    // Trigger animation
    setIsVisible(true);
  }, [navigate]);

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
        throw new Error(payload?.error?.message || "Invalid credentials");
      }
      
      // Store token and user data
      if (payload?.data?.token) {
        localStorage.setItem("authToken", payload.data.token);
      }
      
      if (payload?.data?.user) {
        localStorage.setItem("authUser", JSON.stringify(payload.data.user));
        
        // Navigate based on user role
        const role = payload.data.user.role_name?.toLowerCase();
        if (role === "super admin") {
          navigate("/superadmin");
        } else if (role === "officer") {
          navigate("/officer");
        } else if (role === "auditor") {
          navigate("/auditor");
        } else if (role === "lgu admin") {
          navigate("/lgu-admin");
        } else if (role === "lgu staff") {
          navigate("/lgu-staff");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Background */}
      <div className={`hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200')] bg-cover bg-center opacity-20" />
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className={`relative z-10 flex flex-col justify-center items-start p-16 transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">UTVDS</h2>
              <p className="text-white/70 text-sm">Traffic Management</p>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 text-white leading-tight">
            Unified Traffic <br />Violation System
          </h1>
          <p className="text-xl text-white/80 max-w-md leading-relaxed">
            Streamlining traffic enforcement and improving road safety across Local Government Units.
          </p>
          <div className="mt-12 flex gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-white/60 text-sm">Violations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">15</div>
              <div className="text-white/60 text-sm">Agencies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-white/60 text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className={`w-full max-w-md transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Header */}
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Button>
            <h2 className="text-3xl font-bold mb-2 text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          {/* Login Form Card */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <form className="space-y-5" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground font-medium">
                    Username or Email
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    className="h-12 bg-background text-foreground border-border focus:border-primary"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="h-12 pr-12 bg-background text-foreground border-border focus:border-primary"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked)}
                    />
                    <Label htmlFor="rememberMe" className="text-muted-foreground cursor-pointer font-normal">
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => toast.info("Forgot password feature coming soon!")}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Admin */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground text-sm mb-2">Need help accessing your account?</p>
            <button
              onClick={() => navigate("/contact")}
              className="text-primary hover:underline text-sm font-medium"
            >
              Contact Administrator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;