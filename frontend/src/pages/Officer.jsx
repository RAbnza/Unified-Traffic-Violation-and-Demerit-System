import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Plus, BarChart3, LogOut, Shield, MapPin, User, Car, CheckCircle, RefreshCw } from "lucide-react";

function Officer() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); // Tab state: dashboard, create, history
  const [tickets, setTickets] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State for New Ticket
  const [formData, setFormData] = useState({
    ticket_number: "TKT-" + Math.floor(Math.random() * 90000 + 10000),
    location: "",
    driver_id: "",
    vehicle_id: "",
    violation_type_id: ""
  });

  const token = localStorage.getItem("authToken");
  const headers = { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}` 
  };

  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem("authUser"));
    if (!authUser) return navigate("/login");
    setUser(authUser);
    fetchInitialData();
  }, [navigate]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [tRes, vRes] = await Promise.all([
        fetch("http://localhost:3000/api/tickets", { headers }),
        fetch("http://localhost:3000/api/violations", { headers })
      ]);
      const tData = await tRes.json();
      const vData = await vRes.json();
      setTickets(tData.data || []);
      setViolationTypes(vData.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create the Ticket
      const ticketPayload = {
        ...formData,
        date_issued: new Date().toISOString().slice(0, 10),
        time_issued: new Date().toTimeString().slice(0, 8),
        issued_by: user.user_id,
        lgu_id: 1 // Defaulting to seed LGU ID
      };

      const res = await fetch("http://localhost:3000/api/tickets", {
        method: "POST",
        headers,
        body: JSON.stringify(ticketPayload)
      });
      const data = await res.json();

      if (res.ok) {
        // 2. Add the Violation to the ticket (using the route in tickets.route.js)
        await fetch(`http://localhost:3000/api/tickets/${data.ticket_id}/violations`, {
          method: "POST",
          headers,
          body: JSON.stringify({ violation_type_id: formData.violation_type_id })
        });

        alert("Ticket Issued Successfully!");
        setFormData({
          ticket_number: "TKT-" + Math.floor(Math.random() * 90000 + 10000),
          location: "",
          driver_id: "",
          vehicle_id: "",
          violation_type_id: ""
        });
        fetchInitialData();
        setActiveTab("history");
      }
    } catch (err) {
      alert("Error issuing ticket");
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
          <CardHeader><CardTitle className="text-sm">Total Issued</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{tickets.length}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab("create")}>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus size={16}/> New Ticket</CardTitle></CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">Issue a new violation immediately.</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Pending Payments</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{tickets.filter(t => t.status === 'OPEN').length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Latest Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets.slice(0, 3).map(t => (
              <div key={t.ticket_id} className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded"><FileText size={16}/></div>
                  <div>
                    <p className="text-sm font-bold">{t.ticket_number}</p>
                    <p className="text-xs text-muted-foreground">{t.plate_number} • {t.date_issued}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${t.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreateForm = () => (
    <Card className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle>Issue Violation Ticket</CardTitle>
        <CardDescription>Enter the driver and vehicle details accurately.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center gap-1"><FileText size={12}/> Ticket No.</label>
              <input disabled className="w-full p-2 border rounded bg-muted text-sm" value={formData.ticket_number} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center gap-1"><MapPin size={12}/> Location</label>
              <input required className="w-full p-2 border rounded bg-background text-sm" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Main Ave." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center gap-1"><User size={12}/> Driver ID</label>
              <input required type="number" className="w-full p-2 border rounded bg-background text-sm" value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})} placeholder="1" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center gap-1"><Car size={12}/> Vehicle ID</label>
              <input required type="number" className="w-full p-2 border rounded bg-background text-sm" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} placeholder="1" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold">Violation Type</label>
            <select required className="w-full p-2 border rounded bg-background text-sm" value={formData.violation_type_id} onChange={e => setFormData({...formData, violation_type_id: e.target.value})}>
              <option value="">Select Violation</option>
              {violationTypes.map(v => (
                <option key={v.violation_type_id} value={v.violation_type_id}>{v.name} (₱{v.fine_amount})</option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Processing..." : "Confirm & Issue Ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderHistory = () => (
    <Card className="animate-in fade-in duration-500">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ticket History</CardTitle>
        <Button size="sm" variant="outline" onClick={fetchInitialData}><RefreshCw size={14} className="mr-2"/> Refresh</Button>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b"><th className="pb-3">Ticket No.</th><th>Driver</th><th>Plate No.</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.ticket_id} className="border-b hover:bg-muted/30">
                <td className="py-4 font-bold">{t.ticket_number}</td>
                <td>{t.last_name || "N/A"}</td>
                <td className="font-mono">{t.plate_number}</td>
                <td>{t.date_issued}</td>
                <td>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${t.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Shield className="text-primary" />
          <span className="font-bold">OFFICER PORTAL</span>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <Button 
            variant={activeTab === "dashboard" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab("dashboard")}
          >
            <BarChart3 size={18}/> Dashboard
          </Button>
          <Button 
            variant={activeTab === "create" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab("create")}
          >
            <Plus size={18}/> Create Ticket
          </Button>
          <Button 
            variant={activeTab === "history" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab("history")}
          >
            <FileText size={18}/> Ticket History
          </Button>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold">{user?.username}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Traffic Officer</p>
            </div>
          </div>
          <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2"/> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold capitalize">{activeTab.replace("-", " ")}</h1>
          <p className="text-muted-foreground">Manage and issue traffic violation reports.</p>
        </header>

        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "create" && renderCreateForm()}
        {activeTab === "history" && renderHistory()}
      </main>
    </div>
  );
}

export default Officer;