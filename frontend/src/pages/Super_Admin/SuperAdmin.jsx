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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, Users, Database, Settings, History,
  Plus, Edit, Trash2, Save, CheckCircle, AlertTriangle,
  HardDrive, RefreshCw, Search, Eye, EyeOff, MapPin,
  Download, Upload, Shield, UserCheck, Activity, FileSearch,
  Clock, Play, Pause, File
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function SuperAdmin() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [lguList, setLguList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [auditTrailLogs, setAuditTrailLogs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [backupHistory, setBackupHistory] = useState([]);
  const [dbStatus, setDbStatus] = useState({ version: "Loading...", size_bytes: 0 });
  const [threshold, setThreshold] = useState(12);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [activeLogTab, setActiveLogTab] = useState("all");
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  
  // Auto backup states
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState(24);
  const [backupFiles, setBackupFiles] = useState([]);
  const [autoBackupLoading, setAutoBackupLoading] = useState(false);
  
  // User Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: "", password: "", first_name: "", last_name: "",
    email: "", contact_number: "", role_id: "", lgu_id: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // LGU Dialog states
  const [lguDialogOpen, setLguDialogOpen] = useState(false);
  const [editingLgu, setEditingLgu] = useState(null);
  const [lguForm, setLguForm] = useState({
    name: "", province: "", region: "", contact_email: "", contact_number: ""
  });

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
      const [uRes, rRes, lRes, aRes, actRes, audRes, secRes, bRes, sRes, cRes, autoRes, filesRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/roles`, { headers }),
        fetch(`${API_URL}/api/lgu`, { headers }),
        fetch(`${API_URL}/api/audit?pageSize=100`, { headers }),
        fetch(`${API_URL}/api/audit?type=activity&pageSize=100`, { headers }),
        fetch(`${API_URL}/api/audit?type=audit&pageSize=100`, { headers }),
        fetch(`${API_URL}/api/audit?type=security&pageSize=100`, { headers }),
        fetch(`${API_URL}/api/backup/history`, { headers }),
        fetch(`${API_URL}/api/system/db/status`, { headers }),
        fetch(`${API_URL}/api/system/config/demerit_threshold`, { headers }),
        fetch(`${API_URL}/api/backup/auto-settings`, { headers }),
        fetch(`${API_URL}/api/backup/files`, { headers })
      ]);

      const [uData, rData, lData, aData, actData, audData, secData, bData, sData, cData, autoData, filesData] = await Promise.all([
        uRes.json(), rRes.json(), lRes.json(), aRes.json(), actRes.json(), audRes.json(), secRes.json(), bRes.json(), sRes.json(), cRes.json(), autoRes.json(), filesRes.json()
      ]);

      setUsersList(uData.data || []);
      setRolesList(rData.data || []);
      setLguList(lData.data || []);
      setAuditLogs(aData.data || []);
      setActivityLogs(actData.data || []);
      setAuditTrailLogs(audData.data || []);
      setSecurityLogs(secData.data || []);
      setBackupHistory(bData.data || []);
      setDbStatus(sData.data || { version: "Unknown", size_bytes: 0 });
      if (cData.data?.value) setThreshold(parseInt(cData.data.value));
      if (autoData.data) {
        setAutoBackupEnabled(autoData.data.enabled || false);
        setAutoBackupInterval(autoData.data.interval_hours || 24);
      }
      setBackupFiles(filesData.data || []);
    } catch (err) {
      console.error("Data Fetch Error:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // User CRUD Operations
  const openUserDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username || "", password: "",
        first_name: user.first_name || "", last_name: user.last_name || "",
        email: user.email || "", contact_number: user.contact_number || "",
        role_id: String(user.role_id || ""), lgu_id: user.lgu_id ? String(user.lgu_id) : ""
      });
    } else {
      setEditingUser(null);
      setUserForm({ username: "", password: "", first_name: "", last_name: "", email: "", contact_number: "", role_id: "", lgu_id: "" });
    }
    setShowPassword(false);
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (!userForm.username || !userForm.role_id) {
        toast.error("Username and Role are required");
        return;
      }
      if (!editingUser && !userForm.password) {
        toast.error("Password is required for new users");
        return;
      }

      const payload = {
        username: userForm.username,
        first_name: userForm.first_name || null,
        last_name: userForm.last_name || null,
        email: userForm.email || null,
        contact_number: userForm.contact_number || null,
        role_id: parseInt(userForm.role_id),
        lgu_id: userForm.lgu_id ? parseInt(userForm.lgu_id) : null
      };
      if (userForm.password) payload.password = userForm.password;

      const res = await fetch(
        editingUser ? `${API_URL}/api/users/${editingUser.user_id}` : `${API_URL}/api/users`,
        { method: editingUser ? "PUT" : "POST", headers, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to save user");

      toast.success(editingUser ? "User updated successfully!" : "User created successfully!");
      setUserDialogOpen(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDeleteUser = (user) => { setUserToDelete(user); setDeleteDialogOpen(true); };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${userToDelete.user_id}`, { method: "DELETE", headers });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error?.message || "Failed to delete user"); }
      toast.success("User deleted successfully!");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // LGU CRUD
  const openLguDialog = (lgu = null) => {
    if (lgu) {
      setEditingLgu(lgu);
      setLguForm({ name: lgu.name || "", province: lgu.province || "", region: lgu.region || "", contact_email: lgu.contact_email || "", contact_number: lgu.contact_number || "" });
    } else {
      setEditingLgu(null);
      setLguForm({ name: "", province: "", region: "", contact_email: "", contact_number: "" });
    }
    setLguDialogOpen(true);
  };

  const handleSaveLgu = async () => {
    try {
      if (!lguForm.name) { toast.error("LGU name is required"); return; }
      const res = await fetch(
        editingLgu ? `${API_URL}/api/lgu/${editingLgu.lgu_id}` : `${API_URL}/api/lgu`,
        { method: editingLgu ? "PUT" : "POST", headers, body: JSON.stringify(lguForm) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to save LGU");
      toast.success(editingLgu ? "LGU updated!" : "LGU created!");
      setLguDialogOpen(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/backup/generate`, { headers });
      if (!res.ok) throw new Error("Backup generation failed");
      
      // Get the SQL content as blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const a = document.createElement('a');
      a.href = url;
      a.download = `utvds_backup_${timestamp}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Backup downloaded successfully!");
      fetchAllData();
    } catch (err) { 
      toast.error("Backup failed: " + err.message); 
    } finally { 
      setBackupLoading(false); 
    }
  };

  const handleRestoreFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.sql')) {
        toast.error("Please select a .sql file");
        return;
      }
      setRestoreFile(file);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      toast.error("Please select a backup file");
      return;
    }
    
    setRestoreLoading(true);
    try {
      // Read file content
      const sqlContent = await restoreFile.text();
      
      const res = await fetch(`${API_URL}/api/backup/restore`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sqlContent })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error?.message || "Restore failed");
      
      if (data.data.errors_count > 0) {
        toast.warning(`Restore completed with ${data.data.errors_count} errors. ${data.data.statements_executed} statements executed.`);
      } else {
        toast.success(`Database restored successfully! ${data.data.statements_executed} statements executed.`);
      }
      
      setRestoreDialogOpen(false);
      setRestoreFile(null);
      fetchAllData();
    } catch (err) {
      toast.error("Restore failed: " + err.message);
    } finally {
      setRestoreLoading(false);
    }
  };

  const saveAutoBackupSettings = async () => {
    setAutoBackupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/backup/auto-settings`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ enabled: autoBackupEnabled, interval_hours: autoBackupInterval })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to save settings");
      toast.success(`Auto backup ${autoBackupEnabled ? 'enabled' : 'disabled'}. Interval: ${autoBackupInterval} hours`);
      fetchAllData();
    } catch (err) {
      toast.error("Failed to save auto backup settings: " + err.message);
    } finally {
      setAutoBackupLoading(false);
    }
  };

  const triggerAutoBackupNow = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/backup/auto-trigger`, { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Backup failed");
      toast.success(`Backup created: ${data.data.filename}`);
      fetchAllData();
    } catch (err) {
      toast.error("Backup failed: " + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const downloadBackupFile = async (filename) => {
    try {
      const res = await fetch(`${API_URL}/api/backup/files/${filename}`, { headers });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (err) {
      toast.error("Download failed: " + err.message);
    }
  };

  const deleteBackupFile = async (filename) => {
    if (!confirm(`Delete backup file: ${filename}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/backup/files/${filename}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Backup file deleted");
      fetchAllData();
    } catch (err) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const saveThreshold = async () => {
    try {
      const res = await fetch(`${API_URL}/api/system/config/demerit_threshold`, { method: "PUT", headers, body: JSON.stringify({ value: String(threshold), description: "Demerit points limit" }) });
      if (res.ok) toast.success("Configuration saved!"); else throw new Error("Save failed");
    } catch (err) { toast.error("Save failed"); }
  };

  const filteredUsers = usersList.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter logs by search query
  const filterLogsBySearch = (logs) => logs.filter(log => {
    if (!logSearchQuery) return true;
    const q = logSearchQuery.toLowerCase();
    return log.action?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.username?.toLowerCase().includes(q) ||
      log.first_name?.toLowerCase().includes(q) ||
      log.last_name?.toLowerCase().includes(q) ||
      log.affected_table?.toLowerCase().includes(q) ||
      log.ip_address?.toLowerCase().includes(q);
  });

  // Get current logs based on active tab
  const getCurrentLogs = () => {
    switch (activeLogTab) {
      case 'activity': return filterLogsBySearch(activityLogs);
      case 'audit': return filterLogsBySearch(auditTrailLogs);
      case 'security': return filterLogsBySearch(securityLogs);
      default: return filterLogsBySearch(auditLogs);
    }
  };

  const stats = { totalUsers: usersList.length, activeUsers: usersList.filter(u => u.is_active !== false).length, totalLogs: auditLogs.length, activityCount: activityLogs.length, securityCount: securityLogs.length, backups: backupHistory.length, lguCount: lguList.length };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "users", label: "User Management", icon: <Users size={18} /> },
    { key: "lgu", label: "LGU Management", icon: <MapPin size={18} /> },
    { key: "database", label: "Database", icon: <Database size={18} /> },
    { key: "config", label: "System Config", icon: <Settings size={18} /> },
    { key: "logs", label: "Access Logs", icon: <History size={18} /> },
  ];

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Super Admin Dashboard" description="System overview, user management, and database administration." />
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2"><Database className="w-4 h-4" />Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Engine Version</span><span className="text-lg font-semibold">{dbStatus.version}</span></div>
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Storage Usage</span><span className="text-lg font-semibold">{(dbStatus.size_bytes / 1024).toFixed(2)} KB</span></div>
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Connection</span><span className="text-lg font-semibold text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Online</span></div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard title="Active Users" value={stats.activeUsers} icon={CheckCircle} />
        <StatCard title="LGUs" value={stats.lguCount} icon={MapPin} />
        <StatCard title="Audit Logs" value={stats.totalLogs} icon={History} />
        <StatCard title="Backups" value={stats.backups} icon={HardDrive} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("users")}><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="w-5 h-5 text-primary" />Manage Users</CardTitle><CardDescription>Add, edit, or deactivate user accounts</CardDescription></CardHeader></Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("lgu")}><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MapPin className="w-5 h-5 text-primary" />Manage LGUs</CardTitle><CardDescription>Add and manage Local Government Units</CardDescription></CardHeader></Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveMenu("database")}><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Database className="w-5 h-5 text-primary" />Database Operations</CardTitle><CardDescription>Backup, restore, and monitor database</CardDescription></CardHeader></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent System Activity</CardTitle><CardDescription>Latest access and modification logs</CardDescription></CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? <EmptyState title="No activity recorded" description="System events will appear here." /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>User</TableHead><TableHead>IP Address</TableHead><TableHead className="text-right">Timestamp</TableHead></TableRow></TableHeader>
              <TableBody>
                {auditLogs.slice(0, 5).map(log => (
                  <TableRow key={log.log_id}>
                    <TableCell><ActionBadge action={log.action} /></TableCell>
                    <TableCell className="font-mono text-sm">#{log.user_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.ip_address || "—"}</TableCell>
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

  const renderUserManagement = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="User Management" description="Create, edit, and manage system user accounts." actions={
        <div className="flex gap-2">
          <div className="relative w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search users..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
          <Button onClick={() => openUserDialog()}><Plus className="w-4 h-4 mr-2" />Add User</Button>
        </div>
      } />
      <Card>
        <CardContent className="pt-6">
          {filteredUsers.length === 0 ? <EmptyState title="No users found" description={searchQuery ? "Try a different search term." : "Add users to get started."} actionLabel="Add User" onAction={() => openUserDialog()} /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>LGU</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredUsers.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}`.trim() : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{u.role_name || rolesList.find(r => r.role_id === u.role_id)?.role_name || `Role ${u.role_id}`}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lguList.find(l => l.lgu_id === u.lgu_id)?.name || "—"}</TableCell>
                    <TableCell><Badge variant={u.is_active !== false ? "success" : "secondary"}>{u.is_active !== false ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openUserDialog(u)}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => confirmDeleteUser(u)}><Trash2 className="w-4 h-4" /></Button>
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

  const renderLguManagement = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="LGU Management" description="Manage Local Government Units in the system." actions={<Button onClick={() => openLguDialog()}><Plus className="w-4 h-4 mr-2" />Add LGU</Button>} />
      <Card>
        <CardContent className="pt-6">
          {lguList.length === 0 ? <EmptyState title="No LGUs found" description="Add LGUs to assign users and tickets." actionLabel="Add LGU" onAction={() => openLguDialog()} /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Province</TableHead><TableHead>Region</TableHead><TableHead>Contact Email</TableHead><TableHead>Contact Number</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {lguList.map(lgu => (
                  <TableRow key={lgu.lgu_id}>
                    <TableCell className="font-medium">{lgu.name}</TableCell>
                    <TableCell>{lgu.province || "—"}</TableCell>
                    <TableCell>{lgu.region || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lgu.contact_email || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lgu.contact_number || "—"}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => openLguDialog(lgu)}><Edit className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderDatabaseManagement = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Database Management" description="Backup, restore, and monitor database operations." />
      
      {/* Database Status Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2"><Database className="w-4 h-4" />Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Engine Version</span><span className="text-lg font-semibold">{dbStatus.version}</span></div>
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Database</span><span className="text-lg font-semibold">{dbStatus.database || 'N/A'}</span></div>
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Storage Usage</span><span className="text-lg font-semibold">{(dbStatus.size_bytes / 1024).toFixed(2)} KB</span></div>
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Connection</span><span className="text-lg font-semibold text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Online</span></div>
          </div>
        </CardContent>
      </Card>
      
      {/* Backup and Restore Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5 text-primary" />Backup Database</CardTitle>
            <CardDescription>Export all database data to a downloadable SQL file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>This will generate a complete SQL dump of all tables including:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Users, Roles, and LGUs</li>
                <li>Drivers and Vehicles</li>
                <li>Tickets, Violations, and Payments</li>
                <li>System Configuration</li>
              </ul>
            </div>
            <Button onClick={handleBackup} disabled={backupLoading} className="w-full">
              {backupLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating Backup...</> : <><Download className="w-4 h-4 mr-2" />Download Backup</>}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-orange-500" />Restore Database</CardTitle>
            <CardDescription>Restore database from a previous backup file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800 dark:text-orange-200">Warning: Destructive Operation</p>
                  <p className="text-orange-700 dark:text-orange-300 mt-1">Restoring will overwrite existing data. Make sure to backup first!</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setRestoreDialogOpen(true)} variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
              <Upload className="w-4 h-4 mr-2" />Restore from Backup
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Automatic Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Automatic Backup</CardTitle>
          <CardDescription>Configure scheduled automatic backups stored in the database_backup folder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {autoBackupEnabled ? (
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Pause className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-medium">{autoBackupEnabled ? 'Auto Backup Active' : 'Auto Backup Disabled'}</p>
                <p className="text-sm text-muted-foreground">
                  {autoBackupEnabled ? `Running every ${autoBackupInterval} hours` : 'Enable to schedule automatic backups'}
                </p>
              </div>
            </div>
            <Button
              variant={autoBackupEnabled ? "destructive" : "default"}
              size="sm"
              onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
            >
              {autoBackupEnabled ? <><Pause className="w-4 h-4 mr-2" />Disable</> : <><Play className="w-4 h-4 mr-2" />Enable</>}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Backup Interval</Label>
              <Select value={String(autoBackupInterval)} onValueChange={v => setAutoBackupInterval(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 hour</SelectItem>
                  <SelectItem value="6">Every 6 hours</SelectItem>
                  <SelectItem value="12">Every 12 hours</SelectItem>
                  <SelectItem value="24">Every 24 hours (Daily)</SelectItem>
                  <SelectItem value="48">Every 48 hours</SelectItem>
                  <SelectItem value="168">Every 168 hours (Weekly)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={saveAutoBackupSettings} disabled={autoBackupLoading} className="flex-1">
                {autoBackupLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Settings
              </Button>
              <Button variant="outline" onClick={triggerAutoBackupNow} disabled={backupLoading}>
                <Play className="w-4 h-4 mr-2" />Run Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Saved Backup Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><File className="w-5 h-5" />Saved Backup Files</CardTitle>
          <CardDescription>Backup files stored in the database_backup folder</CardDescription>
        </CardHeader>
        <CardContent>
          {backupFiles.length === 0 ? (
            <EmptyState title="No backup files" description="Backup files will appear here after creating backups." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupFiles.map(file => (
                  <TableRow key={file.filename}>
                    <TableCell className="font-mono text-sm">{file.filename}</TableCell>
                    <TableCell>
                      <Badge variant={file.is_automatic ? "secondary" : "default"}>
                        {file.is_automatic ? "Automatic" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(file.size_bytes / 1024).toFixed(2)} KB
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(file.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => downloadBackupFile(file.filename)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteBackupFile(file.filename)}>
                          <Trash2 className="w-4 h-4" />
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
      
      {/* Backup History */}
      <Card>
        <CardHeader><CardTitle>Backup & Restore History</CardTitle><CardDescription>Previous database operations</CardDescription></CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? <EmptyState title="No backup history" description="Backup and restore operations will be recorded here." actionLabel="Create Backup" onAction={handleBackup} /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Status</TableHead><TableHead>Triggered By</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {backupHistory.map(b => (
                  <TableRow key={b.backup_id}>
                    <TableCell>
                      <Badge variant={b.action === 'BACKUP' ? 'default' : 'secondary'}>
                        {b.action === 'BACKUP' ? <><Download className="w-3 h-3 mr-1" />BACKUP</> : <><Upload className="w-3 h-3 mr-1" />RESTORE</>}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'SUCCESS' ? 'success' : b.status === 'FAILED' ? 'destructive' : 'warning'}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{b.username || (b.triggered_by ? `User #${b.triggered_by}` : 'System')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{b.notes || "—"}</TableCell>
                    <TableCell className="text-right text-sm">{new Date(b.started_at).toLocaleString()}</TableCell>
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
      <PageHeader title="System Configuration" description="Manage system-wide settings and parameters." />
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader><CardTitle>Demerit Points Threshold</CardTitle><CardDescription>Maximum demerit points before license suspension.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="w-12 h-12 rounded-full text-xl" onClick={() => setThreshold(Math.max(0, threshold - 1))}>−</Button>
                <input type="number" min="0" max="99" value={threshold} onChange={e => { const val = parseInt(e.target.value); if (!isNaN(val) && val >= 0 && val <= 99) setThreshold(val); }} className="w-28 h-20 text-center text-4xl font-bold bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <Button variant="outline" size="icon" className="w-12 h-12 rounded-full text-xl" onClick={() => setThreshold(Math.min(99, threshold + 1))}>+</Button>
              </div>
              <span className="text-sm text-muted-foreground">points</span>
            </div>
            <div className="grid grid-cols-3 gap-2">{[6, 12, 18].map(val => <Button key={val} variant={threshold === val ? "secondary" : "outline"} onClick={() => setThreshold(val)}>{val} Points</Button>)}</div>
            <div className="flex gap-2 pt-4"><Button onClick={() => setThreshold(12)} variant="outline" className="flex-1">Reset to Default</Button><Button onClick={saveThreshold} className="flex-1"><Save className="w-4 h-4 mr-2" />Save Configuration</Button></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAccessLogs = () => {
    const currentLogs = getCurrentLogs();
    
    return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        title="Access Logs" 
        description="Complete audit trail of system access and modifications."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search logs..." 
              className="pl-9"
              value={logSearchQuery}
              onChange={e => setLogSearchQuery(e.target.value)}
            />
          </div>
        }
      />
      
      {/* Log Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={stats.totalLogs} icon={Activity} />
        <StatCard title="User Activity" value={stats.activityCount} icon={UserCheck} description="Login/logout events" />
        <StatCard title="Data Changes" value={auditTrailLogs.length} icon={History} description="CRUD operations" />
        <StatCard title="Security Events" value={stats.securityCount} icon={Shield} description="Security alerts" />
      </div>
      
      {/* Tabbed Log View */}
      <Card>
        <CardHeader>
          <Tabs value={activeLogTab} onValueChange={setActiveLogTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-1">
                <Activity className="w-4 h-4" />All
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-1">
                <UserCheck className="w-4 h-4" />Activity
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-1">
                <FileSearch className="w-4 h-4" />Audit
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1">
                <Shield className="w-4 h-4" />Security
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            {activeLogTab === 'all' && "Showing all system events"}
            {activeLogTab === 'activity' && "User logins, logouts, and session events"}
            {activeLogTab === 'audit' && "Database modifications and CRUD operations"}
            {activeLogTab === 'security' && "Failed logins, password changes, and deletions"}
          </div>
          
          {currentLogs.length === 0 ? (
            <EmptyState 
              title="No logs found" 
              description={logSearchQuery ? "Try a different search term." : "System events will be recorded here."} 
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLogs.map(log => (
                  <TableRow key={log.log_id}>
                    <TableCell><ActionBadge action={log.action} /></TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {log.first_name ? `${log.first_name} ${log.last_name}` : '—'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{log.username || `ID: ${log.user_id}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.role_name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.affected_table ? `${log.affected_table} #${log.affected_table_id}` : (log.details || "—")}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{log.ip_address || "—"}</TableCell>
                    <TableCell className="text-right text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
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
    <DashboardLayout user={user} roleName="superadmin" roleLabel="Super Admin" menuItems={menuItems} activeMenu={activeMenu} setActiveMenu={setActiveMenu} onRefresh={fetchAllData} loading={loading}>
      {activeMenu === "dashboard" && renderDashboard()}
      {activeMenu === "users" && renderUserManagement()}
      {activeMenu === "lgu" && renderLguManagement()}
      {activeMenu === "database" && renderDatabaseManagement()}
      {activeMenu === "config" && renderSystemConfig()}
      {activeMenu === "logs" && renderAccessLogs()}

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle><DialogDescription>{editingUser ? "Update user details and role assignment." : "Add a new user to the system."}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="username">Username *</Label><Input id="username" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} placeholder="johndoe" disabled={!!editingUser} /></div>
              <div className="space-y-2"><Label htmlFor="password">{editingUser ? "New Password" : "Password *"}</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder={editingUser ? "Leave blank to keep" : "••••••••"} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="first_name">First Name</Label><Input id="first_name" value={userForm.first_name} onChange={e => setUserForm(f => ({ ...f, first_name: e.target.value }))} placeholder="John" /></div>
              <div className="space-y-2"><Label htmlFor="last_name">Last Name</Label><Input id="last_name" value={userForm.last_name} onChange={e => setUserForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Doe" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="john.doe@example.com" /></div>
            <div className="space-y-2"><Label htmlFor="contact_number">Contact Number</Label><Input id="contact_number" value={userForm.contact_number} onChange={e => setUserForm(f => ({ ...f, contact_number: e.target.value }))} placeholder="+63-XXX-XXX-XXXX" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="role">Role *</Label><Select value={userForm.role_id} onValueChange={val => setUserForm(f => ({ ...f, role_id: val }))}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{rolesList.map(role => <SelectItem key={role.role_id} value={String(role.role_id)}>{role.role_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="lgu">Assigned LGU</Label><Select value={userForm.lgu_id || "none"} onValueChange={val => setUserForm(f => ({ ...f, lgu_id: val === "none" ? "" : val }))}><SelectTrigger><SelectValue placeholder="Select LGU" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{lguList.map(lgu => <SelectItem key={lgu.lgu_id} value={String(lgu.lgu_id)}>{lgu.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveUser}><Save className="w-4 h-4 mr-2" />{editingUser ? "Update User" : "Create User"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" />Delete User</DialogTitle><DialogDescription>Are you sure you want to delete user <strong>{userToDelete?.username}</strong>? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteUser}><Trash2 className="w-4 h-4 mr-2" />Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LGU Dialog */}
      <Dialog open={lguDialogOpen} onOpenChange={setLguDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingLgu ? "Edit LGU" : "Create New LGU"}</DialogTitle><DialogDescription>{editingLgu ? "Update LGU details." : "Add a new Local Government Unit."}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="lgu_name">LGU Name *</Label><Input id="lgu_name" value={lguForm.name} onChange={e => setLguForm(f => ({ ...f, name: e.target.value }))} placeholder="Metro City LGU" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="province">Province</Label><Input id="province" value={lguForm.province} onChange={e => setLguForm(f => ({ ...f, province: e.target.value }))} placeholder="Metro Province" /></div>
              <div className="space-y-2"><Label htmlFor="region">Region</Label><Input id="region" value={lguForm.region} onChange={e => setLguForm(f => ({ ...f, region: e.target.value }))} placeholder="Region X" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="lgu_email">Contact Email</Label><Input id="lgu_email" type="email" value={lguForm.contact_email} onChange={e => setLguForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="contact@lgu.gov.ph" /></div>
            <div className="space-y-2"><Label htmlFor="lgu_phone">Contact Number</Label><Input id="lgu_phone" value={lguForm.contact_number} onChange={e => setLguForm(f => ({ ...f, contact_number: e.target.value }))} placeholder="+63-XXX-XXX-XXXX" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setLguDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveLgu}><Save className="w-4 h-4 mr-2" />{editingLgu ? "Update LGU" : "Create LGU"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Database Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={(open) => { setRestoreDialogOpen(open); if (!open) setRestoreFile(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Upload className="w-5 h-5" />Restore Database
            </DialogTitle>
            <DialogDescription>
              Upload a previously downloaded .sql backup file to restore the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800 dark:text-orange-200">This is a destructive operation!</p>
                  <ul className="text-orange-700 dark:text-orange-300 mt-2 space-y-1 list-disc list-inside">
                    <li>Existing data will be overwritten</li>
                    <li>Make sure you have a recent backup</li>
                    <li>This cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backup-file">Select Backup File (.sql)</Label>
              <Input 
                id="backup-file" 
                type="file" 
                accept=".sql"
                onChange={handleRestoreFileSelect}
                className="cursor-pointer"
              />
              {restoreFile && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Selected: {restoreFile.name} ({(restoreFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRestoreDialogOpen(false); setRestoreFile(null); }}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleRestore} 
              disabled={!restoreFile || restoreLoading}
            >
              {restoreLoading ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Restoring...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Restore Database</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function ActionBadge({ action }) {
  const getVariant = () => {
    if (action?.includes("LOGIN") && !action?.includes("FAILED")) return "success";
    if (action === "LOGOUT") return "secondary";
    if (action?.includes("FAILED") || action?.includes("DELETE")) return "destructive";
    if (action?.includes("CREATE")) return "default";
    if (action?.includes("UPDATE")) return "warning";
    return "outline";
  };
  return <Badge variant={getVariant()}>{action}</Badge>;
}

export default SuperAdmin;
