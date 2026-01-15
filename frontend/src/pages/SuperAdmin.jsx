import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, FileText, Settings, LogOut, Database, Shield, Activity, 
  RefreshCw, HardDrive, History, HelpCircle, ChevronDown, Save, Edit, Plus, Trash2, CheckCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- FUNCTIONAL STATES ---
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [backupHistory, setBackupHistory] = useState([]);
  const [dbStatus, setDbStatus] = useState({ version: "Loading...", size_bytes: 0 });
  const [threshold, setThreshold] = useState(0);
  const [isEditingUser, setIsEditingUser] = useState(null); // Stores user object for popup

  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    const authUser = localStorage.getItem("authUser");
    if (!authUser) return navigate("/login");
    setUser(JSON.parse(authUser));
    fetchAllData();
  }, [navigate]);

  // --- API FUNCTIONS ---

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uRes, aRes, bRes, sRes, cRes] = await Promise.all([
        fetch("http://localhost:3000/api/users", { headers }),
        fetch("http://localhost:3000/api/audit", { headers }),
        fetch("http://localhost:3000/api/backup/history", { headers }),
        fetch("http://localhost:3000/api/system/db/status", { headers }),
        fetch("http://localhost:3000/api/system/config/demerit_threshold", { headers })
      ]);

      const uData = await uRes.json();
      const aData = await aRes.json();
      const bData = await bRes.json();
      const sData = await sRes.json();
      const cData = await cRes.json();

      setUsersList(uData.data || []);
      setAuditLogs(aData.data || []);
      setBackupHistory(bData.data || []);
      setDbStatus(sData.data || { version: "Unknown", size_bytes: 0 });
      if (cData.data) setThreshold(parseInt(cData.data.value));

    } catch (err) { console.error("Data Fetch Error:", err); }
    finally { setLoading(false); }
  };

  const handleCreateUser = async () => {
    const username = prompt("Enter Username:");
    if (!username) return;
    const password = "password123"; // Default for demo
    
    try {
      const res = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers,
        body: JSON.stringify({ username, password, role_id: 2 }) // Default to Officer
      });
      if (res.ok) { alert("User Created!"); fetchAllData(); }
    } catch (err) { alert("Error creating user"); }
  };

  const handleTriggerBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/backup", {
        method: "POST",
        headers,
        body: JSON.stringify({ status: "SUCCESS", notes: "Manual backup from Dashboard" })
      });
      if (res.ok) { alert("Database Backup Successful!"); fetchAllData(); }
    } catch (err) { alert("Backup failed"); }
    finally { setLoading(false); }
  };

  const saveThreshold = async () => {
    try {
      await fetch("http://localhost:3000/api/system/config/demerit_threshold", {
        method: "PUT",
        headers,
        body: JSON.stringify({ value: threshold, description: "Demerit points limit" })
      });
      alert("Configuration Saved!");
    } catch (err) { alert("Save failed"); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- RENDER HELPERS ---

  const IntroHeader = ({ title }) => (
    <div className="mb-10 animate-in fade-in slide-in-from-top-2">
      <h1 className="text-3xl font-bold border-b-4 border-black pb-2 inline-block">{title}</h1>
      <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-5xl">
        Access control and system parameters are restricted to the DBA role. 
        Monitor system integrity and manage the database environment below.
      </p>
    </div>
  );

  // --- TAB VIEWS ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* DB Status Box */}
      <div className="bg-[#e5e7eb] rounded-2xl p-8 flex flex-col gap-4">
        <p className="text-sm font-bold uppercase text-gray-500">Database Status</p>
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-xs text-muted-foreground">Engine Version</p>
                <p className="text-lg font-bold">{dbStatus.version}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-xs text-muted-foreground">Storage Usage</p>
                <p className="text-lg font-bold">{(dbStatus.size_bytes / 1024).toFixed(2)} KB</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-xs text-muted-foreground">Connection</p>
                <p className="text-lg font-bold text-green-600 flex items-center gap-1"><CheckCircle size={18}/> Online</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-[#e5e7eb] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-gray-600 mb-4">Quick User Action</p>
          <Button onClick={() => setActiveTab("users")} className="bg-black text-white px-8">Manage {usersList.length} Users</Button>
        </div>
        <div className="bg-[#e5e7eb] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-gray-600 mb-4">System Parameter</p>
          <Button onClick={() => setActiveTab("config")} variant="outline" className="border-black">Threshold: {threshold} Pts</Button>
        </div>
      </div>

      <div className="bg-[#e5e7eb] rounded-2xl p-8">
        <p className="text-lg font-bold text-gray-700 mb-4">Recent System Access Logs</p>
        <Table className="bg-white/50 rounded-xl">
            <TableBody>
                {auditLogs.slice(0, 5).map(log => (
                    <TableRow key={log.log_id}>
                        <TableCell className="font-bold">{log.action}</TableCell>
                        <TableCell className="text-muted-foreground">{log.ip_address}</TableCell>
                        <TableCell className="text-right">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Button onClick={handleCreateUser} className="rounded-full px-10 py-6 bg-[#d1d5db] text-black hover:bg-gray-400 font-bold text-lg">
        <Plus className="mr-2"/> Create User
      </Button>
      
      <div className="bg-[#e5e7eb] rounded-2xl p-8 min-h-[500px]">
        <Table className="bg-white/50 rounded-xl overflow-hidden">
            <TableHeader className="bg-gray-200">
                <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role ID</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {usersList.map(u => (
                    <TableRow key={u.user_id}>
                        <TableCell className="font-bold">{u.username}</TableCell>
                        <TableCell>{u.email || "---"}</TableCell>
                        <TableCell><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Role {u.role_id}</span></TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingUser(u)}><Edit size={16}/></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>

      {/* Pop-up Modal (Simulation) */}
      {isEditingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[400px] p-6 animate-in zoom-in-95">
                <CardHeader>
                    <CardTitle>Edit User: {isEditingUser.username}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Modify the role or deactivate this account below.</p>
                    <Button onClick={() => setIsEditingUser(null)} className="w-full">Close Pop-up</Button>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );

  const renderDatabaseManagement = () => (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-[#e5e7eb] rounded-2xl p-8 flex flex-col items-center">
            <p className="font-bold text-lg mb-4">Backup Database</p>
            <Button onClick={handleTriggerBackup} disabled={loading} className="bg-white text-black border border-gray-300 hover:bg-gray-100">
                {loading ? "Backing up..." : "Execute Backup Now"}
            </Button>
        </div>
        <div className="bg-[#e5e7eb] rounded-2xl p-8 flex flex-col items-center opacity-50">
            <p className="font-bold text-lg mb-4">Restore Database</p>
            <Button disabled className="bg-white text-black border border-gray-300">Restoration Locked</Button>
        </div>
      </div>
      <div className="bg-[#e5e7eb] rounded-2xl p-8">
        <p className="text-xl font-bold text-gray-700 mb-4">Database Backup History</p>
        <Table className="bg-white/50 rounded-xl">
            <TableHeader>
                <TableRow><TableHead>Action</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow>
            </TableHeader>
            <TableBody>
                {backupHistory.map(b => (
                    <TableRow key={b.backup_id}>
                        <TableCell className="font-bold">{b.action}</TableCell>
                        <TableCell><span className="text-green-600 font-bold">{b.status}</span></TableCell>
                        <TableCell>{new Date(b.started_at).toLocaleString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderSystemConfig = () => (
    <div className="flex flex-col items-center justify-center min-h-[600px] animate-in zoom-in-95">
        <h2 className="text-2xl font-bold mb-8">Demerit Points Threshold:</h2>
        <div className="bg-[#e5e7eb] w-[400px] h-[100px] rounded-2xl flex items-center justify-center mb-10">
            <input 
                type="number" 
                className="bg-transparent text-4xl font-bold text-center w-full focus:outline-none"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
            />
        </div>
        <div className="flex gap-8">
            <Button onClick={() => setThreshold(0)} variant="outline" className="px-12 py-6 rounded-lg font-bold">
                Reset
            </Button>
            <Button onClick={saveThreshold} className="bg-black text-white px-12 py-6 rounded-lg font-bold">
                Save Threshold
            </Button>
        </div>
    </div>
  );

  // --- MAIN LAYOUT ---

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-72 bg-card border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b font-bold text-sm tracking-tight text-primary">Unified Traffic System</div>
        
        <div className="p-6 border-b flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold">AS</div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Super Admin</p>
            <p className="text-sm font-bold truncate">Andrew Smith</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-4 uppercase">System Menu</p>
          <NavBtn icon={<Activity size={18}/>} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <NavBtn icon={<Users size={18}/>} label="User Management" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
          <NavBtn icon={<Database size={18}/>} label="Database Management" active={activeTab === "database"} onClick={() => setActiveTab("database")} />
          <NavBtn icon={<Settings size={18}/>} label="System Configuration" active={activeTab === "config"} onClick={() => setActiveTab("config")} />
          <NavBtn icon={<FileText size={18}/>} label="Access Logs" active={activeTab === "logs"} onClick={() => setActiveTab("logs")} />
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}><LogOut size={18}/> Logout Account</Button>
        </div>
      </aside>

      <main className="flex-1 p-12 overflow-auto bg-white">
        <div className="flex justify-between items-start">
            {activeTab === "dashboard" && <IntroHeader title="Super Admin's Dashboard" />}
            {activeTab === "users" && <IntroHeader title="User Management" />}
            {activeTab === "database" && <IntroHeader title="Database Management" />}
            {activeTab === "config" && <IntroHeader title="System Configuration" />}
            {activeTab === "logs" && <IntroHeader title="Access Logs" />}

            <Button variant="ghost" size="icon" onClick={fetchAllData} disabled={loading}>
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </Button>
        </div>

        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "users" && renderUserManagement()}
        {activeTab === "database" && renderDatabaseManagement()}
        {activeTab === "config" && renderSystemConfig()}
        {activeTab === "logs" && (
            <div className="bg-[#e5e7eb] rounded-2xl p-8 min-h-[600px]">
                <Table className="bg-white/50 rounded-xl">
                    <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Details</TableHead><TableHead className="text-right">Time</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {auditLogs.map(log => (
                            <TableRow key={log.log_id}>
                                <TableCell className="font-bold">{log.action}</TableCell>
                                <TableCell className="text-xs italic">{log.details}</TableCell>
                                <TableCell className="text-right">{new Date(log.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}
      </main>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm transition-all ${
        active ? "bg-black text-white font-bold shadow-md" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon} {label}
    </button>
  );
}

export default SuperAdmin;