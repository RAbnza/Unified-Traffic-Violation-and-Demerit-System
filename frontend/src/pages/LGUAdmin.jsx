import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users,
  FileText,
  Activity,
  LogOut,
  Shield,
  Settings,
  HelpCircle,
  Home,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";

function LGUAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  // Data States
  const [usersList, setUsersList] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const token = localStorage.getItem("authToken");
  const headers = { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}` 
  };

  useEffect(() => {
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      setUser(JSON.parse(authUser));
      fetchAllData();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uRes, tRes, aRes] = await Promise.all([
        fetch("http://localhost:3000/api/users", { headers }),
        fetch("http://localhost:3000/api/tickets", { headers }),
        fetch("http://localhost:3000/api/audit", { headers })
      ]);

      const uData = await uRes.json();
      const tData = await tRes.json();
      const aData = await aRes.json();

      setUsersList(uData.data || []);
      setTickets(tData.data || []);
      setAuditLogs(aData.data || []);
    } catch (err) {
      console.error("Error fetching LGU data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Ticket #${ticketId} updated to ${newStatus}`);
        fetchAllData(); // Refresh list
      }
    } catch (err) {
      alert("Failed to update ticket.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- RENDERING MODULES ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Personnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersList.length}</div>
            <p className="text-xs text-muted-foreground">Officers & Staff under LGU</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'OPEN').length}</div>
            <p className="text-xs text-muted-foreground">Unpaid or pending review</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">System actions recorded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Quick Modify</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Select a ticket from the "Modify Ticket" tab to change its legal status (Dismissed/Paid).</p>
            <Button onClick={() => setActiveMenu("modify-ticket")} variant="outline" className="w-full">Go to Tickets</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Personnel Overview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">View and manage profile information for all assigned traffic officers.</p>
            <Button onClick={() => setActiveMenu("user-info")} variant="outline" className="w-full">Go to User Info</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <Card className="animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader><CardTitle>LGU Personnel Information</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Username</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map(u => (
              <tr key={u.user_id} className="border-b hover:bg-muted/20">
                <td className="p-3 font-medium">{u.first_name} {u.last_name}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Role {u.role_id}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  const renderModifyTicket = () => (
    <Card className="animate-in fade-in duration-500">
      <CardHeader><CardTitle>Modify Ticket Status</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Ticket No.</th>
              <th className="p-3">Violator</th>
              <th className="p-3">Plate</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.ticket_id} className="border-b">
                <td className="p-3 font-bold">{t.ticket_number}</td>
                <td className="p-3">{t.last_name}</td>
                <td className="p-3 font-mono">{t.plate_number}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  {t.status === 'OPEN' && (
                    <>
                      <Button size="xs" className="h-7 text-[10px] bg-green-600" onClick={() => updateTicketStatus(t.ticket_id, 'PAID')}>Mark Paid</Button>
                      <Button size="xs" variant="destructive" className="h-7 text-[10px]" onClick={() => updateTicketStatus(t.ticket_id, 'DISMISSED')}>Dismiss</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  const renderLogs = () => (
    <Card className="animate-in zoom-in-95 duration-500">
      <CardHeader><CardTitle>Access & Audit Logs</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {auditLogs.slice(0, 10).map(log => (
            <div key={log.log_id} className="text-xs p-3 border rounded bg-muted/20 flex justify-between items-center">
              <div>
                <span className="font-bold text-primary mr-2">[{log.action}]</span>
                <span className="text-muted-foreground">{log.details || 'No details provided'}</span>
              </div>
              <span className="text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-sm tracking-tight uppercase">LGU Administrator</h1>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Assigned LGU Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-2 uppercase">Menu</p>
          <button
            onClick={() => setActiveMenu("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              activeMenu === "dashboard" ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-muted"
            }`}
          >
            <Home className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveMenu("user-info")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              activeMenu === "user-info" ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-muted"
            }`}
          >
            <Users className="w-4 h-4" /> Personnel Info
          </button>
          <button
            onClick={() => setActiveMenu("modify-ticket")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              activeMenu === "modify-ticket" ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-muted"
            }`}
          >
            <FileText className="w-4 h-4" /> Modify Ticket
          </button>
          <button
            onClick={() => setActiveMenu("access-logs")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              activeMenu === "access-logs" ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-muted"
            }`}
          >
            <Activity className="w-4 h-4" /> Access Logs
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold capitalize">{activeMenu.replace("-", " ")}</h1>
            <p className="text-muted-foreground text-sm">Managing records for your local government unit.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAllData} disabled={loading}>
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </header>

        {activeMenu === "dashboard" && renderDashboard()}
        {activeMenu === "user-info" && renderUsers()}
        {activeMenu === "modify-ticket" && renderModifyTicket()}
        {activeMenu === "access-logs" && renderLogs()}
      </main>
    </div>
  );
}

export default LGUAdmin;