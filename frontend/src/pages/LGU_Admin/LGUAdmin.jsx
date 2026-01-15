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
  LayoutDashboard, Users, FileEdit, History, 
  Search, AlertTriangle, CheckCircle, Clock, Eye, X
} from "lucide-react";

function LGUAdmin() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleStatusChange = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`http://localhost:3000/api/tickets/${selectedTicket.ticket_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: selectedTicket.status })
      });
      if (res.ok) {
        toast.success("Ticket status updated successfully");
        fetchData();
        setActiveMenu("dashboard");
        setSelectedTicket(null);
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // Filter tickets
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
    { key: "driver-records", label: "Driver Records", icon: <Users size={18} /> },
    { key: "modify-ticket", label: "Modify Tickets", icon: <FileEdit size={18} /> },
    { key: "activity-logs", label: "Activity Logs", icon: <History size={18} /> },
  ];

  // === RENDER SECTIONS ===

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="LGU Admin Dashboard" 
        description="Manage driver records, review violations, and oversee ticket status within your jurisdiction."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tickets" value={stats.total} icon={AlertTriangle} />
        <StatCard title="Open Tickets" value={stats.open} icon={Clock} description="Pending resolution" />
        <StatCard title="Paid" value={stats.paid} icon={CheckCircle} description="Fines collected" />
        <StatCard title="Dismissed" value={stats.dismissed} icon={X} description="Voided tickets" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("driver-records")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              View Driver Records
            </CardTitle>
            <CardDescription>Search and view violation history for drivers</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("modify-ticket")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileEdit className="w-5 h-5 text-primary" />
              Modify Ticket Status
            </CardTitle>
            <CardDescription>Update or dismiss traffic violation tickets</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Violations</CardTitle>
          <CardDescription>Latest tickets issued within your LGU</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <EmptyState 
              title="No tickets found" 
              description="Traffic violations will appear here once issued."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket No.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Plate No.</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.slice(0, 6).map((t) => (
                  <TableRow 
                    key={t.ticket_id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => { setSelectedTicket(t); setActiveMenu("driver-records"); }}
                  >
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.location}</TableCell>
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

  const renderDriverRecords = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Driver Records" 
        description="Search and view detailed driver information and violation history."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or plate..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All Violations</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <EmptyState 
                title="No records found" 
                description={searchQuery ? "Try a different search term." : "No violation records available."}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Plate No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((t) => (
                    <TableRow key={t.ticket_id} className={selectedTicket?.ticket_id === t.ticket_id ? "bg-muted" : ""}>
                      <TableCell className="font-medium">{t.first_name} {t.last_name}</TableCell>
                      <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.date_issued}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTicket(t)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Driver Details Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTicket ? (
              <div className="space-y-4">
                <DetailRow label="Ticket Number" value={selectedTicket.ticket_number} />
                <DetailRow label="Driver Name" value={`${selectedTicket.first_name} ${selectedTicket.last_name}`} />
                <DetailRow label="Plate Number" value={selectedTicket.plate_number} mono />
                <DetailRow label="Location" value={selectedTicket.location} />
                <DetailRow label="Date Issued" value={selectedTicket.date_issued} />
                <DetailRow label="Status" value={<StatusBadge status={selectedTicket.status} />} />
                
                <div className="pt-4 border-t">
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveMenu("modify-ticket")}
                  >
                    <FileEdit className="w-4 h-4 mr-2" />
                    Modify This Ticket
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a record to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderModifyTicket = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Modify Ticket Status" 
        description="Update ticket status or dismiss violations as needed."
      />

      {selectedTicket ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Update Ticket: {selectedTicket.ticket_number}</CardTitle>
            <CardDescription>Review and modify the ticket status below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ticket Information */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <DetailRow label="Driver" value={`${selectedTicket.first_name} ${selectedTicket.last_name}`} />
              <DetailRow label="Plate Number" value={selectedTicket.plate_number} mono />
              <DetailRow label="Location" value={selectedTicket.location} />
              <DetailRow label="Date Issued" value={selectedTicket.date_issued} />
            </div>

            {/* Status Update */}
            <div className="space-y-3">
              <Label htmlFor="status">Update Status</Label>
              <select 
                id="status"
                className="w-full h-10 px-3 border rounded-md bg-background"
                value={selectedTicket.status}
                onChange={(e) => setSelectedTicket({...selectedTicket, status: e.target.value})}
              >
                <option value="OPEN">OPEN - Pending Payment</option>
                <option value="PAID">PAID - Fine Collected</option>
                <option value="DISMISSED">DISMISSED - Ticket Voided</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={handleStatusChange}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => { setSelectedTicket(null); setActiveMenu("dashboard"); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Select a ticket to modify from the list below
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket No.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Select</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedTicket(t)}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderActivityLogs = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Activity Logs" 
        description="Track all administrative actions within your LGU jurisdiction."
      />

      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Activity logs coming soon" 
            description="This feature will track all ticket modifications and administrative actions."
            icon={History}
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout
      user={user}
      roleName="lgu-admin"
      roleLabel="LGU Administrator"
      menuItems={menuItems}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      onRefresh={fetchData}
      loading={loading}
    >
      {activeMenu === "dashboard" && renderDashboard()}
      {activeMenu === "driver-records" && renderDriverRecords()}
      {activeMenu === "modify-ticket" && renderModifyTicket()}
      {activeMenu === "activity-logs" && renderActivityLogs()}
    </DashboardLayout>
  );
}

// Helper Components
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

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default LGUAdmin;
