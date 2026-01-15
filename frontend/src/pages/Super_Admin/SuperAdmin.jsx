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
  LayoutDashboard, Users, Database, Settings, History,
  Plus, Edit, Trash2, Save, X, CheckCircle, AlertTriangle,
  HardDrive, RefreshCw, Search
} from "lucide-react";

function SuperAdmin() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [backupHistory, setBackupHistory] = useState([]);
  const [dbStatus, setDbStatus] = useState({ version: "Loading...", size_bytes: 0 });
  const [threshold, setThreshold] = useState(12);
  
  // UI states
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    const authUser = localStorage.getItem("authUser");
    if (!authUser) return navigate("/login");
    setUser(JSON.parse(authUser));
    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uRes, aRes, bRes, sRes, cRes] = await Promise.all([
        fetch("http://localhost:3000/api/users", { headers }),
        fetch("http://localhost:3000/api/audit", { headers }),
        fetch("http://localhost:3000/api/backup/history", { headers }),
        fetch("http://localhost:3000/api/system/db/status", { headers }),
        fetch("http://localhost:3000/api/system/config/demerit_threshold", { headers })
      ]);

      const uData = await uRes.json();
      const aData = await aRes.json();
      const bData = await bRes.json();
      const sData = await sRes.json();
      const cData = await cRes.json();

      setUsersList(uData.data || []);
      setAuditLogs(aData.data || []);
      setBackupHistory(bData.data || []);
      setDbStatus(sData.data || { version: "Unknown", size_bytes: 0 });
      if (cData.data?.value) setThreshold(parseInt(cData.data.value));
    } catch (err) {
      console.error("Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const username = prompt("Enter Username:");
    if (!username) return;
    
    try {
      const res = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers,
        body: JSON.stringify({ username, password: "password123", role_id: 2 })
      });
      if (res.ok) {
        toast.success("User created successfully!");
        fetchAllData();
      }
    } catch (err) {
      toast.error("Error creating user");
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/backup", {
        method: "POST",
        headers,
        body: JSON.stringify({ status: "SUCCESS", notes: "Manual backup from Dashboard" })
      });
      if (res.ok) {
        toast.success("Database backup completed!");
        fetchAllData();
      }
    } catch (err) {
      toast.error("Backup failed");
    } finally {
      setLoading(false);
    }
  };

  const saveThreshold = async () => {
    try {
      await fetch("http://localhost:3000/api/system/config/demerit_threshold", {
        method: "PUT",
        headers,
        body: JSON.stringify({ value: threshold, description: "Demerit points limit" })
      });
      toast.success("Configuration saved!");
    } catch (err) {
      toast.error("Save failed");
    }
  };

  // Filter users
  const filteredUsers = usersList.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    totalUsers: usersList.length,
    activeUsers: usersList.filter(u => u.is_active !== false).length,
    totalLogs: auditLogs.length,
    backups: backupHistory.length
  };

  const roleLabels = {
    1: "Super Admin",
    2: "Officer",
    3: "Auditor",
    4: "LGU Admin",
    5: "LGU Staff"
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "users", label: "User Management", icon: <Users size={18} /> },
    { key: "database", label: "Database", icon: <Database size={18} /> },
    { key: "config", label: "System Config", icon: <Settings size={18} /> },
    { key: "logs", label: "Access Logs", icon: <History size={18} /> },
  ];

  // === RENDER SECTIONS ===

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Super Admin Dashboard" 
        description="System overview, user management, and database administration."
      />

      {/* Database Status */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Engine Version</span>
              <span className="text-lg font-semibold">{dbStatus.version}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Storage Usage</span>
              <span className="text-lg font-semibold">{(dbStatus.size_bytes / 1024).toFixed(2)} KB</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Connection</span>
              <span className="text-lg font-semibold text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Online
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard title="Active Users" value={stats.activeUsers} icon={CheckCircle} />
        <StatCard title="Audit Logs" value={stats.totalLogs} icon={History} />
        <StatCard title="Backups" value={stats.backups} icon={HardDrive} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("users")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Manage Users
            </CardTitle>
            <CardDescription>Add, edit, or deactivate user accounts</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("database")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-primary" />
              Database Operations
            </CardTitle>
            <CardDescription>Backup, restore, and monitor database health</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest access and modification logs</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <EmptyState 
              title="No activity recorded" 
              description="System events will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.slice(0, 5).map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{log.user_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.ip_address || "—"}</TableCell>
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

  const renderUserManagement = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="User Management" 
        description="Create, edit, and manage system user accounts."
        actions={
          <div className="flex gap-2">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateUser}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {filteredUsers.length === 0 ? (
            <EmptyState 
              title="No users found" 
              description={searchQuery ? "Try a different search term." : "Add users to get started."}
              actionLabel="Add User"
              onAction={handleCreateUser}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                        {roleLabels[u.role_id] || `Role ${u.role_id}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.is_active !== false 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {u.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditingUser(u)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md animate-in zoom-in-95">
            <CardHeader>
              <CardTitle>Edit User: {editingUser.username}</CardTitle>
              <CardDescription>Modify user details or role assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={editingUser.username} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="user@example.com" defaultValue={editingUser.email} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select className="w-full h-10 px-3 border rounded-md bg-background" defaultValue={editingUser.role_id}>
                  <option value="1">Super Admin</option>
                  <option value="2">Officer</option>
                  <option value="3">Auditor</option>
                  <option value="4">LGU Admin</option>
                  <option value="5">LGU Staff</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => { toast.info("User update feature coming soon!"); setEditingUser(null); }}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderDatabaseManagement = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Database Management" 
        description="Backup, restore, and monitor database operations."
      />

      {/* Database Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" />
              Backup Database
            </CardTitle>
            <CardDescription>Create a full database backup</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackup} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 mr-2" />
                  Execute Backup Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Restore Database
            </CardTitle>
            <CardDescription>Restore from a previous backup</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Restoration Locked
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Previous database backup records</CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <EmptyState 
              title="No backups yet" 
              description="Create your first backup to see it here."
              actionLabel="Create Backup"
              onAction={handleBackup}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupHistory.map((b) => (
                  <TableRow key={b.backup_id}>
                    <TableCell className="font-medium">{b.action || "BACKUP"}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.notes || "—"}</TableCell>
                    <TableCell className="text-right text-sm">
                      {new Date(b.started_at).toLocaleString()}
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

  const renderSystemConfig = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="System Configuration" 
        description="Manage system-wide settings and parameters."
      />

      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Demerit Points Threshold</CardTitle>
            <CardDescription>
              Maximum demerit points before license suspension. Current regulations suggest 12 points.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="w-12 h-12 rounded-full text-xl"
                  onClick={() => setThreshold(Math.max(0, threshold - 1))}
                >
                  −
                </Button>
                <input 
                  type="number"
                  min="0"
                  max="99"
                  value={threshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 99) {
                      setThreshold(val);
                    } else if (e.target.value === '') {
                      setThreshold(0);
                    }
                  }}
                  className="w-28 h-20 text-center text-4xl font-bold bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  className="w-12 h-12 rounded-full text-xl"
                  onClick={() => setThreshold(Math.min(99, threshold + 1))}
                >
                  +
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">points</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[6, 12, 18].map(val => (
                <Button 
                  key={val} 
                  variant={threshold === val ? "secondary" : "outline"} 
                  onClick={() => setThreshold(val)}
                >
                  {val} Points
                </Button>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setThreshold(12)} variant="outline" className="flex-1">
                Reset to Default
              </Button>
              <Button onClick={saveThreshold} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAccessLogs = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Access Logs" 
        description="Complete audit trail of system access and modifications."
      />

      <Card>
        <CardContent className="pt-6">
          {auditLogs.length === 0 ? (
            <EmptyState 
              title="No logs available" 
              description="System activity will be recorded here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{log.user_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.details || "—"}
                    </TableCell>
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

  return (
    <DashboardLayout
      user={user}
      roleName="superadmin"
      roleLabel="Super Admin"
      menuItems={menuItems}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      onRefresh={fetchAllData}
      loading={loading}
    >
      {activeMenu === "dashboard" && renderDashboard()}
      {activeMenu === "users" && renderUserManagement()}
      {activeMenu === "database" && renderDatabaseManagement()}
      {activeMenu === "config" && renderSystemConfig()}
      {activeMenu === "logs" && renderAccessLogs()}
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
    if (action?.includes("CREATE")) {
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

export default SuperAdmin;
