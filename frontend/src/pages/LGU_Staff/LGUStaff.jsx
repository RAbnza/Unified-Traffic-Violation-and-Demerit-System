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
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, DollarSign, FileDown, FileText,
  Search, Clock, CheckCircle, AlertTriangle, Download, Eye, CreditCard
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function LGUStaff() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Data states
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount_paid: "", payment_method: "CASH", receipt_number: "" });

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
      const res = await fetch(`${API_URL}/api/tickets`, { headers });
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `RCP-${timestamp}-${randomPart}`.toUpperCase();
  };

  const openPaymentDialog = (ticket) => {
    setSelectedTicket(ticket);
    // Pre-fill with the ticket's total fine amount
    const fineAmount = ticket.total_fine ? String(ticket.total_fine) : "0";
    setPaymentForm({ amount_paid: fineAmount, payment_method: "CASH", receipt_number: generateReceiptNumber() });
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedTicket) return;

    // Validate that payment amount matches fine amount exactly
    const fineAmount = parseFloat(selectedTicket.total_fine) || 0;
    const paymentAmount = parseFloat(paymentForm.amount_paid) || 0;

    if (paymentAmount !== fineAmount) {
      toast.error(`Payment must be exactly ₱${fineAmount.toFixed(2)}. Partial or excess payments are not allowed.`);
      return;
    }

    setLoading(true);
    try {
      // Generate a fresh receipt number to avoid duplicates on retry
      const freshReceiptNumber = generateReceiptNumber();

      // Create payment record (backend also updates ticket status to PAID)
      const paymentRes = await fetch(`${API_URL}/api/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          amount_paid: parseFloat(paymentForm.amount_paid),
          payment_method: paymentForm.payment_method,
          receipt_number: freshReceiptNumber,
          processed_by: user.user_id
        })
      });

      if (!paymentRes.ok) {
        const errData = await paymentRes.json();
        throw new Error(errData.error?.message || "Failed to create payment");
      }

      toast.success("Payment processed successfully!");
      setPaymentDialogOpen(false);
      setSelectedTicket(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
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

  // === CSV EXPORT FUNCTIONS ===
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCollectionSummary = () => {
    if (tickets.length === 0) {
      toast.error("No data available to export");
      return;
    }

    // Headers
    const headers = ['Ticket Number', 'Driver Name', 'Plate Number', 'Status', 'Total Fine', 'Date Issued', 'Payment Status'];

    // Rows
    const rows = tickets.map(t => [
      t.ticket_number || '',
      `${t.first_name || ''} ${t.last_name || ''}`.trim(),
      t.plate_number || '',
      t.status || '',
      t.total_fine ? `${parseFloat(t.total_fine).toFixed(2)}` : '0.00',
      t.date_issued ? new Date(t.date_issued).toLocaleDateString() : '',
      t.status === 'PAID' ? 'Paid' : 'Pending'
    ]);

    // Add summary section
    const summary = [
      [],
      ['=== COLLECTION SUMMARY ==='],
      ['Total Tickets', tickets.length],
      ['Paid Tickets', paidTickets.length],
      ['Pending Tickets', pendingTickets.length],
      ['Total Collected', `${paidTickets.reduce((sum, t) => sum + (parseFloat(t.total_fine) || 0), 0).toFixed(2)}`],
      ['Total Pending', `${pendingTickets.reduce((sum, t) => sum + (parseFloat(t.total_fine) || 0), 0).toFixed(2)}`],
      ['Report Generated', new Date().toLocaleString()]
    ];

    // Build CSV content
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ...summary.map(row => row.join(','))
    ];

    const csvContent = csvRows.join('\n');
    const filename = `collection_summary_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
    toast.success(`Collection summary exported as ${filename}`);
  };

  const exportViolationReport = () => {
    if (tickets.length === 0) {
      toast.error("No data available to export");
      return;
    }

    // Headers
    const headers = ['Ticket Number', 'Driver Name', 'License Number', 'Plate Number', 'Violation Details', 'Status', 'Total Fine', 'Date Issued', 'Location'];

    // Rows
    const rows = tickets.map(t => [
      t.ticket_number || '',
      `${t.first_name || ''} ${t.last_name || ''}`.trim(),
      t.license_number || '',
      t.plate_number || '',
      t.violation_names || t.violation_details || '',
      t.status || '',
      t.total_fine ? `${parseFloat(t.total_fine).toFixed(2)}` : '0.00',
      t.date_issued ? new Date(t.date_issued).toLocaleDateString() : '',
      t.location || ''
    ]);

    // Add summary
    const summary = [
      [],
      ['=== VIOLATION REPORT SUMMARY ==='],
      ['Total Violations', tickets.length],
      ['Open Tickets', pendingTickets.length],
      ['Paid Tickets', paidTickets.length],
      ['Report Generated', new Date().toLocaleString()]
    ];

    // Build CSV content
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ...summary.map(row => row.join(','))
    ];

    const csvContent = csvRows.join('\n');
    const filename = `violation_report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
    toast.success(`Violation report exported as ${filename}`);
  };

  const exportDailyReport = () => {
    const today = new Date().toDateString();
    const todayTickets = tickets.filter(t => new Date(t.date_issued).toDateString() === today);
    const todayPaid = todayTickets.filter(t => t.status === 'PAID');
    const todayPending = todayTickets.filter(t => t.status === 'OPEN');

    // Headers
    const headers = ['Ticket Number', 'Driver Name', 'Plate Number', 'Status', 'Total Fine', 'Time Issued'];

    // Rows
    const rows = todayTickets.map(t => [
      t.ticket_number || '',
      `${t.first_name || ''} ${t.last_name || ''}`.trim(),
      t.plate_number || '',
      t.status || '',
      t.total_fine ? `${parseFloat(t.total_fine).toFixed(2)}` : '0.00',
      t.date_issued ? new Date(t.date_issued).toLocaleTimeString() : ''
    ]);

    // Add summary
    const summary = [
      [],
      ['=== DAILY REPORT SUMMARY ==='],
      ['Date', new Date().toLocaleDateString()],
      ['Total Transactions Today', todayTickets.length],
      ['Paid Today', todayPaid.length],
      ['Pending Today', todayPending.length],
      ['Total Collected Today', `${todayPaid.reduce((sum, t) => sum + (parseFloat(t.total_fine) || 0), 0).toFixed(2)}`],
      ['Report Generated', new Date().toLocaleString()]
    ];

    // Build CSV content
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ...summary.map(row => row.join(','))
    ];

    const csvContent = csvRows.join('\n');
    const filename = `daily_report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
    toast.success(`Daily report exported as ${filename}`);
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
                  <TableHead>Violation</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Plate No.</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTickets.slice(0, 5).map((t) => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate" title={t.violation_names}>{t.violation_names || '—'}</TableCell>
                    <TableCell className="font-medium text-primary">₱{t.total_fine ? Number(t.total_fine).toLocaleString() : '0'}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.plate_number}</TableCell>
                    <TableCell className="text-sm">{t.officer_first_name || t.issued_by_username || '—'} {t.officer_last_name || ''}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => openPaymentDialog(t)}
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
                    <TableHead>Violation</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Issued By</TableHead>
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
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{t.ticket_number}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate" title={t.violation_names}>{t.violation_names || '—'}</TableCell>
                      <TableCell className="font-medium text-primary">₱{t.total_fine ? Number(t.total_fine).toLocaleString() : '0'}</TableCell>
                      <TableCell>{t.first_name} {t.last_name}</TableCell>
                      <TableCell className="text-sm">{t.officer_first_name || t.issued_by_username || '—'} {t.officer_last_name || ''}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => openPaymentDialog(t)}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
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

        {/* Stats Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="text-xl font-bold text-yellow-600">{pendingTickets.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm text-muted-foreground">Paid Today</span>
              <span className="text-xl font-bold text-green-600">{stats.todayCollections}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Total Paid</span>
              <span className="text-xl font-bold">{paidTickets.length}</span>
            </div>
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
                  <TableHead>Violation</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Processed By</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidTickets.map((t) => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-medium">{t.ticket_number}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate" title={t.violation_names}>{t.violation_names || '—'}</TableCell>
                    <TableCell className="font-medium text-primary">₱{t.total_fine ? Number(t.total_fine).toLocaleString() : '0'}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="text-sm">{t.officer_first_name || t.issued_by_username || '—'} {t.officer_last_name || ''}</TableCell>
                    <TableCell className="text-sm">{t.payment_method || '—'}</TableCell>
                    <TableCell className="text-sm">{t.processed_by_first_name || t.processed_by_username || '—'} {t.processed_by_last_name || ''}</TableCell>
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
              <Button variant="outline" className="w-full mt-4" onClick={exportCollectionSummary}>
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
              <Button variant="outline" className="w-full mt-4" onClick={exportViolationReport}>
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
              <Button variant="outline" className="w-full mt-4" onClick={exportDailyReport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
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

      {/* Payment Processing Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>Record payment for ticket {selectedTicket?.ticket_number}</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Driver:</span></div>
                  <div className="font-medium">{selectedTicket.first_name} {selectedTicket.last_name}</div>
                  <div><span className="text-muted-foreground">Plate:</span></div>
                  <div className="font-mono">{selectedTicket.plate_number}</div>
                  <div><span className="text-muted-foreground">Violation:</span></div>
                  <div className="font-medium text-orange-600">{selectedTicket.violation_names || 'No violation'}</div>
                  <div><span className="text-muted-foreground">Location:</span></div>
                  <div>{selectedTicket.location}</div>
                  <div><span className="text-muted-foreground">Date:</span></div>
                  <div>{new Date(selectedTicket.date_issued)
                    .toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                    })
                    .replace(/\//g, '-') // Swaps slashes for dashes
                  }</div>
                  <div><span className="text-muted-foreground">Issued By:</span></div>
                  <div>{selectedTicket.officer_first_name || selectedTicket.issued_by_username || '—'} {selectedTicket.officer_last_name || ''}</div>
                </div>
              </div>

              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Required Fine Amount</span>
                  <span className="text-2xl font-bold text-primary">₱{selectedTicket.total_fine ? Number(selectedTicket.total_fine).toLocaleString() : '0'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Payment must be exactly this amount. Partial or excess payments are not allowed.</p>
              </div>

              <div className="space-y-2">
                <Label>Payment Amount (₱)</Label>
                <Input
                  type="number"
                  value={paymentForm.amount_paid}
                  onChange={e => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                  placeholder="Enter exact fine amount"
                  className={parseFloat(paymentForm.amount_paid) !== parseFloat(selectedTicket.total_fine || 0) ? "border-orange-500" : "border-green-500"}
                />
                {parseFloat(paymentForm.amount_paid) !== parseFloat(selectedTicket.total_fine || 0) && (
                  <p className="text-xs text-orange-600">⚠️ Amount must match the required fine exactly</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select
                  className="w-full h-10 px-3 border rounded-md bg-background"
                  value={paymentForm.payment_method}
                  onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="GCASH">GCash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Receipt Number</Label>
                <Input
                  value={paymentForm.receipt_number}
                  onChange={e => setPaymentForm({ ...paymentForm, receipt_number: e.target.value })}
                  placeholder="RCP-XXXXXXXXX"
                />
              </div>

              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-primary">₱{paymentForm.amount_paid || "0"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleProcessPayment} disabled={loading}>
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? "Processing..." : "Confirm Payment"}
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

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default LGUStaff;
