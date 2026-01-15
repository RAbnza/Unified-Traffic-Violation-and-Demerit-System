import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/common/DashboardLayout";
import StatCard from "@/components/common/StatCard";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LayoutDashboard, UserCheck, History, FileSearch, 
  Activity, Shield, AlertTriangle, Search, Filter
} from "lucide-react";

function Auditor() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const token = localStorage.getItem("authToken");
  const headers = { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}` 
  };

  useEffect(() => {
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      setUser(JSON.parse(authUser));
      fetchLogs();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/audit", { headers });
      const result = await res.json();
      setLogs(result.data || []);
    } catch (err) {
      console.error("Audit log fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search and action type
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.affected_table?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterAction === "all" || 
      (filterAction === "login" && (log.action?.includes("LOGIN") || log.action === "LOGOUT")) ||
      (filterAction === "data" && log.affected_table);

    return matchesSearch && matchesFilter;
  });

  // Separate activity types
  const loginLogs = logs.filter(l => l.action?.includes("LOGIN") || l.action === "LOGOUT");
  const dataLogs = logs.filter(l => l.affected_table);

  // Calculate stats
  const stats = {
    totalLogs: logs.length,
    loginEvents: loginLogs.length,
    dataChanges: dataLogs.length,
    todayEvents: logs.filter(l => {
      const today = new Date().toDateString();
      return new Date(l.timestamp).toDateString() === today;
    }).length
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "user-activity", label: "User Activity", icon: <UserCheck size={18} /> },
    { key: "audit-logs", label: "Audit Trail", icon: <History size={18} /> },
    { key: "security-events", label: "Security Events", icon: <Shield size={18} /> },
  ];

  // === RENDER SECTIONS ===

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Auditor Dashboard" 
        description="Monitor system activity, track user actions, and review security events."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={stats.totalLogs} icon={Activity} />
        <StatCard title="Login Events" value={stats.loginEvents} icon={UserCheck} description="Authentication logs" />
        <StatCard title="Data Changes" value={stats.dataChanges} icon={History} description="CRUD operations" />
        <StatCard title="Today's Activity" value={stats.todayEvents} icon={AlertTriangle} description="Events today" />
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("user-activity")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="w-5 h-5 text-primary" />
              User Activity Logs
            </CardTitle>
            <CardDescription>Track user logins, logouts, and session activity</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("audit-logs")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-primary" />
              Audit Trail
            </CardTitle>
            <CardDescription>View all database modifications and system changes</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest events across the system</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState 
              title="No activity recorded" 
              description="System events will appear here once there's user activity."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 8).map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{log.user_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.details || log.affected_table || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
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

  const renderUserActivity = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="User Activity Logs" 
        description="Track all user authentication events including logins, logouts, and failed attempts."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search activity..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Logins" value={loginLogs.filter(l => l.action?.includes("LOGIN")).length} icon={UserCheck} />
        <StatCard title="Total Logouts" value={loginLogs.filter(l => l.action === "LOGOUT").length} icon={Activity} />
        <StatCard title="Failed Attempts" value={loginLogs.filter(l => l.action === "LOGIN_FAILED").length} icon={AlertTriangle} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loginLogs.length === 0 ? (
            <EmptyState 
              title="No login activity" 
              description="User authentication events will appear here."
              icon={UserCheck}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{log.user_id}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.ip_address || "0.0.0.0"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.details || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {new Date(log.timestamp).toLocaleString()}
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

  const renderAuditLogs = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Audit Trail" 
        description="Complete record of all data modifications and system changes."
        actions={
          <div className="flex gap-2">
            <select 
              className="h-10 px-3 border rounded-md bg-background text-sm"
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="login">Login Events</option>
              <option value="data">Data Changes</option>
            </select>
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {filteredLogs.length === 0 ? (
            <EmptyState 
              title="No audit records" 
              description={searchQuery ? "Try adjusting your search." : "Database changes will be recorded here."}
              icon={History}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Affected Table</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell>
                      {log.affected_table ? (
                        <span className="px-2 py-1 rounded bg-muted text-xs font-mono uppercase">
                          {log.affected_table}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{log.user_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.details || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {new Date(log.timestamp).toLocaleString()}
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

  const renderSecurityEvents = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Security Events" 
        description="Monitor security-related events and potential threats."
      />

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Failed Logins" 
          value={logs.filter(l => l.action === "LOGIN_FAILED").length} 
          icon={AlertTriangle}
          description="Unauthorized attempts"
        />
        <StatCard 
          title="Password Changes" 
          value={logs.filter(l => l.action?.includes("PASSWORD")).length} 
          icon={Shield}
          description="Credential updates"
        />
        <StatCard 
          title="Admin Actions" 
          value={logs.filter(l => l.action?.includes("ADMIN") || l.action?.includes("CREATE") || l.action?.includes("DELETE")).length} 
          icon={FileSearch}
          description="Privileged operations"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Event Log</CardTitle>
          <CardDescription>Focus on authentication failures and sensitive operations</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.filter(l => 
            l.action === "LOGIN_FAILED" || 
            l.action?.includes("DELETE") || 
            l.action?.includes("PASSWORD")
          ).length === 0 ? (
            <EmptyState 
              title="No security alerts" 
              description="Security events like failed logins will appear here."
              icon={Shield}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs
                  .filter(l => 
                    l.action === "LOGIN_FAILED" || 
                    l.action?.includes("DELETE") || 
                    l.action?.includes("PASSWORD")
                  )
                  .map((log) => (
                    <TableRow key={log.log_id}>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">#{log.user_id}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {log.ip_address || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.details || "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {new Date(log.timestamp).toLocaleString()}
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
      roleName="auditor"
      roleLabel="System Auditor"
      menuItems={menuItems}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      onRefresh={fetchLogs}
      loading={loading}
    >
      {activeMenu === "dashboard" && renderDashboard()}
      {activeMenu === "user-activity" && renderUserActivity()}
      {activeMenu === "audit-logs" && renderAuditLogs()}
      {activeMenu === "security-events" && renderSecurityEvents()}
    </DashboardLayout>
  );
}

// Action Badge Component
function ActionBadge({ action }) {
  const getStyle = () => {
    if (action?.includes("LOGIN") && !action?.includes("FAILED")) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    if (action === "LOGOUT") {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
    if (action?.includes("FAILED") || action?.includes("DELETE")) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    if (action?.includes("CREATE") || action?.includes("INSERT")) {
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    }
    if (action?.includes("UPDATE")) {
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  };

  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStyle()}`}>
      {action}
    </span>
  );
}

export default Auditor;
