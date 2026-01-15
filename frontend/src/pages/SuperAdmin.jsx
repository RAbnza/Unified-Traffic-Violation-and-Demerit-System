import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, FileText, DollarSign, AlertTriangle, Settings, 
  LogOut, Database, Shield, Activity, RefreshCw, Download, Server
} from "lucide-react";

function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); // Tab state: dashboard, users, database
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({ users: 0, tickets: 0, revenue: 0, violations: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authUser = localStorage.getItem("authUser");
    if (!authUser) return navigate("/login");
    setUser(JSON.parse(authUser));
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [uRes, aRes, tRes] = await Promise.all([
        fetch("http://localhost:3000/api/users", { headers }),
        fetch("http://localhost:3000/api/audit", { headers }),
        fetch("http://localhost:3000/api/reports/ticket-status", { headers })
      ]);

      const userData = await uRes.json();
      const auditData = await aRes.json();
      const ticketData = await tRes.json();

      setUsersList(userData.data || []);
      setAuditLogs(auditData.data || []);
      
      const totalTickets = ticketData.data?.reduce((acc, curr) => acc + curr.count, 0) || 0;
      setStats({
        users: userData.meta?.total || 0,
        tickets: totalTickets,
        revenue: "₱245,000",
        violations: 124
      });
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    const token = localStorage.getItem("authToken");
    await fetch("http://localhost:3000/api/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "Manual backup from Navbar" })
    });
    alert("Backup successfully initiated!");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- RENDER FUNCTIONS FOR TABS ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users} icon={Users} color="text-blue-500" />
        <StatCard label="Active Tickets" value={stats.tickets} icon={FileText} color="text-orange-500" />
        <StatCard label="Revenue" value={stats.revenue} icon={DollarSign} color="text-green-500" />
        <StatCard label="Violations" value={stats.violations} icon={AlertTriangle} color="text-red-500" />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Access Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditLogs.slice(0, 6).map(log => (
              <div key={log.log_id} className="text-sm p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-bold text-primary mr-2">[{log.action}]</span>
                  <span className="text-muted-foreground">Modified {log.affected_table || "System"}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <Card className="animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all system accounts.</CardDescription>
        </div>
        <Button size="sm"><RefreshCw className="w-4 h-4 mr-2"/> Sync</Button>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-muted-foreground">
            <th className="pb-3">Username</th>
            <th className="pb-3">Email</th>
            <th className="pb-3">Role</th>
            <th className="pb-3">Status</th>
          </tr></thead>
          <tbody>
            {usersList.map(u => (
              <tr key={u.user_id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 font-medium">{u.username}</td>
                <td className="py-4">{u.email || "N/A"}</td>
                <td className="py-4"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Role {u.role_id}</span></td>
                <td className="py-4"><span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>Active</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  const renderDatabase = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>System Maintenance</CardTitle>
          <CardDescription>Perform database backups and restorations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleBackup} className="w-full justify-start gap-2" variant="outline">
            <Download size={18} className="text-blue-500"/> Generate Full SQL Backup
          </Button>
          <Button className="w-full justify-start gap-2" variant="outline">
            <RefreshCw size={18} className="text-orange-500"/> Rebuild Search Indexes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Server Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b pb-2"><span>DB Engine</span><span className="font-mono">MySQL 8.0</span></div>
          <div className="flex justify-between border-b pb-2"><span>Connection</span><span className="text-green-500">Stable</span></div>
          <div className="flex justify-between"><span>Uptime</span><span>99.9%</span></div>
          <Button className="w-full" variant="secondary"><Server size={18} className="mr-2"/> View Detailed Stats</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - NAVBAR FUNCTIONS */}
      <aside className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Shield className="text-primary" />
          <span className="font-bold tracking-tight">UTVDS ADMIN</span>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <p className="text-[10px] font-bold text-muted-foreground px-2 mb-2 uppercase">Core Menu</p>
          <Button 
            variant={activeTab === "dashboard" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab("dashboard")}
          >
            <Activity className="w-4 h-4"/> Dashboard
          </Button>
          
          <Button 
            variant={activeTab === "users" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab("users")}
          >
            <Users className="w-4 h-4"/> User Management
          </Button>
          
          <Button 
            variant={activeTab === "database" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab("database")}
          >
            <Database className="w-4 h-4"/> Database Tools
          </Button>
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="px-2 py-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.username}</p>
              <p className="text-[10px] text-muted-foreground uppercase">System Admin</p>
            </div>
          </div>
          <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2"/> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold capitalize">{activeTab} Overview</h1>
            <p className="text-muted-foreground">Manage your centralized traffic violation system.</p>
          </div>
          <Button onClick={fetchDashboardData} disabled={loading} size="icon" variant="ghost">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </header>

        {/* Dynamic Content Rendering */}
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "database" && renderDatabase()}
      </main>
    </div>
  );
}

const StatCard = ({ label, value, icon: Icon, color }) => (
  <Card><CardContent className="p-6 flex justify-between items-center">
    <div><p className="text-xs text-muted-foreground font-medium">{label}</p><p className="text-2xl font-bold tracking-tight">{value}</p></div>
    <div className={`${color} bg-muted p-2 rounded-lg`}><Icon className="w-6 h-6"/></div>
  </CardContent></Card>
);

export default SuperAdmin;