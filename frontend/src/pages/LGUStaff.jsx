import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, FileDown, LogOut, Shield, Settings, HelpCircle, Home, RefreshCw, Clock, Search
} from "lucide-react";

function LGUStaff() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      setUser(JSON.parse(authUser));
      fetchData();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/tickets", { headers });
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`http://localhost:3000/api/tickets/${selectedTicket.ticket_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ 
          status: selectedTicket.status,
          location: selectedTicket.location 
        })
      });
      if (res.ok) {
        alert("Payment Status Updated Successfully");
        fetchData();
        setActiveMenu("dashboard");
        setSelectedTicket(null);
      }
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- RENDERING MODULES ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 gap-8">
        <Card className="bg-muted/20 border-none shadow-none p-6 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setActiveMenu("manage-payments")}>
          <CardTitle className="text-xl">Manage Payments</CardTitle>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">View pending violations and update payment records for drivers in your LGU.</p>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none p-6 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setActiveMenu("view-reports")}>
          <CardTitle className="text-xl">Export Data</CardTitle>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Generate and download comprehensive reports for all traffic violations and collections.</p>
        </Card>
      </div>

      <Card className="bg-muted/10 border-none shadow-none min-h-[400px]">
        <CardHeader className="text-center pt-10">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">All Tickets Created by All Officers</CardTitle>
          <p className="text-[10px] text-muted-foreground mt-1 italic">Click a row to manage payment</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-bold text-black">Ticket No.</TableHead>
                <TableHead className="font-bold text-black">Driver Name</TableHead>
                <TableHead className="font-bold text-black">Plate Number</TableHead>
                <TableHead className="font-bold text-black text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(t => (
                <TableRow 
                  key={t.ticket_id} 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => { setSelectedTicket(t); setActiveMenu("manage-payments"); }}
                >
                  <TableCell className="font-medium">{t.ticket_number}</TableCell>
                  <TableCell>{t.first_name} {t.last_name}</TableCell>
                  <TableCell className="font-mono">{t.plate_number}</TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${t.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {t.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderManagePayments = () => {
    if (!selectedTicket) {
      return (
        <Card className="bg-muted/10 border-none p-10 text-center animate-in fade-in">
          <Clock className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h2 className="text-xl font-bold">No Ticket Selected</h2>
          <p className="text-sm text-muted-foreground mt-2">Please select a ticket from the Dashboard to manage its payment status.</p>
          <Button onClick={() => setActiveMenu("dashboard")} className="mt-6">Back to Dashboard</Button>
        </Card>
      );
    }

    return (
      <Card className="bg-muted/20 border-none shadow-none p-12 min-h-[600px] animate-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold">Manage Ticket: {selectedTicket.ticket_number}</h2>
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>Cancel Selection</Button>
        </div>
        <div className="grid grid-cols-2 gap-y-8 gap-x-20">
          <div className="space-y-5 text-sm">
            <div><p className="font-bold">Violation Reference</p><p className="text-muted-foreground">{selectedTicket.ticket_number}</p></div>
            <div><p className="font-bold">Location Issued</p><p className="text-muted-foreground">{selectedTicket.location}</p></div>
            <div><p className="font-bold">Driver Name</p><p className="text-muted-foreground">{selectedTicket.first_name} {selectedTicket.last_name}</p></div>
            <div><p className="font-bold">Date Issued</p><p className="text-muted-foreground">{selectedTicket.date_issued}</p></div>
          </div>
          <div className="space-y-5 text-sm">
            <div><p className="font-bold">Plate Number</p><p className="text-muted-foreground font-mono">{selectedTicket.plate_number}</p></div>
            <div>
              <p className="font-bold">Payment Status <span className="text-[10px] text-primary">(Update status below)</span></p>
              <select 
                className="mt-1 p-2 border rounded w-full bg-white"
                value={selectedTicket.status}
                onChange={(e) => setSelectedTicket({...selectedTicket, status: e.target.value})}
              >
                <option value="OPEN">OPEN (Pending)</option>
                <option value="PAID">PAID (Settled)</option>
                <option value="DISMISSED">DISMISSED (Voided)</option>
              </select>
            </div>
            <div><p className="font-bold">Officer ID</p><p className="text-muted-foreground">OFFICER-#{selectedTicket.issued_by}</p></div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-muted">
          <Button onClick={handleUpdatePayment} className="bg-black text-white hover:bg-black/80 h-12 px-8">
            Confirm & Update Payment Status
          </Button>
        </div>
      </Card>
    );
  };

  const renderReportsPage = () => (
    <div className="space-y-12 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">All Reports</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">Overview of all processed and pending violations within the LGU jurisdiction.</p>
        </div>
        <Card className="bg-muted/20 border-none p-4 flex flex-col items-center justify-center w-64 text-center">
           <p className="font-bold text-sm">System Export</p>
           <p className="text-[10px] text-muted-foreground my-2">Download current records as CSV/PDF</p>
           <Button variant="outline" size="sm" className="w-full" onClick={() => alert("Report generation started...")}>
             <FileDown size={14} className="mr-2" /> Export All
           </Button>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
          <Shield size={20} /> Settled Reports (PAID)
        </h3>
        <Card className="bg-muted/20 border-none shadow-none p-6">
          <ReportList filter="PAID" />
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-yellow-700 flex items-center gap-2">
          <Clock size={20} /> Pending Reports (OPEN)
        </h3>
        <Card className="bg-muted/20 border-none shadow-none p-6">
          <ReportList filter="OPEN" />
        </Card>
      </div>
    </div>
  );

  const ReportList = ({ filter }) => {
    const filtered = tickets.filter(t => t.status === filter);
    if (filtered.length === 0) return <p className="text-sm text-muted-foreground italic">No records found for this status.</p>;

    return (
      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.ticket_id} className="grid grid-cols-4 text-xs border-b border-muted-foreground/10 pb-2 items-center">
            <div className="flex flex-col"><strong>Ticket</strong><span>{t.ticket_number}</span></div>
            <div className="flex flex-col"><strong>Driver</strong><span>{t.first_name} {t.last_name}</span></div>
            <div className="flex flex-col"><strong>Date</strong><span>{t.date_issued}</span></div>
            <div className="text-right"><strong>Status</strong><span className="font-bold ml-1">{t.status}</span></div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border font-bold text-xs uppercase tracking-widest text-primary">Unified Traffic System</div>
        <div className="p-4 border-b flex items-center gap-3 bg-muted/30">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold uppercase">
            {user?.username?.[0]}
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">LGU Admin Staff</p>
            <p className="text-xs font-bold">{user?.username || "Staff User"}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-2 uppercase tracking-tighter">Main Navigation</p>
          <NavItem icon={<Home size={16}/>} label="Dashboard" active={activeMenu === "dashboard"} onClick={() => setActiveMenu("dashboard")} />
          <NavItem icon={<DollarSign size={16}/>} label="Manage Payments" active={activeMenu === "manage-payments"} onClick={() => setActiveMenu("manage-payments")} />
          <NavItem icon={<FileDown size={16}/>} label="View All Reports" active={activeMenu === "view-reports"} onClick={() => setActiveMenu("view-reports")} />
          
          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-2 mt-6 uppercase">System</p>
          <button className="w-full px-3 py-2 text-sm text-muted-foreground flex items-center gap-3 hover:bg-muted rounded transition-colors">
            <Settings size={16}/> Settings
          </button>
        </nav>
        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 text-xs" onClick={handleLogout}>
            <LogOut size={16} className="text-destructive"/> Logout Account
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-auto bg-white">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {activeMenu === "dashboard" ? "LGU Administrator Staff's Dashboard" : 
               activeMenu === "manage-payments" ? "Manage Payments" : "View All Reports"}
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </header>

        {activeMenu === "dashboard" && renderDashboard()}
        {activeMenu === "manage-payments" && renderManagePayments()}
        {activeMenu === "view-reports" && renderReportsPage()}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all ${
        active ? "bg-primary text-white shadow-sm font-bold" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon} {label}
    </button>
  );
}

export default LGUStaff;