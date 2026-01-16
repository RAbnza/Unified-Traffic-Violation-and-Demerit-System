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
  LayoutDashboard, FilePlus, FileEdit, FileText, CheckCircle, Clock, Car, MapPin, User,
  Save, X, Search, AlertCircle, Loader2, Plus, Eye
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
    ticket_number: generateTicketNumber(), location: "", driver_id: "", vehicle_id: "", violation_type_id: "", license_number: "", plate_number: ""
  });
  
  // Lookup states
  const [driverInfo, setDriverInfo] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [lookupLoading, setLookupLoading] = useState({ driver: false, vehicle: false });
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: "", location: "" });

  // View ticket dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // New driver dialog
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [driverForm, setDriverForm] = useState({
    license_number: "", first_name: "", last_name: "", address: "", birth_date: "", contact_number: "", email: ""
  });

  // New vehicle dialog
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    plate_number: "", make: "", model: "", year: "", color: "", vehicle_type: "", driver_id: ""
  });

  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

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
        fetch(`${API_URL}/api/tickets`, { headers }),
        fetch(`${API_URL}/api/violations`, { headers })
      ]);
      const ticketData = await ticketRes.json();
      const violationData = await violationRes.json();
      setTickets(ticketData.data || []);
      setViolationTypes(violationData.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.driver_id || !formData.vehicle_id) {
      toast.error("Please lookup a valid plate number first");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ticket_number: formData.ticket_number,
        location: formData.location,
        driver_id: parseInt(formData.driver_id),
        vehicle_id: parseInt(formData.vehicle_id),
        date_issued: new Date().toISOString().slice(0, 10),
        time_issued: new Date().toTimeString().slice(0, 8),
        issued_by: user.user_id,
        lgu_id: user.lgu_id || 1
      };
      const res = await fetch(`${API_URL}/api/tickets`, { method: "POST", headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        if (formData.violation_type_id) {
          const violationRes = await fetch(`${API_URL}/api/tickets/${data.ticket_id}/violations`, {
            method: "POST", headers, body: JSON.stringify({ violation_type_id: parseInt(formData.violation_type_id) })
          });
          const violationData = await violationRes.json();
          
          // Check if license was suspended due to demerit points
          if (violationData.license_status_changed && violationData.new_license_status === 'SUSPENDED') {
            toast.warning(`⚠️ Driver's license has been SUSPENDED due to exceeding demerit points threshold!`, {
              duration: 6000
            });
          }
        }
        toast.success("Ticket issued successfully!");
        resetForm();
        fetchData();
        setActiveMenu("manage-tickets");
      } else {
        throw new Error(data?.error?.message || "Failed to create ticket");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/tickets/${id}`, { method: "PUT", headers, body: JSON.stringify(editForm) });
      if (res.ok) {
        setEditingId(null);
        fetchData();
        toast.success("Ticket updated successfully");
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const startEditing = (ticket) => {
    setEditingId(ticket.ticket_id);
    setEditForm({ status: ticket.status, location: ticket.location });
  };

  const lookupDriver = async () => {
    if (!formData.license_number.trim()) { toast.error("Please enter a license number"); return; }
    setLookupLoading(prev => ({ ...prev, driver: true }));
    try {
      const res = await fetch(`${API_URL}/api/drivers/license/${encodeURIComponent(formData.license_number)}`, { headers });
      const data = await res.json();
      if (data.data) {
        setDriverInfo(data.data);
        setFormData(prev => ({ ...prev, driver_id: data.data.driver_id }));
        toast.success(`Driver found: ${data.data.first_name} ${data.data.last_name}`);
      } else {
        setDriverInfo(null);
        setFormData(prev => ({ ...prev, driver_id: "" }));
        toast.error("Driver not found. You can add a new driver.");
      }
    } catch (err) {
      toast.error("Error looking up driver");
    } finally {
      setLookupLoading(prev => ({ ...prev, driver: false }));
    }
  };

  const lookupVehicle = async () => {
    if (!formData.plate_number.trim()) { toast.error("Please enter a plate number"); return; }
    setLookupLoading(prev => ({ ...prev, vehicle: true }));
    try {
      const res = await fetch(`${API_URL}/api/vehicles/plate/${encodeURIComponent(formData.plate_number)}`, { headers });
      const data = await res.json();
      if (data.data) {
        setVehicleInfo(data.data);
        setFormData(prev => ({ 
          ...prev, vehicle_id: data.data.vehicle_id, driver_id: data.data.driver_id, license_number: data.data.license_number
        }));
        setDriverInfo({
          driver_id: data.data.driver_id, first_name: data.data.driver_first_name, last_name: data.data.driver_last_name, license_number: data.data.license_number
        });
        toast.success(`Vehicle found: ${data.data.make} ${data.data.model}`);
      } else {
        setVehicleInfo(null);
        setFormData(prev => ({ ...prev, vehicle_id: "" }));
        toast.error("Vehicle not found. You can add a new vehicle.");
      }
    } catch (err) {
      toast.error("Error looking up vehicle");
    } finally {
      setLookupLoading(prev => ({ ...prev, vehicle: false }));
    }
  };

  const resetForm = () => {
    setFormData({ ticket_number: generateTicketNumber(), location: "", driver_id: "", vehicle_id: "", violation_type_id: "", license_number: "", plate_number: "" });
    setDriverInfo(null);
    setVehicleInfo(null);
  };

  // Create new driver
  const handleCreateDriver = async () => {
    try {
      if (!driverForm.license_number || !driverForm.first_name || !driverForm.last_name) {
        toast.error("License number, first name, and last name are required");
        return;
      }
      const res = await fetch(`${API_URL}/api/drivers`, { method: "POST", headers, body: JSON.stringify(driverForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create driver");
      toast.success("Driver created successfully!");
      setDriverDialogOpen(false);
      setFormData(prev => ({ ...prev, license_number: driverForm.license_number, driver_id: data.driver_id }));
      setDriverInfo({ driver_id: data.driver_id, first_name: driverForm.first_name, last_name: driverForm.last_name, license_number: driverForm.license_number });
      setDriverForm({ license_number: "", first_name: "", last_name: "", address: "", birth_date: "", contact_number: "", email: "" });
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Create new vehicle
  const handleCreateVehicle = async () => {
    try {
      if (!vehicleForm.plate_number || !vehicleForm.driver_id) {
        toast.error("Plate number and driver are required");
        return;
      }
      const res = await fetch(`${API_URL}/api/vehicles`, { method: "POST", headers, body: JSON.stringify(vehicleForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create vehicle");
      toast.success("Vehicle created successfully!");
      setVehicleDialogOpen(false);
      setFormData(prev => ({ ...prev, plate_number: vehicleForm.plate_number, vehicle_id: data.vehicle_id }));
      setVehicleInfo({ vehicle_id: data.vehicle_id, plate_number: vehicleForm.plate_number, make: vehicleForm.make, model: vehicleForm.model, year: vehicleForm.year, color: vehicleForm.color, vehicle_type: vehicleForm.vehicle_type });
      setVehicleForm({ plate_number: "", make: "", model: "", year: "", color: "", vehicle_type: "", driver_id: "" });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const viewTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setViewDialogOpen(true);
  };

  const filteredTickets = tickets.filter(t => 
    t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Welcome back!" description="Here's an overview of your traffic enforcement activity." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tickets" value={stats.total} icon={FileText} />
        <StatCard title="Open Tickets" value={stats.open} icon={Clock} description="Pending payment" />
        <StatCard title="Paid Tickets" value={stats.paid} icon={CheckCircle} description="Successfully resolved" />
        <StatCard title="Dismissed" value={stats.dismissed} icon={X} description="Voided tickets" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("issue-ticket")}><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FilePlus className="w-5 h-5 text-primary" />Issue New Ticket</CardTitle><CardDescription>Record a new traffic violation</CardDescription></CardHeader></Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("manage-tickets")}><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileEdit className="w-5 h-5 text-primary" />Manage Tickets</CardTitle><CardDescription>Edit or update existing tickets</CardDescription></CardHeader></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Tickets</CardTitle><CardDescription>Your latest issued violations</CardDescription></CardHeader>
        <CardContent>
          {tickets.length === 0 ? <EmptyState title="No tickets yet" description="Start issuing tickets to see them here." actionLabel="Issue Ticket" onAction={() => setActiveMenu("issue-ticket")} /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Ticket No.</TableHead><TableHead>Driver</TableHead><TableHead>Plate No.</TableHead><TableHead>Violation</TableHead><TableHead>Fine</TableHead><TableHead>Demerit Pts</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {tickets.slice(0, 5).map(t => (
                  <TableRow key={t.ticket_id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewTicketDetails(t)}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                    <TableCell className="text-sm">{t.violation_names || '—'}</TableCell>
                    <TableCell className="font-medium">₱{parseFloat(t.total_fine || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium text-orange-600">{t.total_demerit_points || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.date_issued}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={t.status} /></TableCell>
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
      <PageHeader title="Issue New Ticket" description="Fill in the violation details to issue a new traffic ticket." />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateTicket} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Ticket Number</Label><Input disabled value={formData.ticket_number} className="bg-muted" /></div>
              <div className="space-y-2">
                <Label htmlFor="violation">Violation Type *</Label>
                <Select value={formData.violation_type_id} onValueChange={val => setFormData({...formData, violation_type_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select Violation" /></SelectTrigger>
                  <SelectContent>
                    {violationTypes.map(v => (
                      <SelectItem key={v.violation_type_id} value={String(v.violation_type_id)}>
                        {v.name} — ₱{v.fine_amount} • {v.demerit_point} pts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Violation Summary */}
            {formData.violation_type_id && (
              <div className="bg-muted/50 border rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Violation Summary</div>
                {(() => {
                  const selected = violationTypes.find(v => String(v.violation_type_id) === formData.violation_type_id);
                  return selected ? (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Violation:</span>
                        <p className="font-medium">{selected.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fine Amount:</span>
                        <p className="font-medium text-primary">₱{Number(selected.fine_amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Demerit Points:</span>
                        <p className="font-medium text-orange-600">{selected.demerit_point} points</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="plate"><Car className="inline w-4 h-4 mr-1" />Plate Number *</Label>
                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setVehicleForm({ ...vehicleForm, plate_number: formData.plate_number, driver_id: formData.driver_id ? String(formData.driver_id) : "" }); setVehicleDialogOpen(true); }}>
                  <Plus className="w-3 h-3 mr-1" />Add New Vehicle
                </Button>
              </div>
              <div className="flex gap-2">
                <Input id="plate" placeholder="e.g., ABC-1234" value={formData.plate_number} onChange={e => setFormData({...formData, plate_number: e.target.value.toUpperCase()})} className="flex-1" />
                <Button type="button" variant="outline" onClick={lookupVehicle} disabled={lookupLoading.vehicle}>
                  {lookupLoading.vehicle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {vehicleInfo && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mt-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-foreground">{vehicleInfo.make} {vehicleInfo.model}</span>
                  <span>•</span><span>{vehicleInfo.color} {vehicleInfo.vehicle_type}</span><span>•</span><span>{vehicleInfo.year}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="license"><User className="inline w-4 h-4 mr-1" />Driver License # *</Label>
                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setDriverForm({ ...driverForm, license_number: formData.license_number }); setDriverDialogOpen(true); }}>
                  <Plus className="w-3 h-3 mr-1" />Add New Driver
                </Button>
              </div>
              <div className="flex gap-2">
                <Input id="license" placeholder="e.g., D-0012345" value={formData.license_number} onChange={e => setFormData({...formData, license_number: e.target.value})} className="flex-1" />
                <Button type="button" variant="outline" onClick={lookupDriver} disabled={lookupLoading.driver}>
                  {lookupLoading.driver ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {driverInfo && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mt-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-foreground">{driverInfo.first_name} {driverInfo.last_name}</span>
                  <span>•</span><span>License: {driverInfo.license_number}</span>
                  {driverInfo.demerit_points > 0 && <><span>•</span><span className="text-orange-500">{driverInfo.demerit_points} demerit points</span></>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location"><MapPin className="inline w-4 h-4 mr-1" />Location *</Label>
              <Input id="location" required placeholder="Street, intersection, or landmark" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>

            {(!formData.driver_id || !formData.vehicle_id) && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>Please lookup a valid plate number to auto-fill driver and vehicle information.</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={loading || !formData.driver_id || !formData.vehicle_id}>
                <FilePlus className="w-4 h-4 mr-2" />{loading ? "Issuing..." : "Issue Ticket"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setActiveMenu("dashboard"); }}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderManageTickets = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Manage Tickets" description="View, search, and update ticket information." actions={
        <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search tickets..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
      } />
      <Card>
        <CardContent className="pt-6">
          {filteredTickets.length === 0 ? <EmptyState title="No tickets found" description={searchQuery ? "Try a different search term." : "Issue tickets to see them here."} actionLabel={!searchQuery ? "Issue Ticket" : undefined} onAction={!searchQuery ? () => setActiveMenu("issue-ticket") : undefined} /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Ticket No.</TableHead><TableHead>Location</TableHead><TableHead>Driver</TableHead><TableHead>Plate No.</TableHead><TableHead>Violation</TableHead><TableHead>Fine</TableHead><TableHead>Demerit</TableHead><TableHead>Issued By</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredTickets.map(t => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>
                      {editingId === t.ticket_id ? <Input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="h-8" /> : <span className="text-sm">{t.location}</span>}
                    </TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                    <TableCell className="text-sm">{t.violation_names || '—'}</TableCell>
                    <TableCell className="font-medium">₱{parseFloat(t.total_fine || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium text-orange-600">{t.total_demerit_points || 0}</TableCell>
                    <TableCell className="text-sm">{t.officer_first_name || t.issued_by_username || '—'} {t.officer_last_name || ''}</TableCell>
                    <TableCell>
                      {editingId === t.ticket_id ? (
                        <Select value={editForm.status} onValueChange={val => setEditForm({...editForm, status: val})}>
                          <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">OPEN</SelectItem>
                            <SelectItem value="PAID">PAID</SelectItem>
                            <SelectItem value="DISMISSED">DISMISSED</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : <StatusBadge status={t.status} />}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === t.ticket_id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateTicket(t.ticket_id)}><Save className="w-4 h-4 text-green-600" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4 text-red-600" /></Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => viewTicketDetails(t)}><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => startEditing(t)}><FileEdit className="w-4 h-4" /></Button>
                        </div>
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
      <PageHeader title="My Reports" description="Summary of all tickets you've issued." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Open Tickets" value={stats.open} icon={Clock} description="Awaiting payment" />
        <StatCard title="Paid Tickets" value={stats.paid} icon={CheckCircle} description="Successfully collected" />
        <StatCard title="Dismissed" value={stats.dismissed} icon={X} description="Voided/cancelled" />
      </div>
      <Card>
        <CardHeader><CardTitle>All Issued Tickets</CardTitle></CardHeader>
        <CardContent>
          {tickets.length === 0 ? <EmptyState title="No reports available" description="Start issuing tickets to generate reports." /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Date Issued</TableHead><TableHead>Ticket No.</TableHead><TableHead>Driver</TableHead><TableHead>Location</TableHead><TableHead>Violation</TableHead><TableHead>Fine</TableHead><TableHead>Demerit</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {tickets.map(t => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="text-sm text-muted-foreground">{t.date_issued}</TableCell>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="text-sm">{t.location}</TableCell>
                    <TableCell className="text-sm">{t.violation_names || '—'}</TableCell>
                    <TableCell className="font-medium">₱{parseFloat(t.total_fine || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium text-orange-600">{t.total_demerit_points || 0}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={t.status} /></TableCell>
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
    <DashboardLayout user={user} roleName="officer" roleLabel="Traffic Officer" menuItems={menuItems} activeMenu={activeMenu} setActiveMenu={setActiveMenu} onRefresh={fetchData} loading={loading}>
      {activeMenu === "dashboard" && renderDashboard()}
      {activeMenu === "issue-ticket" && renderIssueTicket()}
      {activeMenu === "manage-tickets" && renderManageTickets()}
      {activeMenu === "my-reports" && renderMyReports()}

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ticket Details</DialogTitle><DialogDescription>Full information about this ticket</DialogDescription></DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Ticket Number</Label><p className="font-medium">{selectedTicket.ticket_number}</p></div>
                <div><Label className="text-muted-foreground">Status</Label><p><StatusBadge status={selectedTicket.status} /></p></div>
                <div><Label className="text-muted-foreground">Date Issued</Label><p>{selectedTicket.date_issued}</p></div>
                <div><Label className="text-muted-foreground">Time Issued</Label><p>{selectedTicket.time_issued}</p></div>
                <div><Label className="text-muted-foreground">Driver</Label><p>{selectedTicket.first_name} {selectedTicket.last_name}</p></div>
                <div><Label className="text-muted-foreground">Plate Number</Label><p className="font-mono">{selectedTicket.plate_number}</p></div>
                <div><Label className="text-muted-foreground">Violation</Label><p>{selectedTicket.violation_names || '—'}</p></div>
                <div><Label className="text-muted-foreground">Fine Amount</Label><p className="font-medium text-primary">₱{parseFloat(selectedTicket.total_fine || 0).toFixed(2)}</p></div>
                <div><Label className="text-muted-foreground">Demerit Points</Label><p className="font-medium text-orange-600">{selectedTicket.total_demerit_points || 0} points</p></div>
                <div><Label className="text-muted-foreground">Driver Total Points</Label><p className="font-medium text-red-600">{selectedTicket.driver_demerit_points || 0} points</p></div>
                <div className="col-span-2"><Label className="text-muted-foreground">Location</Label><p>{selectedTicket.location}</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Driver Dialog */}
      <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Driver</DialogTitle><DialogDescription>Register a new driver in the system</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>License Number *</Label><Input value={driverForm.license_number} onChange={e => setDriverForm({...driverForm, license_number: e.target.value})} placeholder="D-0012345" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name *</Label><Input value={driverForm.first_name} onChange={e => setDriverForm({...driverForm, first_name: e.target.value})} placeholder="John" /></div>
              <div className="space-y-2"><Label>Last Name *</Label><Input value={driverForm.last_name} onChange={e => setDriverForm({...driverForm, last_name: e.target.value})} placeholder="Doe" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input value={driverForm.address} onChange={e => setDriverForm({...driverForm, address: e.target.value})} placeholder="123 Main St" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Birth Date</Label><Input type="date" value={driverForm.birth_date} onChange={e => setDriverForm({...driverForm, birth_date: e.target.value})} /></div>
              <div className="space-y-2"><Label>Contact Number</Label><Input value={driverForm.contact_number} onChange={e => setDriverForm({...driverForm, contact_number: e.target.value})} placeholder="+63-XXX-XXX-XXXX" /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={driverForm.email} onChange={e => setDriverForm({...driverForm, email: e.target.value})} placeholder="john@example.com" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDriverDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateDriver}><Save className="w-4 h-4 mr-2" />Add Driver</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Vehicle Dialog */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Vehicle</DialogTitle><DialogDescription>Register a new vehicle in the system</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Plate Number *</Label><Input value={vehicleForm.plate_number} onChange={e => setVehicleForm({...vehicleForm, plate_number: e.target.value.toUpperCase()})} placeholder="ABC-1234" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Make</Label><Input value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} placeholder="Toyota" /></div>
              <div className="space-y-2"><Label>Model</Label><Input value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} placeholder="Vios" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Year</Label><Input type="number" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: e.target.value})} placeholder="2020" /></div>
              <div className="space-y-2"><Label>Color</Label><Input value={vehicleForm.color} onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})} placeholder="White" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select value={vehicleForm.vehicle_type} onValueChange={val => setVehicleForm({...vehicleForm, vehicle_type: val})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sedan">Sedan</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Hatchback">Hatchback</SelectItem>
                    <SelectItem value="Pickup">Pickup</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Owner Driver ID *</Label><Input type="number" value={vehicleForm.driver_id} onChange={e => setVehicleForm({...vehicleForm, driver_id: e.target.value})} placeholder="Driver ID" /></div>
            </div>
            {!vehicleForm.driver_id && driverInfo && (
              <Button type="button" variant="outline" className="w-full" onClick={() => setVehicleForm({...vehicleForm, driver_id: String(driverInfo.driver_id)})}>
                Use Current Driver ({driverInfo.first_name} {driverInfo.last_name})
              </Button>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setVehicleDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateVehicle}><Save className="w-4 h-4 mr-2" />Add Vehicle</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatusBadge({ status }) {
  const variants = { OPEN: "warning", PAID: "success", DISMISSED: "secondary" };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

export default Officer;
