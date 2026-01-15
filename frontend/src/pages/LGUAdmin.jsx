import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, FileText, Activity, LogOut, Shield, Settings, HelpCircle, Home, RefreshCw 
} from "lucide-react";

function LGUAdmin() {
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
      fetchTickets();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/tickets", { headers });
      const data = await res.json();
      setTickets(data.data || []);
      if (data.data?.length > 0 && !selectedTicket) setSelectedTicket(data.data[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/tickets/${selectedTicket.ticket_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: selectedTicket.status })
      });
      if (res.ok) {
        alert("Ticket Status Modified Successfully");
        fetchTickets();
        setActiveMenu("dashboard");
      }
    } catch (err) { alert("Update failed"); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- SUB-COMPONENTS FOR VIEWS ---

  const TicketDetailGrid = ({ isEditable = false }) => (
    <div className="grid grid-cols-2 gap-y-6 gap-x-12 mt-8 text-sm">
      <div className="space-y-4">
        <div><p className="font-bold">Violation Type</p><p className="text-muted-foreground">Overspeeding</p></div>
        <div><p className="font-bold">Description</p><p className="text-muted-foreground italic">Exceeding posted speed limit</p></div>
        <div><p className="font-bold">Location</p><p className="text-muted-foreground">{selectedTicket?.location || "N/A"}</p></div>
        <div><p className="font-bold">Driver's License ID</p><p className="text-muted-foreground">D-0012345</p></div>
        <div><p className="font-bold">Driver Name</p><p className="text-muted-foreground">{selectedTicket?.first_name} {selectedTicket?.last_name}</p></div>
        <div><p className="font-bold">Driver Address</p><p className="text-muted-foreground">123 Main St, Metro City</p></div>
      </div>
      <div className="space-y-4">
        <div><p className="font-bold">Plate Number</p><p className="text-muted-foreground font-mono">{selectedTicket?.plate_number}</p></div>
        <div><p className="font-bold">Vehicle Type</p><p className="text-muted-foreground">Sedan</p></div>
        <div><p className="font-bold">Vehicle Make</p><p className="text-muted-foreground">Toyota</p></div>
        <div><p className="font-bold">Vehicle Color</p><p className="text-muted-foreground">White</p></div>
        <div><p className="font-bold">Payment Status</p><p className="text-muted-foreground">{selectedTicket?.status === 'PAID' ? 'Settled' : 'Unpaid'}</p></div>
        <div>
          <p className="font-bold">Report Status</p>
          {isEditable ? (
            <select 
              className="mt-1 p-1 border rounded w-full"
              value={selectedTicket?.status}
              onChange={(e) => setSelectedTicket({...selectedTicket, status: e.target.value})}
            >
              <option value="OPEN">OPEN</option>
              <option value="PAID">PAID</option>
              <option value="DISMISSED">DISMISSED</option>
            </select>
          ) : (
            <p className="text-primary font-bold">{selectedTicket?.status}</p>
          )}
        </div>
        <div><p className="font-bold">Fine Amount</p><p className="text-muted-foreground">₱1,000.00</p></div>
        <div><p className="font-bold">Demerit Points</p><p className="text-red-600 font-bold">3 Points</p></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Matching Image Layout */}
      <aside className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border font-bold text-xs uppercase tracking-widest text-primary">Unified Traffic System</div>
        
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">
            {user?.username?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">LGU Administrator</p>
            <p className="text-xs font-bold truncate">{user?.username}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-2 uppercase">Main</p>
          <NavItem icon={<Home size={16}/>} label="Dashboard" active={activeMenu === "dashboard"} onClick={() => setActiveMenu("dashboard")} />
          <NavItem icon={<Users size={16}/>} label="User Information" active={activeMenu === "user-info"} onClick={() => setActiveMenu("user-info")} />
          <NavItem icon={<FileText size={16}/>} label="Modify Ticket Status" active={activeMenu === "modify-ticket"} onClick={() => setActiveMenu("modify-ticket")} />
          <NavItem icon={<Activity size={16}/>} label="Access Logs" active={activeMenu === "access-logs"} onClick={() => setActiveMenu("access-logs")} />
          
          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-2 mt-6 uppercase">Settings</p>
          <div className="px-3 py-2 text-sm text-muted-foreground flex justify-between items-center cursor-pointer hover:bg-muted rounded">
            <span className="flex items-center gap-3"><Settings size={16}/> Settings</span>
            <span className="text-[8px]">▼</span>
          </div>
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 text-xs"><HelpCircle size={16}/> Help</Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive text-xs" onClick={handleLogout}><LogOut size={16}/> Logout Account</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-auto bg-white">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">{
            activeMenu === "dashboard" ? "LGU Administrator's Dashboard" :
            activeMenu === "user-info" ? "User Information" : 
            activeMenu === "modify-ticket" ? "Modify Ticket Status" : "Access Logs"
          }</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-4xl leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </header>

        {activeMenu === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-8">
              <Card className="bg-muted/20 border-none shadow-none p-4">
                <CardTitle className="text-lg">Check User Information</CardTitle>
                <p className="text-xs text-muted-foreground mt-2">Lorem ipsum dolor sit amet, consectetur sed do eiusmod tempor incididunt ut labore et</p>
                <div className="mt-4 h-16 bg-muted/40 rounded"></div>
              </Card>
              <Card className="bg-muted/20 border-none shadow-none p-4">
                <CardTitle className="text-lg">Modify Ticket Status</CardTitle>
                <p className="text-xs text-muted-foreground mt-2">Lorem ipsum dolor sit amet, consectetur sed do eiusmod tempor incididunt ut labore et</p>
                <div className="mt-4 h-16 bg-muted/40 rounded"></div>
              </Card>
            </div>
            <Card className="bg-muted/10 border-none shadow-none min-h-[400px]">
              <CardHeader><CardTitle className="text-muted-foreground text-center mt-20">Table for Access Logs</CardTitle></CardHeader>
              <CardContent>{renderAccessLogsTable()}</CardContent>
            </Card>
          </div>
        )}

        {(activeMenu === "user-info" || activeMenu === "modify-ticket") && (
          <Card className="bg-muted/20 border-none shadow-none p-12 min-h-[600px] animate-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold border-b pb-4">Show info about clicked record</h2>
            <TicketDetailGrid isEditable={activeMenu === "modify-ticket"} />
            <div className="mt-12 flex justify-start">
              {activeMenu === "user-info" ? (
                <Button onClick={() => setActiveMenu("modify-ticket")}>Go to Modify Ticket Status</Button>
              ) : (
                <Button onClick={handleStatusChange} className="bg-black text-white hover:bg-black/80">Go to Confirm Ticket Modification</Button>
              )}
            </div>
          </Card>
        )}

        {activeMenu === "access-logs" && (
          <Card className="bg-muted/20 border-none shadow-none p-12 animate-in fade-in">
             <h2 className="text-xl font-bold mb-6">Show table with:</h2>
             {renderAccessLogsTable(true)}
             <div className="mt-8"><Button onClick={() => setActiveMenu("modify-ticket")}>Go to Confirm Ticket Modification</Button></div>
          </Card>
        )}
      </main>
    </div>
  );

  function renderAccessLogsTable(full = false) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="font-bold text-black">Violation Type</TableHead>
            <TableHead className="font-bold text-black">Location</TableHead>
            <TableHead className="font-bold text-black">Driver's License ID</TableHead>
            <TableHead className="font-bold text-black">Driver Name</TableHead>
            <TableHead className="font-bold text-black">Plate Number</TableHead>
            <TableHead className="font-bold text-black">Payment Status</TableHead>
            <TableHead className="font-bold text-black">Report Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.slice(0, full ? 10 : 5).map(t => (
            <TableRow key={t.ticket_id} className="cursor-pointer" onClick={() => { setSelectedTicket(t); setActiveMenu("user-info"); }}>
              <TableCell>Overspeeding</TableCell>
              <TableCell>{t.location}</TableCell>
              <TableCell>D-0012345</TableCell>
              <TableCell>{t.first_name} {t.last_name}</TableCell>
              <TableCell className="font-mono">{t.plate_number}</TableCell>
              <TableCell>{t.status === 'PAID' ? 'Settled' : 'Unpaid'}</TableCell>
              <TableCell className="font-bold">{t.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all ${
        active ? "bg-white shadow-sm font-bold text-black" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon} {label}
    </button>
  );
}

export default LGUAdmin;