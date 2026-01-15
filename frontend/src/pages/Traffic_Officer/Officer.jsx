import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "@/components/common/DashboardLayout";
import StatCard from "@/components/common/StatCard";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LayoutDashboard, FilePlus, FileEdit, FileText, 
  CheckCircle, Clock, Car, MapPin, User,
  Save, X, Search
} from "lucide-react";

function Officer() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [tickets, setTickets] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states
  const [formData, setFormData] = useState({
    ticket_number: generateTicketNumber(),
    location: "",
    driver_id: "",
    vehicle_id: "",
    violation_type_id: ""
  });
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: "", location: "" });

  const token = localStorage.getItem("authToken");
  const headers = { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}` 
  };

  function generateTicketNumber() {
    return "TKT-" + Math.floor(Math.random() * 90000 + 10000);
  }

  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem("authUser"));
    if (!authUser) return navigate("/login");
    setUser(authUser);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketRes, violationRes] = await Promise.all([
        fetch("http://localhost:3000/api/tickets", { headers }),
        fetch("http://localhost:3000/api/violations", { headers })
      ]);
      const ticketData = await ticketRes.json();
      const violationData = await violationRes.json();
      setTickets(ticketData.data || []);
      setViolationTypes(violationData.data || []);
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
      const payload = {
        ...formData,
        date_issued: new Date().toISOString().slice(0, 10),
        time_issued: new Date().toTimeString().slice(0, 8),
        issued_by: user.user_id,
        lgu_id: user.lgu_id || 1
      };
      const res = await fetch("http://localhost:3000/api/tickets", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (formData.violation_type_id) {
          await fetch(`http://localhost:3000/api/tickets/${data.ticket_id}/violations`, {
            method: "POST",
            headers,
            body: JSON.stringify({ violation_type_id: formData.violation_type_id })
          });
        }
        toast.success("Ticket issued successfully!");
        setFormData({
          ticket_number: generateTicketNumber(),
          location: "",
          driver_id: "",
          vehicle_id: "",
          violation_type_id: ""
        });
        fetchData();
        setActiveMenu("manage-tickets");
      }
    } catch (err) {
      toast.error("Error issuing ticket");
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
        fetchData();
        toast.success("Ticket updated successfully");
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const startEditing = (ticket) => {
    setEditingId(ticket.ticket_id);
    setEditForm({ status: ticket.status, location: ticket.location });
  };

  // Filter tickets based on search
  const filteredTickets = tickets.filter(t => 
    t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "OPEN").length,
    paid: tickets.filter(t => t.status === "PAID").length,
    dismissed: tickets.filter(t => t.status === "DISMISSED").length
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "issue-ticket", label: "Issue New Ticket", icon: <FilePlus size={18} /> },
    { key: "manage-tickets", label: "Manage Tickets", icon: <FileEdit size={18} /> },
    { key: "my-reports", label: "My Reports", icon: <FileText size={18} /> },
  ];

  // === RENDER SECTIONS ===

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Welcome back!" 
        description="Here's an overview of your traffic enforcement activity."
      />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tickets" value={stats.total} icon={FileText} />
        <StatCard title="Open Tickets" value={stats.open} icon={Clock} description="Pending payment" />
        <StatCard title="Paid Tickets" value={stats.paid} icon={CheckCircle} description="Successfully resolved" />
        <StatCard title="Dismissed" value={stats.dismissed} icon={X} description="Voided tickets" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("issue-ticket")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FilePlus className="w-5 h-5 text-primary" />
              Issue New Ticket
            </CardTitle>
            <CardDescription>Record a new traffic violation for a driver</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("manage-tickets")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileEdit className="w-5 h-5 text-primary" />
              Manage Tickets
            </CardTitle>
            <CardDescription>Edit or update existing ticket records</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Your latest issued violations</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <EmptyState 
              title="No tickets yet" 
              description="Start issuing tickets to see them here."
              actionLabel="Issue Ticket"
              onAction={() => setActiveMenu("issue-ticket")}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket No.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Plate No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.slice(0, 5).map((t) => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.date_issued}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={t.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderIssueTicket = () => (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <PageHeader 
        title="Issue New Ticket" 
        description="Fill in the violation details to issue a new traffic ticket."
      />
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateTicket} className="space-y-6">
            {/* Ticket Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ticket Number</Label>
                <Input disabled value={formData.ticket_number} className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="violation">Violation Type *</Label>
                <select 
                  id="violation"
                  required
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  value={formData.violation_type_id}
                  onChange={e => setFormData({...formData, violation_type_id: e.target.value})}
                >
                  <option value="">Select Violation</option>
                  {violationTypes.map(v => (
                    <option key={v.violation_type_id} value={v.violation_type_id}>
                      {v.name} (₱{v.fine_amount})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location *
              </Label>
              <Input 
                id="location"
                required
                placeholder="Street, intersection, or landmark"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>

            {/* Driver & Vehicle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver">
                  <User className="inline w-4 h-4 mr-1" />
                  Driver ID *
                </Label>
                <Input 
                  id="driver"
                  type="number"
                  required
                  placeholder="Enter driver ID"
                  value={formData.driver_id}
                  onChange={e => setFormData({...formData, driver_id: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">
                  <Car className="inline w-4 h-4 mr-1" />
                  Vehicle ID *
                </Label>
                <Input 
                  id="vehicle"
                  type="number"
                  required
                  placeholder="Enter vehicle ID"
                  value={formData.vehicle_id}
                  onChange={e => setFormData({...formData, vehicle_id: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                <FilePlus className="w-4 h-4 mr-2" />
                {loading ? "Issuing..." : "Issue Ticket"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setActiveMenu("dashboard")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderManageTickets = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Manage Tickets" 
        description="View, search, and update ticket information."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tickets..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />
      
      <Card>
        <CardContent className="pt-6">
          {filteredTickets.length === 0 ? (
            <EmptyState 
              title="No tickets found" 
              description={searchQuery ? "Try a different search term." : "Issue tickets to see them here."}
              actionLabel={!searchQuery ? "Issue Ticket" : undefined}
              onAction={!searchQuery ? () => setActiveMenu("issue-ticket") : undefined}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket No.</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Plate No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((t) => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>
                      {editingId === t.ticket_id ? (
                        <Input 
                          value={editForm.location}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          className="h-8"
                        />
                      ) : (
                        <span className="text-sm">{t.location}</span>
                      )}
                    </TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                    <TableCell>
                      {editingId === t.ticket_id ? (
                        <select 
                          className="h-8 px-2 border rounded text-sm"
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="PAID">PAID</option>
                          <option value="DISMISSED">DISMISSED</option>
                        </select>
                      ) : (
                        <StatusBadge status={t.status} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === t.ticket_id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateTicket(t.ticket_id)}>
                            <Save className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => startEditing(t)}>
                          <FileEdit className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderMyReports = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="My Reports" 
        description="Summary of all tickets you've issued."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Open Tickets" 
          value={stats.open} 
          icon={Clock}
          description="Awaiting payment"
        />
        <StatCard 
          title="Paid Tickets" 
          value={stats.paid} 
          icon={CheckCircle}
          description="Successfully collected"
        />
        <StatCard 
          title="Dismissed" 
          value={stats.dismissed} 
          icon={X}
          description="Voided/cancelled"
        />
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Issued Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <EmptyState 
              title="No reports available" 
              description="Start issuing tickets to generate reports."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Ticket No.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="text-sm text-muted-foreground">{t.date_issued}</TableCell>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="text-sm">{t.location}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={t.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout
      user={user}
      roleName="officer"
      roleLabel="Traffic Officer"
      menuItems={menuItems}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      onRefresh={fetchData}
      loading={loading}
    >
      {activeMenu === "dashboard" && renderDashboard()}
      {activeMenu === "issue-ticket" && renderIssueTicket()}
      {activeMenu === "manage-tickets" && renderManageTickets()}
      {activeMenu === "my-reports" && renderMyReports()}
    </DashboardLayout>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const styles = {
    OPEN: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    DISMISSED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  };
  
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.OPEN}`}>
      {status}
    </span>
  );
}

export default Officer;
