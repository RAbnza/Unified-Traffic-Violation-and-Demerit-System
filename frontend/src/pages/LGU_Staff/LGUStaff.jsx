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
  LayoutDashboard, DollarSign, FileDown, FileText, 
  Search, Clock, CheckCircle, AlertTriangle, Download, Eye
} from "lucide-react";

function LGUStaff() {
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

  const handleUpdatePayment = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`http://localhost:3000/api/tickets/${selectedTicket.ticket_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: "PAID" })
      });
      if (res.ok) {
        toast.success("Payment recorded successfully!");
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

  const pendingTickets = tickets.filter(t => t.status === "OPEN");
  const paidTickets = tickets.filter(t => t.status === "PAID");

  // Calculate stats
  const stats = {
    total: tickets.length,
    pending: pendingTickets.length,
    paid: paidTickets.length,
    todayCollections: paidTickets.filter(t => {
      const today = new Date().toDateString();
      return new Date(t.date_issued).toDateString() === today;
    }).length
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "process-payment", label: "Process Payment", icon: <DollarSign size={18} /> },
    { key: "payment-history", label: "Payment History", icon: <FileText size={18} /> },
    { key: "export-reports", label: "Export Reports", icon: <FileDown size={18} /> },
  ];

  // === RENDER SECTIONS ===

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="LGU Staff Dashboard" 
        description="Process payments, view pending tickets, and generate collection reports."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tickets" value={stats.total} icon={FileText} />
        <StatCard title="Pending Payment" value={stats.pending} icon={Clock} description="Awaiting collection" />
        <StatCard title="Paid Tickets" value={stats.paid} icon={CheckCircle} description="Fines collected" />
        <StatCard title="Today's Collections" value={stats.todayCollections} icon={DollarSign} description="Processed today" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("process-payment")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-primary" />
              Process Payment
            </CardTitle>
            <CardDescription>Record fine payments for traffic violations</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("export-reports")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileDown className="w-5 h-5 text-primary" />
              Export Reports
            </CardTitle>
            <CardDescription>Download collection and violation reports</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Pending Payments
          </CardTitle>
          <CardDescription>Tickets awaiting payment collection</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTickets.length === 0 ? (
            <EmptyState 
              title="No pending payments" 
              description="All tickets have been processed."
              icon={CheckCircle}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket No.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Plate No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTickets.slice(0, 5).map((t) => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.date_issued}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        onClick={() => { setSelectedTicket(t); setActiveMenu("process-payment"); }}
                      >
                        Process
                      </Button>
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

  const renderProcessPayment = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Process Payment" 
        description="Record payment for traffic violations."
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tickets List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pending Tickets</CardTitle>
            <CardDescription>Select a ticket to process payment</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTickets.length === 0 ? (
              <EmptyState 
                title="No pending payments" 
                description="All violations have been paid."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket No.</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Plate No.</TableHead>
                    <TableHead className="text-right">Select</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTickets.filter(t => 
                    !searchQuery || 
                    t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.first_name?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((t) => (
                    <TableRow 
                      key={t.ticket_id} 
                      className={selectedTicket?.ticket_id === t.ticket_id ? "bg-muted" : "cursor-pointer hover:bg-muted/50"}
                      onClick={() => setSelectedTicket(t)}
                    >
                      <TableCell className="font-medium">{t.ticket_number}</TableCell>
                      <TableCell>{t.first_name} {t.last_name}</TableCell>
                      <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant={selectedTicket?.ticket_id === t.ticket_id ? "secondary" : "ghost"}
                        >
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

        {/* Payment Processing Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTicket ? (
              <div className="space-y-4">
                <DetailRow label="Ticket Number" value={selectedTicket.ticket_number} />
                <DetailRow label="Driver Name" value={`${selectedTicket.first_name} ${selectedTicket.last_name}`} />
                <DetailRow label="Plate Number" value={selectedTicket.plate_number} mono />
                <DetailRow label="Location" value={selectedTicket.location} />
                <DetailRow label="Date Issued" value={selectedTicket.date_issued} />
                
                <div className="pt-4 border-t space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Amount Due</span>
                    <span className="text-xl font-bold">₱1,000.00</span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleUpdatePayment}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Payment
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a ticket to process payment
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPaymentHistory = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Payment History" 
        description="View all processed payments and collection records."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search payments..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {paidTickets.length === 0 ? (
            <EmptyState 
              title="No payment history" 
              description="Processed payments will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket No.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Plate No.</TableHead>
                  <TableHead>Date Paid</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidTickets.map((t) => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.date_issued}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        PAID
                      </span>
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

  const renderExportReports = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Export Reports" 
        description="Download comprehensive reports for record-keeping and analysis."
      />

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Collection Summary</CardTitle>
            <CardDescription>Total fines collected with breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-medium">{paidTickets.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{pendingTickets.length}</span>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => toast.info("Report export feature coming soon!")}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Violation Report</CardTitle>
            <CardDescription>All violations by type and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tickets</span>
                <span className="font-medium">{tickets.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Open</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => toast.info("Report export feature coming soon!")}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Report</CardTitle>
            <CardDescription>Today's transactions summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Today's Collections</span>
                <span className="font-medium">{stats.todayCollections}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => toast.info("Report export feature coming soon!")}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      user={user}
      roleName="lgu-staff"
      roleLabel="LGU Staff"
      menuItems={menuItems}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      onRefresh={fetchData}
      loading={loading}
    >
      {activeMenu === "dashboard" && renderDashboard()}
      {activeMenu === "process-payment" && renderProcessPayment()}
      {activeMenu === "payment-history" && renderPaymentHistory()}
      {activeMenu === "export-reports" && renderExportReports()}
    </DashboardLayout>
  );
}

// Helper Components
function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default LGUStaff;
