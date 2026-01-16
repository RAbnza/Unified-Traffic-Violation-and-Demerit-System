import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/common/DashboardLayout";
import StatCard from "@/components/common/StatCard";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, UserCheck, History, FileSearch, 
  Activity, Shield, AlertTriangle, Search
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Auditor() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allLogs, setAllLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
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
      fetchAllLogs();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchAllLogs = async () => {
    setLoading(true);
    try {
      // Fetch all log types in parallel
      const [allRes, activityRes, auditRes, securityRes] = await Promise.all([
        fetch(`${API_URL}/api/audit?pageSize=100`, { headers }),
        fetch(`${API_URL}/api/audit?type=activity&pageSize=100`, { headers }),
        fetch(`${API_URL}/api/audit?type=audit&pageSize=100`, { headers }),
        fetch(`${API_URL}/api/audit?type=security&pageSize=100`, { headers })
      ]);
      
      const [allData, activityData, auditData, securityData] = await Promise.all([
        allRes.json(),
        activityRes.json(),
        auditRes.json(),
        securityRes.json()
      ]);
      
      setAllLogs(allData.data || []);
      setActivityLogs(activityData.data || []);
      setAuditLogs(auditData.data || []);
      setSecurityLogs(securityData.data || []);
    } catch (err) {
      console.error("Audit log fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search
  const filterBySearch = (logs) => logs.filter(log => {
    const searchLower = searchQuery.toLowerCase();
    return !searchQuery || 
      log.action?.toLowerCase().includes(searchLower) ||
      log.details?.toLowerCase().includes(searchLower) ||
      log.username?.toLowerCase().includes(searchLower) ||
      log.first_name?.toLowerCase().includes(searchLower) ||
      log.last_name?.toLowerCase().includes(searchLower) ||
      log.affected_table?.toLowerCase().includes(searchLower);
  });

  // Calculate stats
  const stats = {
    totalLogs: allLogs.length,
    loginEvents: activityLogs.length,
    dataChanges: auditLogs.length,
    securityEvents: securityLogs.length,
    todayEvents: allLogs.filter(l => {
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
        <StatCard title="User Activity" value={stats.loginEvents} icon={UserCheck} description="Login/logout events" />
        <StatCard title="Data Changes" value={stats.dataChanges} icon={History} description="CRUD operations" />
        <StatCard title="Security Events" value={stats.securityEvents} icon={Shield} description="Security alerts" />
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("security-events")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-red-500" />
              Security Events
            </CardTitle>
            <CardDescription>Monitor failed logins, deletions, and password changes</CardDescription>
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
          {allLogs.length === 0 ? (
            <EmptyState 
              title="No activity recorded" 
              description="System events will appear here once there's user activity."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLogs.slice(0, 8).map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.first_name ? `${log.first_name} ${log.last_name}` : `#${log.user_id || '—'}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.role_name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.affected_table ? `${log.affected_table} #${log.affected_table_id}` : (log.details || "—")}
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

  const renderUserActivity = () => {
    const filteredActivityLogs = filterBySearch(activityLogs);
    const successLogins = activityLogs.filter(l => l.action === "LOGIN_SUCCESS" || l.action === "LOGIN").length;
    const logouts = activityLogs.filter(l => l.action === "LOGOUT").length;
    const failedLogins = activityLogs.filter(l => l.action === "LOGIN_FAILED").length;
    
    return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="User Activity Logs" 
        description="Track all user authentication events including logins, logouts, and session activity."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or username..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Successful Logins" value={successLogins} icon={UserCheck} description="Authenticated sessions" />
        <StatCard title="Logouts" value={logouts} icon={Activity} description="Session ended" />
        <StatCard title="Failed Attempts" value={failedLogins} icon={AlertTriangle} description="Authentication failures" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Events</CardTitle>
          <CardDescription>User login and logout activity across the system</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivityLogs.length === 0 ? (
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
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivityLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{log.first_name ? `${log.first_name} ${log.last_name}` : '—'}</span>
                        <span className="text-xs text-muted-foreground">@{log.username || `ID: ${log.user_id}`}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{log.role_name || '—'}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.ip_address || "—"}
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
  };

  const renderAuditLogs = () => {
    const filteredAuditLogs = filterBySearch(auditLogs);
    const createOps = auditLogs.filter(l => l.action?.includes("CREATE")).length;
    const updateOps = auditLogs.filter(l => l.action?.includes("UPDATE")).length;
    const deleteOps = auditLogs.filter(l => l.action?.includes("DELETE")).length;
    
    return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Audit Trail" 
        description="Complete record of all data modifications - created, updated, and deleted records."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by table or user..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Records Created" value={createOps} icon={Activity} description="New entries added" />
        <StatCard title="Records Updated" value={updateOps} icon={History} description="Modifications made" />
        <StatCard title="Records Deleted" value={deleteOps} icon={AlertTriangle} description="Entries removed" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Change History</CardTitle>
          <CardDescription>All CRUD operations performed on database tables</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAuditLogs.length === 0 ? (
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
                  <TableHead>Table</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuditLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded bg-muted text-xs font-mono uppercase">
                        {log.affected_table || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{log.affected_table_id || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {log.first_name ? `${log.first_name} ${log.last_name}` : `#${log.user_id || '—'}`}
                    </TableCell>
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
  };

  const renderSecurityEvents = () => {
    const filteredSecurityLogs = filterBySearch(securityLogs);
    const failedLogins = securityLogs.filter(l => l.action === "LOGIN_FAILED").length;
    const passwordChanges = securityLogs.filter(l => l.action?.includes("PASSWORD")).length;
    const deletions = securityLogs.filter(l => l.action?.includes("DELETE")).length;
    
    // Severity classification function
    const getSeverity = (log) => {
      // HIGH: Failed logins (potential brute force), User/Role deletions (privilege removal), Multiple failed attempts
      if (log.action === "LOGIN_FAILED") return { level: "HIGH", reason: "Failed authentication attempt - potential unauthorized access" };
      if (log.action === "USER_DELETE") return { level: "HIGH", reason: "User account permanently removed from system" };
      if (log.action === "ROLE_DELETE") return { level: "HIGH", reason: "System role removed - affects access control" };
      if (log.action?.includes("DELETE") && (log.affected_table === "User" || log.affected_table === "Role")) 
        return { level: "HIGH", reason: "Critical system data removed" };
      
      // MEDIUM: Regular data deletions, Password changes
      if (log.action?.includes("DELETE")) return { level: "MEDIUM", reason: "Data record permanently deleted" };
      if (log.action?.includes("PASSWORD")) return { level: "MEDIUM", reason: "User credentials modified" };
      if (log.action?.includes("ROLE") && log.action?.includes("UPDATE")) return { level: "MEDIUM", reason: "Role permissions modified" };
      
      // LOW: Other security-related events
      return { level: "LOW", reason: "Standard security event logged" };
    };
    
    const highCount = filteredSecurityLogs.filter(l => getSeverity(l).level === "HIGH").length;
    const mediumCount = filteredSecurityLogs.filter(l => getSeverity(l).level === "MEDIUM").length;
    const lowCount = filteredSecurityLogs.filter(l => getSeverity(l).level === "LOW").length;
    
    return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Security Events" 
        description="Monitor security-related events including failed logins, password changes, and data deletions."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search security events..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="High Severity" 
          value={highCount} 
          icon={AlertTriangle}
          description="Requires immediate attention"
        />
        <StatCard 
          title="Medium Severity" 
          value={mediumCount} 
          icon={Shield}
          description="Should be reviewed"
        />
        <StatCard 
          title="Low Severity" 
          value={lowCount} 
          icon={FileSearch}
          description="Informational events"
        />
      </div>

      {/* Severity Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Severity Classification Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <Badge variant="destructive" className="mt-0.5">HIGH</Badge>
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Critical Security Risk</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <li>• Failed login attempts (potential brute force)</li>
                  <li>• User account deletions</li>
                  <li>• Role/permission removals</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
              <Badge variant="warning" className="mt-0.5">MEDIUM</Badge>
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-400">Needs Review</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <li>• Password changes</li>
                  <li>• Data record deletions</li>
                  <li>• Role permission updates</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <Badge variant="secondary" className="mt-0.5">LOW</Badge>
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-400">Informational</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <li>• Standard security logging</li>
                  <li>• Routine system events</li>
                  <li>• Non-critical changes</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Event Log</CardTitle>
          <CardDescription>Failed authentication attempts, password changes, and destructive operations</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSecurityLogs.length === 0 ? (
            <EmptyState 
              title="No security alerts" 
              description="Security events like failed logins will appear here."
              icon={Shield}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecurityLogs.map((log) => {
                    const severity = getSeverity(log);
                    const rowClass = severity.level === "HIGH" ? "bg-red-50 dark:bg-red-950/20" : 
                                     severity.level === "MEDIUM" ? "bg-yellow-50 dark:bg-yellow-950/10" : "";
                    return (
                    <TableRow key={log.log_id} className={rowClass}>
                      <TableCell>
                        <Badge variant={severity.level === "HIGH" ? "destructive" : severity.level === "MEDIUM" ? "warning" : "secondary"}>
                          {severity.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{log.first_name ? `${log.first_name} ${log.last_name}` : '—'}</span>
                          <span className="text-xs text-muted-foreground">{log.role_name || `ID: ${log.user_id || '—'}`}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {log.ip_address || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.affected_table ? `${log.affected_table} #${log.affected_table_id}` : (log.details || "—")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[180px]">
                        {severity.reason}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {new Date(log.timestamp).toLocaleString()}
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

  return (
    <DashboardLayout
      user={user}
      roleName="auditor"
      roleLabel="System Auditor"
      menuItems={menuItems}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      onRefresh={fetchAllLogs}
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
  const getVariant = () => {
    if (action?.includes("LOGIN") && !action?.includes("FAILED")) return "success";
    if (action === "LOGOUT") return "secondary";
    if (action?.includes("FAILED") || action?.includes("DELETE")) return "destructive";
    if (action?.includes("CREATE") || action?.includes("INSERT")) return "default";
    if (action?.includes("UPDATE")) return "warning";
    return "outline";
  };

  return <Badge variant={getVariant()}>{action}</Badge>;
}

export default Auditor;
