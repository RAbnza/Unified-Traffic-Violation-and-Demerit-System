import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, Users, FileText, BarChart3, CheckCircle, Moon, Sun, ArrowRight } from "lucide-react";

function Landing() {
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("light");
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger animations after mount
    setIsVisible(true);
    
    fetch("http://localhost:3000/api/test")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    // Default to light mode if no saved preference
    const initial = stored || "light";
    setTheme(initial);
    // Save default if not already saved
    if (!stored) localStorage.setItem("theme", "light");
  }, []);

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

  // Navigate to the correct dashboard based on user role
  const handleDashboardClick = () => {
    if (isLoggedIn && authUser?.role_name) {
      const role = authUser.role_name.toLowerCase();
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
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-grade security protecting sensitive traffic violation data with end-to-end encryption."
    },
    {
      icon: AlertTriangle,
      title: "Real-Time Violations",
      description: "Instant recording and tracking of traffic violations across all enforcement agencies."
    },
    {
      icon: BarChart3,
      title: "Demerit Points System",
      description: "Automated point calculation and tracking to promote safer driving behaviors."
    },
    {
      icon: Users,
      title: "Multi-Agency Access",
      description: "Unified platform connecting traffic police, courts, and licensing authorities."
    },
    {
      icon: FileText,
      title: "Comprehensive Reports",
      description: "Detailed analytics and reporting for better traffic management decisions."
    },
    {
      icon: CheckCircle,
      title: "License Management",
      description: "Automated suspension and reinstatement workflows based on demerit points."
    }
  ];

  const stats = [
    { value: "50K+", label: "Violations Processed" },
    { value: "15", label: "Partner Agencies" },
    { value: "99.9%", label: "System Uptime" },
    { value: "24/7", label: "Support Available" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground transition-colors">
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                UTVDS
              </h1>
              <p className="text-xs text-muted-foreground">Traffic Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full transition-transform hover:scale-110 hover:rotate-12"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {isLoggedIn ? (
              <Button onClick={handleDashboardClick} className="font-semibold group">
                <span>Go to Dashboard</span>
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button onClick={() => navigate("/login")} className="font-semibold">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        {/* Subtle background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={`transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Available for LGUs Nationwide
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-foreground">
                Unified Traffic Violation & Demerit System
                <span className="block text-primary mt-2">for Local Government Units</span>
              </h1>
              
              <p className={`text-base lg:text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                A secure, centralized platform designed to modernize traffic enforcement, streamline record management, and enable data-driven decisions across LGUs.
              </p>
              
              <div className={`flex flex-wrap items-center gap-3 transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Button 
                  size="lg" 
                  onClick={handleDashboardClick} 
                  className="font-semibold group transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/contact")} 
                  className="font-semibold transition-all hover:scale-105"
                >
                  Contact Us
                </Button>
              </div>

              {message && (
                <div className="mt-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-muted-foreground">API Status:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{message}</span>
                </div>
              )}
            </div>
            
            {/* Right Visual */}
            <div className={`hidden lg:block transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="relative">
                {/* Main card mockup */}
                <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">UTVDS Dashboard</div>
                      <div className="text-xs text-muted-foreground">Traffic Management Portal</div>
                    </div>
                  </div>
                  
                  {/* Mock stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Active Tickets", value: "234" },
                      { label: "This Month", value: "1,847" },
                      { label: "Resolved", value: "89%" }
                    ].map((item, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">{item.value}</div>
                        <div className="text-[10px] text-muted-foreground">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Mock chart area */}
                  <div className="bg-muted/30 rounded-lg p-4 h-32 flex items-end justify-between gap-1">
                    {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 90].map((h, i) => (
                      <div 
                        key={i} 
                        className="bg-primary/60 rounded-t w-full transition-all hover:bg-primary"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                  Live System
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div 
                key={idx} 
                className="text-center group cursor-default py-4"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1 transition-transform group-hover:scale-110">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Powerful Features for Modern Traffic Management
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage traffic violations, track demerit points, and maintain road safety.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="group relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-primary group-hover:scale-105">
                      <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 relative overflow-hidden bg-primary/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Modernize Your Traffic Management?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join leading LGUs in creating safer roads through efficient, data-driven traffic enforcement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button 
              size="lg" 
              onClick={handleDashboardClick} 
              className="font-semibold group transition-all hover:scale-105"
            >
              {isLoggedIn ? "Go to Dashboard" : "Access Portal"}
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/contact")} 
              className="font-semibold transition-all hover:scale-105"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">UTVDS</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                A comprehensive platform for managing traffic violations, demerit points, and driver licensing across LGUs.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 border-t border-border text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Unified Traffic Violation & Demerit System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;