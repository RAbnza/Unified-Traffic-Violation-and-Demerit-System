import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DollarSign,
  FileDown,
  LogOut,
  Shield,
  Settings,
  HelpCircle,
  Home,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2
} from "lucide-react";

function LGUStaff() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalCollection: 0, pendingCount: 0 });

  const token = localStorage.getItem("authToken");
  const headers = { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}` 
  };

  useEffect(() => {
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      setUser(JSON.parse(authUser));
      fetchPaymentData();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/payments", { headers });
      const result = await res.json();
      const data = result.data || [];
      setPayments(data);

      // Calculate simple stats
      const total = data.reduce((acc, curr) => acc + parseFloat(curr.amount_paid), 0);
      setStats({
        totalCollection: total,
        pendingCount: data.filter(p => !p.payment_date).length // Logic based on your backend schema
      });
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- RENDERING FUNCTIONS ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp size={16} /> Total Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₱{stats.totalCollection.toLocaleString()}</p>
            <p className="text-xs opacity-70">Accumulated revenue from violations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" /> Processed Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{payments.length}</p>
            <p className="text-xs text-muted-foreground">Successfully recorded receipts</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("manage-payments")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign size={16} className="text-blue-500" /> New Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Click here to process a new violation payment.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest 5 transactions processed by the LGU.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.slice(0, 5).map((p) => (
              <div key={p.payment_id} className="flex justify-between items-center border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full"><Clock size={14} /></div>
                  <div>
                    <p className="text-sm font-bold">{p.receipt_number}</p>
                    <p className="text-xs text-muted-foreground">Ticket #{p.ticket_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">₱{parseFloat(p.amount_paid).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{p.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderManagePayments = () => (
    <Card className="animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment Management</CardTitle>
          <CardDescription>Verify and review all financial records.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={fetchPaymentData} disabled={loading}>
          <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr className="text-left">
                <th className="p-3 font-medium">Receipt No.</th>
                <th className="p-3 font-medium">Ticket ID</th>
                <th className="p-3 font-medium">Method</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Date Paid</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.payment_id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs">{p.receipt_number}</td>
                  <td className="p-3">#{p.ticket_id}</td>
                  <td className="p-3"><span className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold uppercase">{p.payment_method}</span></td>
                  <td className="p-3 font-bold text-green-600">₱{parseFloat(p.amount_paid).toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderReports = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>Generate daily or monthly collection summaries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/20 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold">Monthly Collection Report</p>
              <p className="text-xs text-muted-foreground">Summary of all fines paid this month.</p>
            </div>
            <Button size="sm"><FileDown size={16} /></Button>
          </div>
          <div className="p-4 border rounded-lg bg-muted/20 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold">Violation Statistics</p>
              <p className="text-xs text-muted-foreground">Summary of most frequent violations.</p>
            </div>
            <Button size="sm" variant="outline"><FileDown size={16} /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>System Information</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Connected LGU</span>
            <span className="font-bold text-primary">Metro City LGU</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Assigned Station</span>
            <span>Quezon City HQ</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Last Sync</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-xs leading-tight uppercase tracking-wider">Unified Traffic<br/>System</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-2 uppercase">Main Menu</p>
          <button
            onClick={() => setActiveMenu("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMenu === "dashboard" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Home className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveMenu("manage-payments")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMenu === "manage-payments" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <DollarSign className="w-4 h-4" /> Payments
          </button>
          <button
            onClick={() => setActiveMenu("export-data")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMenu === "export-data" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <FileDown className="w-4 h-4" /> Reports
          </button>

          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-2 mt-6 uppercase">System</p>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <HelpCircle className="w-4 h-4" /> Support
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.username}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Staff Access</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Logout Account
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold capitalize">{activeMenu.replace("-", " ")}</h1>
          <p className="text-muted-foreground">Welcome back. Manage and track traffic violation collections.</p>
        </header>

        {activeMenu === "dashboard" && renderDashboard()}
        {activeMenu === "manage-payments" && renderManagePayments()}
        {activeMenu === "export-data" && renderReports()}
      </main>
    </div>
  );
}

export default LGUStaff;