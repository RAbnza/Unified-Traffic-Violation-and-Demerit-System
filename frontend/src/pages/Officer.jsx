import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileText, Plus, BarChart3, LogOut, Shield, MapPin, 
  User, Car, CheckCircle, RefreshCw, Edit, Save, X 
} from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function Officer() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tickets, setTickets] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State for Creating Ticket
  const [formData, setFormData] = useState({
    ticket_number: "TKT-" + Math.floor(Math.random() * 90000 + 10000),
    location: "",
    driver_id: "",
    vehicle_id: "",
    violation_type_id: ""
  });

  // State for Editing
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: "", location: "" });

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

  const handleUpdateTicket = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingId(null);
        fetchInitialData();
        alert("Ticket updated successfully");
      }
    } catch (err) {
      alert("Update failed");
    }
  };

  const startEditing = (ticket) => {
    setEditingId(ticket.ticket_id);
    setEditForm({ status: ticket.status, location: ticket.location });
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticketPayload = {
        ...formData,
        date_issued: new Date().toISOString().slice(0, 10),
        time_issued: new Date().toTimeString().slice(0, 8),
        issued_by: user.user_id,
        lgu_id: user.lgu_id || 1 
      };
      const res = await fetch("http://localhost:3000/api/tickets", {
        method: "POST",
        headers,
        body: JSON.stringify(ticketPayload)
      });
      const data = await res.json();
      if (res.ok) {
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
        setActiveTab("edit");
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:border-primary transition-all" onClick={() => setActiveTab("create")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary"><Plus className="w-5 h-5"/> Create Ticket</CardTitle>
              <CardDescription>Issue a new traffic violation to a driver.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-all" onClick={() => setActiveTab("edit")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary"><Edit className="w-5 h-5"/> Edit Ticket</CardTitle>
              <CardDescription>Modify status or location of existing tickets.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Activity Overview</CardTitle></CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ticket No.</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Plate</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.slice(0, 5).map((t) => (
                        <TableRow key={t.ticket_id}>
                            <TableCell className="font-bold">{t.ticket_number}</TableCell>
                            <TableCell>{t.last_name}</TableCell>
                            <TableCell className="font-mono">{t.plate_number}</TableCell>
                            <TableCell>
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

  const renderCreateForm = () => (
    <Card className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle>Issue New Violation</CardTitle>
        <CardDescription>Enter details for the new traffic ticket.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <label className="font-bold">Ticket Number</label>
              <input disabled className="w-full p-2 border rounded bg-muted" value={formData.ticket_number} />
            </div>
            <div className="space-y-1">
              <label className="font-bold">Location</label>
              <input required className="w-full p-2 border rounded" placeholder="Street/Intersection" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="font-bold">Driver ID</label>
              <input required type="number" className="w-full p-2 border rounded" value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="font-bold">Vehicle ID</label>
              <input required type="number" className="w-full p-2 border rounded" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <label className="font-bold">Violation Type</label>
            <select required className="w-full p-2 border rounded bg-background" value={formData.violation_type_id} onChange={e => setFormData({...formData, violation_type_id: e.target.value})}>
              <option value="">Select Violation</option>
              {violationTypes.map(v => (
                <option key={v.violation_type_id} value={v.violation_type_id}>{v.name} (₱{v.fine_amount})</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>Issue Ticket</Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderEditTickets = () => (
    <Card className="animate-in fade-in duration-500">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Tickets</CardTitle>
          <CardDescription>Edit ticket details or change status.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={fetchInitialData}><RefreshCw size={14} className="mr-2"/> Refresh</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket No.</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.ticket_id}>
                <TableCell className="font-medium">{t.ticket_number}</TableCell>
                <TableCell>
                  {editingId === t.ticket_id ? (
                    <input 
                        className="border rounded px-2 py-1 text-sm w-full"
                        value={editForm.location}
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    />
                  ) : t.location}
                </TableCell>
                <TableCell>
                  {editingId === t.ticket_id ? (
                    <select 
                        className="border rounded px-2 py-1 text-sm"
                        value={editForm.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    >
                        <option value="OPEN">OPEN</option>
                        <option value="PAID">PAID</option>
                        <option value="DISMISSED">DISMISSED</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${t.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {t.status}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingId === t.ticket_id ? (
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateTicket(t.ticket_id)}><Save size={16} className="text-green-600"/></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X size={16} className="text-red-600"/></Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => startEditing(t)}><Edit size={16}/></Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderReport = () => (
    <Card className="animate-in fade-in duration-500">
        <CardHeader>
            <CardTitle>Violation Summary Report</CardTitle>
            <CardDescription>Comprehensive list of issued tickets.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Ticket No.</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((t) => (
                        <TableRow key={t.ticket_id}>
                            <TableCell className="text-xs">{t.date_issued}</TableCell>
                            <TableCell className="font-medium">{t.ticket_number}</TableCell>
                            <TableCell>{t.first_name} {t.last_name}</TableCell>
                            <TableCell className="text-right font-bold text-xs">
                                {t.status}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background flex">
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
            variant={activeTab === "edit" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab("edit")}
          >
            <Edit size={18}/> Edit Ticket
          </Button>
          <Button 
            variant={activeTab === "report" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab("report")}
          >
            <FileText size={18}/> View Report
          </Button>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold uppercase">
              {user?.username?.[0]}
            </div>
            <div>
              <p className="text-xs font-bold truncate w-32">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Traffic Officer</p>
            </div>
          </div>
          <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2"/> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold capitalize tracking-tight">{activeTab.replace("-", " ")} Overview</h1>
        </header>

        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "create" && renderCreateForm()}
        {activeTab === "edit" && renderEditTickets()}
        {activeTab === "report" && renderReport()}
      </main>
    </div>
  );
}

export default Officer;