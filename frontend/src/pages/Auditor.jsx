import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  UserCheck, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Shield, 
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function Auditor() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("authToken");
  const headers = { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}` 
  };

  useEffect(() => {
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      setUser(JSON.parse(authUser));
      fetchLogs();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/audit", { headers });
      const result = await res.json();
      setLogs(result.data || []);
    } catch (err) {
      console.error("Audit log fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- RENDERING HELPERS ---

  const IntroText = ({ title }) => (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-5xl">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </div>
  );

  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      {/* Box 1: User Activity Summary */}
      <div className="bg-[#e5e7eb] rounded-2xl min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-medium text-gray-600 mb-4">Summary Table for All User Activity Logs</p>
        <div className="w-full bg-white/50 rounded-xl overflow-hidden">
           <Table>
             <TableBody>
               {logs.filter(l => l.action.includes('LOGIN') || l.action === 'LOGOUT').slice(0, 5).map(log => (
                 <TableRow key={log.log_id} className="border-b border-gray-300">
                   <TableCell className="text-left py-4 px-6">{log.action}</TableCell>
                   <TableCell className="text-right py-4 px-6 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
        </div>
      </div>

      {/* Box 2: Audit Logs Summary */}
      <div className="bg-[#e5e7eb] rounded-2xl min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-medium text-gray-600 mb-4">Summary Table for All User Audit Logs</p>
        <div className="w-full bg-white/50 rounded-xl overflow-hidden">
           <Table>
             <TableBody>
               {logs.filter(l => l.affected_table).slice(0, 5).map(log => (
                 <TableRow key={log.log_id} className="border-b border-gray-300">
                   <TableCell className="text-left py-4 px-6">{log.action}</TableCell>
                   <TableCell className="text-right py-4 px-6 text-gray-500">{log.affected_table}</TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
        </div>
      </div>
    </div>
  );

  const renderUserActivity = () => (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#e5e7eb] rounded-2xl min-h-[600px] flex flex-col items-center p-12">
        <p className="text-xl font-medium text-gray-600 mb-12">Table for All User Activity Logs</p>
        <div className="w-full bg-white/50 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead className="px-6 py-4">User ID</TableHead>
                <TableHead className="px-6 py-4">Action</TableHead>
                <TableHead className="px-6 py-4">IP Address</TableHead>
                <TableHead className="px-6 py-4">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.filter(l => l.action.includes('LOGIN') || l.action === 'LOGOUT').map(log => (
                <TableRow key={log.log_id} className="border-b border-gray-300">
                  <TableCell className="px-6 py-4 font-medium">#{log.user_id}</TableCell>
                  <TableCell className="px-6 py-4 font-bold">{log.action}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-500">{log.ip_address || '0.0.0.0'}</TableCell>
                  <TableCell className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="animate-in slide-in-from-right-4 duration-500">
      <div className="bg-[#e5e7eb] rounded-2xl min-h-[600px] flex flex-col items-center p-12">
        <p className="text-xl font-medium text-gray-600 mb-12">Table for All User Audit Logs</p>
        <div className="w-full bg-white/50 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead className="px-6 py-4">Action</TableHead>
                <TableHead className="px-6 py-4">Table Affected</TableHead>
                <TableHead className="px-6 py-4">Details</TableHead>
                <TableHead className="px-6 py-4">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.filter(l => l.affected_table).map(log => (
                <TableRow key={log.log_id} className="border-b border-gray-300">
                  <TableCell className="px-6 py-4 font-bold">{log.action}</TableCell>
                  <TableCell className="px-6 py-4 uppercase text-primary font-medium">{log.affected_table}</TableCell>
                  <TableCell className="px-6 py-4 text-xs italic">{log.details}</TableCell>
                  <TableCell className="px-6 py-4">{new Date(log.timestamp).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <h1 className="font-bold text-sm tracking-tight">Unified Traffic System</h1>
        </div>

        {/* Auditor Profile (Andrew Smith) */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-black flex-shrink-0 flex items-center justify-center text-white font-bold">
              AS
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">System Auditor</p>
              <p className="text-sm font-bold truncate">Andrew Smith</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-4 uppercase tracking-widest">Main</p>
          <NavButton icon={<Home size={18}/>} label="Dashboard" active={activeMenu === "dashboard"} onClick={() => setActiveMenu("dashboard")} />
          <NavButton icon={<UserCheck size={18}/>} label="User Activity Logs" active={activeMenu === "user-activity"} onClick={() => setActiveMenu("user-activity")} />
          <NavButton icon={<History size={18}/>} label="Audit Logs" active={activeMenu === "audit-logs"} onClick={() => setActiveMenu("audit-logs")} />

          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-4 mt-8 uppercase tracking-widest">Settings</p>
          <div className="px-3 py-2 flex items-center justify-between text-muted-foreground hover:bg-muted rounded-md cursor-pointer text-sm">
            <span className="flex items-center gap-3"><Settings size={18}/> Settings</span>
            <ChevronDown size={14}/>
          </div>
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors">
            <HelpCircle size={18}/> Help
          </button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut size={18}/> Logout Account
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-12 overflow-auto bg-white">
        <div className="flex justify-between items-start mb-4">
           {/* Dynamic Headers matching wireframes */}
           {activeMenu === "dashboard" && <IntroText title="System Auditor's Dashboard" />}
           {activeMenu === "user-activity" && <IntroText title="User Activity Logs" />}
           {activeMenu === "audit-logs" && <IntroText title="Audit Logs" />}
           
           <Button variant="ghost" size="icon" onClick={fetchLogs} disabled={loading}>
             <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
           </Button>
        </div>

        {/* Tab Logic */}
        {activeMenu === "dashboard" && renderDashboard()}
        {activeMenu === "user-activity" && renderUserActivity()}
        {activeMenu === "audit-logs" && renderAuditLogs()}
      </main>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm transition-all ${
        active 
          ? "bg-white border shadow-sm font-bold text-black" 
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon} {label}
    </button>
  );
}

export default Auditor;