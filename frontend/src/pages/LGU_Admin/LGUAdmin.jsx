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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, Users, FileEdit, History, FileText, CreditCard, Activity,
  Search, AlertTriangle, CheckCircle, Clock, Eye, X, Save, Car, AlertCircle,
  Plus, Edit, Trash2
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function LGUAdmin() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [tickets, setTickets] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [demeritThreshold, setDemeritThreshold] = useState(12);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ status: "", location: "" });
  
  // Driver search state
  const [driverSearchQuery, setDriverSearchQuery] = useState("");
  
  // Driver CRUD dialog states
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverForm, setDriverForm] = useState({
    license_number: "", first_name: "", last_name: "", address: "",
    birth_date: "", contact_number: "", email: "", license_status: "ACTIVE", demerit_points: 0
  });
  const [deleteDriverDialogOpen, setDeleteDriverDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);

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
      const [ticketRes, driverRes, logsRes, thresholdRes] = await Promise.all([
        fetch(`${API_URL}/api/tickets`, { headers }),
        fetch(`${API_URL}/api/drivers`, { headers }),
        fetch(`${API_URL}/api/audit?type=audit&pageSize=100`, { headers }),  // Only CRUD operations, not login events
        fetch(`${API_URL}/api/system/config/demerit_threshold`, { headers })
      ]);
      const ticketData = await ticketRes.json();
      const driverData = await driverRes.json();
      const logsData = await logsRes.json();
      const thresholdData = await thresholdRes.json();
      setTickets(ticketData.data || []);
      setDrivers(driverData.data || []);
      setLogs(logsData.data || []);
      if (thresholdData.data?.value) setDemeritThreshold(parseInt(thresholdData.data.value));
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`${API_URL}/api/tickets/${selectedTicket.ticket_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success("Ticket updated successfully");
        fetchData();
        setEditDialogOpen(false);
        setSelectedTicket(null);
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openEditDialog = (ticket) => {
    setSelectedTicket(ticket);
    setEditForm({ status: ticket.status, location: ticket.location });
    setEditDialogOpen(true);
  };

  // === DRIVER CRUD OPERATIONS ===
  const openDriverDialog = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setDriverForm({
        license_number: driver.license_number || "",
        first_name: driver.first_name || "",
        last_name: driver.last_name || "",
        address: driver.address || "",
        birth_date: driver.birth_date ? driver.birth_date.split('T')[0] : "",
        contact_number: driver.contact_number || "",
        email: driver.email || "",
        license_status: driver.license_status || "ACTIVE",
        demerit_points: driver.demerit_points || 0
      });
    } else {
      setEditingDriver(null);
      setDriverForm({
        license_number: "", first_name: "", last_name: "", address: "",
        birth_date: "", contact_number: "", email: "", license_status: "ACTIVE", demerit_points: 0
      });
    }
    setDriverDialogOpen(true);
  };

  const handleSaveDriver = async () => {
    try {
      if (!driverForm.license_number || !driverForm.first_name || !driverForm.last_name) {
        toast.error("License number, first name, and last name are required");
        return;
      }

      const payload = {
        license_number: driverForm.license_number,
        first_name: driverForm.first_name,
        last_name: driverForm.last_name,
        address: driverForm.address || null,
        birth_date: driverForm.birth_date || null,
        contact_number: driverForm.contact_number || null,
        email: driverForm.email || null
      };

      // Only include these for updates
      if (editingDriver) {
        payload.license_status = driverForm.license_status;
        payload.demerit_points = parseInt(driverForm.demerit_points) || 0;
      }

      const res = await fetch(
        editingDriver ? `${API_URL}/api/drivers/${editingDriver.driver_id}` : `${API_URL}/api/drivers`,
        { method: editingDriver ? "PUT" : "POST", headers, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to save driver");

      toast.success(editingDriver ? "Driver updated successfully!" : "Driver created successfully!");
      setDriverDialogOpen(false);
      setEditingDriver(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDeleteDriver = (driver) => {
    setDriverToDelete(driver);
    setDeleteDriverDialogOpen(true);
  };

  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/drivers/${driverToDelete.driver_id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to delete driver");
      }
      toast.success("Driver deleted successfully!");
      setDeleteDriverDialogOpen(false);
      setDriverToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openViewDialog = (ticket) => {
    setSelectedTicket(ticket);
    setViewDialogOpen(true);
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
    { key: "drivers", label: "Drivers & Demerits", icon: <Car size={18} /> },
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
                  <TableHead>Violation</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Demerit</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Processed By</TableHead>
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
                    <TableCell className="text-sm max-w-[120px] truncate" title={t.violation_names}>{t.violation_names || '—'}</TableCell>
                    <TableCell className="font-medium text-primary">₱{t.total_fine ? Number(t.total_fine).toLocaleString() : '0'}</TableCell>
                    <TableCell className="font-medium text-orange-600">{t.total_demerit_points || 0} pts</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="text-sm">{t.officer_first_name || t.issued_by_username || '—'} {t.officer_last_name || ''}</TableCell>
                    <TableCell className="text-sm">{t.status === 'PAID' ? (t.payment_method || '—') : '—'}</TableCell>
                    <TableCell className="text-sm">{t.status === 'PAID' ? (t.processed_by_first_name || t.processed_by_username || '—') + ' ' + (t.processed_by_last_name || '') : '—'}</TableCell>
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

  const renderDrivers = () => {
    // Filter drivers by search query
    const filteredDrivers = drivers.filter(d => 
      d.first_name?.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
      d.last_name?.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
      d.license_number?.toLowerCase().includes(driverSearchQuery.toLowerCase())
    );
    
    // Calculate demerit statistics using dynamic threshold
    const totalDrivers = drivers.length;
    const driversWithDemerits = drivers.filter(d => d.demerit_points > 0).length;
    const atRiskDrivers = drivers.filter(d => d.demerit_points >= (demeritThreshold * 0.7) && d.license_status === 'ACTIVE').length;
    const suspendedDrivers = drivers.filter(d => d.license_status === 'SUSPENDED').length;
    const revokedDrivers = drivers.filter(d => d.license_status === 'REVOKED').length;
    
    // Get status badge for license
    const getLicenseStatusBadge = (status) => {
      const variants = { ACTIVE: "success", SUSPENDED: "destructive", REVOKED: "secondary" };
      return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
    };
    
    // Get risk level based on demerit points and threshold
    const getRiskLevel = (points, status) => {
      if (status === 'SUSPENDED') return { level: "SUSPENDED", variant: "destructive", color: "text-red-600" };
      if (status === 'REVOKED') return { level: "REVOKED", variant: "secondary", color: "text-gray-600" };
      if (points >= demeritThreshold) return { level: "OVER LIMIT", variant: "destructive", color: "text-red-600" };
      if (points >= demeritThreshold * 0.8) return { level: "CRITICAL", variant: "destructive", color: "text-red-500" };
      if (points >= demeritThreshold * 0.6) return { level: "HIGH", variant: "warning", color: "text-orange-600" };
      if (points >= demeritThreshold * 0.4) return { level: "MODERATE", variant: "warning", color: "text-amber-600" };
      if (points > 0) return { level: "LOW", variant: "secondary", color: "text-blue-600" };
      return { level: "CLEAN", variant: "outline", color: "text-green-600" };
    };
    
    // Calculate progress percentage towards threshold
    const getProgressToThreshold = (points) => {
      return Math.min(100, Math.round((points / demeritThreshold) * 100));
    };
    
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <PageHeader 
          title="Drivers & Demerit Points" 
          description="Monitor all drivers in your jurisdiction and their current demerit point status."
          actions={
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search drivers..." 
                  className="pl-9"
                  value={driverSearchQuery}
                  onChange={e => setDriverSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => openDriverDialog()}>
                <Plus className="w-4 h-4 mr-2" />Add Driver
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Drivers" value={totalDrivers} icon={Users} />
          <StatCard title="With Demerits" value={driversWithDemerits} icon={AlertCircle} description="Have points" />
          <StatCard title="At Risk" value={atRiskDrivers} icon={AlertTriangle} description={`≥${Math.round(demeritThreshold * 0.7)} pts`} />
          <StatCard title="Suspended" value={suspendedDrivers} icon={X} description="License suspended" />
          <StatCard title="Threshold" value={demeritThreshold} icon={FileText} description="Suspension limit" />
        </div>

        {/* Threshold Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">License Suspension Threshold</h3>
                <p className="text-sm text-muted-foreground">
                  Drivers who accumulate <strong>{demeritThreshold} or more</strong> demerit points will have their license automatically suspended.
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">{demeritThreshold}</div>
                <div className="text-sm text-muted-foreground">points limit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Level Legend */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-3">Demerit Point Risk Levels (based on {demeritThreshold}-point threshold)</div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span><strong>CLEAN</strong> (0 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span><strong>LOW</strong> (1-{Math.round(demeritThreshold * 0.4) - 1})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span><strong>MODERATE</strong> ({Math.round(demeritThreshold * 0.4)}-{Math.round(demeritThreshold * 0.6) - 1})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span><strong>HIGH</strong> ({Math.round(demeritThreshold * 0.6)}-{Math.round(demeritThreshold * 0.8) - 1})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span><strong>CRITICAL</strong> ({Math.round(demeritThreshold * 0.8)}-{demeritThreshold - 1})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-700" />
              <span><strong>SUSPENDED</strong> (≥{demeritThreshold})</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Drivers</CardTitle>
            <CardDescription>Complete list of registered drivers with their demerit point status (suspension at {demeritThreshold} points)</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDrivers.length === 0 ? (
              <EmptyState 
                title="No drivers found" 
                description={driverSearchQuery ? "Try a different search term." : "No drivers registered in the system."}
                icon={Users}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License #</TableHead>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Demerit Points</TableHead>
                    <TableHead className="text-center" style={{minWidth: '150px'}}>Progress to Limit</TableHead>
                    <TableHead className="text-center">Risk Level</TableHead>
                    <TableHead className="text-center">License Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => {
                    const risk = getRiskLevel(driver.demerit_points || 0, driver.license_status);
                    const progress = getProgressToThreshold(driver.demerit_points || 0);
                    const progressColor = progress >= 100 ? 'bg-red-500' : progress >= 80 ? 'bg-orange-500' : progress >= 60 ? 'bg-amber-500' : 'bg-blue-500';
                    return (
                      <TableRow key={driver.driver_id} className={driver.license_status === 'SUSPENDED' ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                        <TableCell className="font-mono text-sm">{driver.license_number}</TableCell>
                        <TableCell className="font-medium">{driver.first_name} {driver.last_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {driver.contact_number || driver.email || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-lg font-bold ${risk.color}`}>
                            {driver.demerit_points || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">/{demeritThreshold}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} transition-all`} style={{width: `${progress}%`}} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={risk.variant}>{risk.level}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {getLicenseStatusBadge(driver.license_status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openDriverDialog(driver)} title="Edit Driver">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => confirmDeleteDriver(driver)} title="Delete Driver">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

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
                    <TableHead>Violation</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead>Demerit</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Processed By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((t) => (
                    <TableRow key={t.ticket_id} className={selectedTicket?.ticket_id === t.ticket_id ? "bg-muted" : ""}>
                      <TableCell className="font-medium">{t.first_name} {t.last_name}</TableCell>
                      <TableCell className="text-sm max-w-[120px] truncate" title={t.violation_names}>{t.violation_names || '—'}</TableCell>
                      <TableCell className="font-medium text-primary">₱{t.total_fine ? Number(t.total_fine).toLocaleString() : '0'}</TableCell>
                      <TableCell className="font-medium text-orange-600">{t.total_demerit_points || 0} pts</TableCell>
                      <TableCell className="text-sm">{t.officer_first_name || t.issued_by_username || '—'} {t.officer_last_name || ''}</TableCell>
                      <TableCell className="text-sm">{t.status === 'PAID' ? (t.payment_method || '—') : '—'}</TableCell>
                      <TableCell className="text-sm">{t.status === 'PAID' ? (t.processed_by_first_name || t.processed_by_username || '—') + ' ' + (t.processed_by_last_name || '') : '—'}</TableCell>
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
                <DetailRow label="Violation" value={selectedTicket.violation_names || '—'} />
                <DetailRow label="Fine Amount" value={`₱${selectedTicket.total_fine ? Number(selectedTicket.total_fine).toLocaleString() : '0'}`} />
                <DetailRow label="Demerit Points" value={<span className="text-orange-600 font-bold">{selectedTicket.total_demerit_points || 0} pts</span>} />
                <DetailRow label="Driver Total Demerits" value={<span className="text-red-600 font-bold">{selectedTicket.driver_demerit_points || 0} pts</span>} />
                <DetailRow label="Location" value={selectedTicket.location} />
                <DetailRow label="Date Issued" value={selectedTicket.date_issued} />
                <DetailRow label="Issued By" value={`${selectedTicket.officer_first_name || selectedTicket.issued_by_username || '—'} ${selectedTicket.officer_last_name || ''}`} />
                <DetailRow label="Status" value={<StatusBadge status={selectedTicket.status} />} />
                {selectedTicket.status === 'PAID' && (
                  <>
                    <DetailRow label="Payment Method" value={selectedTicket.payment_method || '—'} />
                    <DetailRow label="Processed By" value={`${selectedTicket.processed_by_first_name || selectedTicket.processed_by_username || '—'} ${selectedTicket.processed_by_last_name || ''}`} />
                  </>
                )}
                
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
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
          <CardDescription>Select a ticket to modify its status</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <EmptyState 
              title="No tickets found" 
              description={searchQuery ? "Try a different search term." : "No tickets available."}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket No.</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Demerit</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Processed By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((t) => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate" title={t.violation_names}>{t.violation_names || '—'}</TableCell>
                    <TableCell className="font-medium text-primary">₱{t.total_fine ? Number(t.total_fine).toLocaleString() : '0'}</TableCell>
                    <TableCell className="font-medium text-orange-600">{t.total_demerit_points || 0} pts</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="text-sm">{t.officer_first_name || t.issued_by_username || '—'} {t.officer_last_name || ''}</TableCell>
                    <TableCell className="text-sm">{t.status === 'PAID' ? (t.payment_method || '—') : '—'}</TableCell>
                    <TableCell className="text-sm">{t.status === 'PAID' ? (t.processed_by_first_name || t.processed_by_username || '—') + ' ' + (t.processed_by_last_name || '') : '—'}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openViewDialog(t)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(t)}>
                          <FileEdit className="w-4 h-4" />
                        </Button>
                      </div>
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

  const renderActivityLogs = () => {
    // Uses logs state from parent component, fetched in fetchData() with type=audit (CRUD only, no login events)
    // Filter logs for LGU-relevant operations
    const ticketLogs = logs.filter(l => l.affected_table === 'Ticket' || l.action?.includes('TICKET'));
    const paymentLogs = logs.filter(l => l.affected_table === 'Payment' || l.action?.includes('PAYMENT'));
    const driverLogs = logs.filter(l => l.affected_table === 'Driver' || l.action?.includes('DRIVER'));
    const vehicleLogs = logs.filter(l => l.affected_table === 'Vehicle' || l.action?.includes('VEHICLE'));
    
    // Count by operation type
    const createOps = logs.filter(l => l.action?.includes('CREATE')).length;
    const updateOps = logs.filter(l => l.action?.includes('UPDATE')).length;
    const deleteOps = logs.filter(l => l.action?.includes('DELETE')).length;
    
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <PageHeader 
          title="Audit Trail" 
          description="Track all data modifications within your LGU jurisdiction - ticket issuance, payments, and record updates."
        />

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Records Created" value={createOps} icon={Activity} description="New entries added" />
          <StatCard title="Records Updated" value={updateOps} icon={History} description="Modifications made" />
          <StatCard title="Records Deleted" value={deleteOps} icon={AlertTriangle} description="Entries removed" />
          <StatCard title="Total Operations" value={logs.length} icon={FileText} description="All CRUD actions" />
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-primary">{ticketLogs.length}</div>
            <div className="text-sm text-muted-foreground">Ticket Operations</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{paymentLogs.length}</div>
            <div className="text-sm text-muted-foreground">Payment Records</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{driverLogs.length}</div>
            <div className="text-sm text-muted-foreground">Driver Updates</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">{vehicleLogs.length}</div>
            <div className="text-sm text-muted-foreground">Vehicle Records</div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Change History</CardTitle>
            <CardDescription>All CRUD operations on tickets, payments, drivers, and vehicles in your jurisdiction</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <EmptyState 
                title="No audit records" 
                description="Data modifications will appear here when performed."
                icon={History}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 50).map((log) => (
                    <TableRow key={log.log_id}>
                      <TableCell><ActionBadge action={log.action} /></TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded bg-muted text-xs font-mono uppercase">
                          {log.affected_table || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">#{log.affected_table_id || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {log.first_name ? `${log.first_name} ${log.last_name}` : `User #${log.user_id || '—'}`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.details || "—"}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

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
      {activeMenu === "drivers" && renderDrivers()}
      {activeMenu === "driver-records" && renderDriverRecords()}
      {activeMenu === "modify-ticket" && renderModifyTicket()}
      {activeMenu === "activity-logs" && renderActivityLogs()}

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>Full information about this ticket</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Ticket Number" value={selectedTicket.ticket_number} />
                <DetailRow label="Status" value={<StatusBadge status={selectedTicket.status} />} />
                <DetailRow label="Date Issued" value={selectedTicket.date_issued} />
                <DetailRow label="Time Issued" value={selectedTicket.time_issued} />
                <DetailRow label="Driver" value={`${selectedTicket.first_name} ${selectedTicket.last_name}`} />
                <DetailRow label="Plate Number" value={selectedTicket.plate_number} mono />
                <DetailRow label="Violation" value={selectedTicket.violation_names || '—'} />
                <DetailRow label="Fine Amount" value={`₱${selectedTicket.total_fine ? Number(selectedTicket.total_fine).toLocaleString() : '0'}`} />
                <DetailRow label="Demerit Points" value={<span className="text-orange-600 font-bold">{selectedTicket.total_demerit_points || 0} pts</span>} />
                <DetailRow label="Driver Total Demerits" value={<span className="text-red-600 font-bold">{selectedTicket.driver_demerit_points || 0} pts</span>} />
                <div className="col-span-2"><DetailRow label="Location" value={selectedTicket.location} /></div>
                <DetailRow label="Issued By" value={`${selectedTicket.officer_first_name || selectedTicket.issued_by_username || '—'} ${selectedTicket.officer_last_name || ''}`} />
                {selectedTicket.status === 'PAID' && (
                  <>
                    <DetailRow label="Payment Method" value={selectedTicket.payment_method || '—'} />
                    <DetailRow label="Processed By" value={`${selectedTicket.processed_by_first_name || selectedTicket.processed_by_username || '—'} ${selectedTicket.processed_by_last_name || ''}`} />
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => { setViewDialogOpen(false); openEditDialog(selectedTicket); }}>
              <FileEdit className="w-4 h-4 mr-2" />Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ticket: {selectedTicket?.ticket_number}</DialogTitle>
            <DialogDescription>Update the ticket information</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Driver:</span>
                  <span>{selectedTicket.first_name} {selectedTicket.last_name}</span>
                  <span className="text-muted-foreground">Plate:</span>
                  <span className="font-mono">{selectedTicket.plate_number}</span>
                  <span className="text-muted-foreground">Date:</span>
                  <span>{selectedTicket.date_issued}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Location</Label>
                <Input 
                  value={editForm.location} 
                  onChange={e => setEditForm({...editForm, location: e.target.value})}
                  placeholder="Location of violation"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={val => setEditForm({...editForm, status: val})}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">OPEN - Pending Payment</SelectItem>
                    <SelectItem value="PAID">PAID - Fine Collected</SelectItem>
                    <SelectItem value="DISMISSED">DISMISSED - Ticket Voided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusChange}><Save className="w-4 h-4 mr-2" />Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Create/Edit Dialog */}
      <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDriver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
            <DialogDescription>
              {editingDriver ? "Update driver information and license status." : "Register a new driver in the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>License Number *</Label>
              <Input 
                value={driverForm.license_number} 
                onChange={e => setDriverForm({...driverForm, license_number: e.target.value})}
                placeholder="D-0012345"
                disabled={!!editingDriver}
              />
              {editingDriver && <p className="text-xs text-muted-foreground">License number cannot be changed</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input 
                  value={driverForm.first_name} 
                  onChange={e => setDriverForm({...driverForm, first_name: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input 
                  value={driverForm.last_name} 
                  onChange={e => setDriverForm({...driverForm, last_name: e.target.value})}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={driverForm.address} 
                onChange={e => setDriverForm({...driverForm, address: e.target.value})}
                placeholder="123 Main Street, City"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Birth Date</Label>
                <Input 
                  type="date"
                  value={driverForm.birth_date} 
                  onChange={e => setDriverForm({...driverForm, birth_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input 
                  value={driverForm.contact_number} 
                  onChange={e => setDriverForm({...driverForm, contact_number: e.target.value})}
                  placeholder="+63-XXX-XXX-XXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={driverForm.email} 
                onChange={e => setDriverForm({...driverForm, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>

            {editingDriver && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">License Management</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>License Status</Label>
                      <Select 
                        value={driverForm.license_status} 
                        onValueChange={val => setDriverForm({...driverForm, license_status: val})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                          <SelectItem value="REVOKED">REVOKED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Demerit Points</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={driverForm.demerit_points} 
                        onChange={e => setDriverForm({...driverForm, demerit_points: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Changing demerit points manually will not trigger automatic license suspension. 
                    The threshold is {demeritThreshold} points.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDriver}>
              <Save className="w-4 h-4 mr-2" />
              {editingDriver ? "Save Changes" : "Add Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Driver Confirmation Dialog */}
      <Dialog open={deleteDriverDialogOpen} onOpenChange={setDeleteDriverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this driver? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {driverToDelete && (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License #:</span>
                  <span className="font-mono">{driverToDelete.license_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{driverToDelete.first_name} {driverToDelete.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Demerit Points:</span>
                  <span className="font-medium text-orange-600">{driverToDelete.demerit_points || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={driverToDelete.license_status === 'ACTIVE' ? 'success' : 'destructive'}>
                    {driverToDelete.license_status}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-destructive mt-4">
                ⚠️ Deleting a driver will fail if they have associated vehicles or tickets.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDriverDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteDriver}>
              <Trash2 className="w-4 h-4 mr-2" />Delete Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Helper Components
function StatusBadge({ status }) {
  const variants = { OPEN: "warning", PAID: "success", DISMISSED: "secondary" };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

function ActionBadge({ action }) {
  const variants = {
    LOGIN: "success", LOGIN_SUCCESS: "success", LOGOUT: "secondary",
    LOGIN_FAILED: "destructive", CREATE: "default", UPDATE: "warning", DELETE: "destructive"
  };
  const variant = Object.keys(variants).find(k => action?.includes(k)) || "outline";
  return <Badge variant={variants[variant] || "outline"}>{action}</Badge>;
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
