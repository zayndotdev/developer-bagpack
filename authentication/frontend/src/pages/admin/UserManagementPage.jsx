/**
 * ==============================================================================
 * 📍 FILE: src/pages/admin/UserManagementPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Dynamic User Administration & RBAC Console
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/admin/users` (Configured in `src/constants/index.js`)
 * - Guarded by: `src/components/common/RoleRoute.jsx` (requiredPermission="users:read")
 * - Interacts with:
 *   - `src/api/userService.js` (listUsers, deleteUser)
 *   - `src/api/roleService.js` (listRoles, assignRole)
 *   - `src/hooks/useAuth.js` (Checks dynamic granular permissions)
 *   - `src/components/layout/DashboardLayout.jsx`
 *   - `src/components/ui/*.jsx` (Card, Badge, Button, Input, Modal, Alert, Spinner)
 *
 * 💡 WHY THIS EXISTS:
 * Provides enterprise-grade user administration:
 * - Dynamically accessible to admins or any role with the 'users:read' permission.
 * - Live search & filter across registered users.
 * - Real-time role reassignment dropdown (guarded by 'users:write' or 'roles:manage').
 * - Account deletion with confirmation modal (guarded by 'users:delete').
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  Trash2,
  Shield,
  CheckCircle2,
  Clock,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { userService } from '../../api/userService.js';
import { roleService } from '../../api/roleService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLES, PERMISSIONS } from '../../constants';

export const UserManagementPage = () => {
  const { user: currentUser, hasRole, hasPermission } = useAuth();

  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Role updating state
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Dynamic permission checks
  const canWriteUsers = hasRole(ROLES.ADMIN) || hasPermission(PERMISSIONS.USERS_WRITE) || hasPermission(PERMISSIONS.ROLES_MANAGE);
  const canDeleteUsers = hasRole(ROLES.ADMIN) || hasPermission(PERMISSIONS.USERS_DELETE);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userService.listUsers(page, 10),
        roleService.listRoles().catch(() => ({ data: { roles: [] } })),
      ]);

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.users || []);
        if (usersRes.data.pagination) {
          setPagination(usersRes.data.pagination);
        }
      }

      if (rolesRes.success && rolesRes.data?.roles) {
        setAvailableRoles(rolesRes.data.roles);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  // Handle role reassignment
  const handleRoleChange = async (userId, newRole) => {
    setError(null);
    setSuccessMessage(null);
    setUpdatingUserId(userId);

    try {
      const response = await roleService.assignRole(userId, newRole);
      if (response.success) {
        setSuccessMessage(`User role updated to '${newRole}' successfully.`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await userService.deleteUser(userToDelete._id);
      if (response.success) {
        setSuccessMessage(`User ${userToDelete.email} has been deleted.`);
        setUserToDelete(null);
        fetchUsers(pagination.page);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingUser(false);
    }
  };

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/60 mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>User Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              User Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Inspect registered accounts, dynamically reassign roles, and manage permissions.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(pagination.page)}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Directory
          </Button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              Total: <strong className="text-slate-800">{pagination.total}</strong> users
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
              <strong className="text-slate-800">{pagination.totalPages}</strong>
            </span>
          </div>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Spinner size="lg" className="text-brand-600 mx-auto" />
              <p className="text-sm font-medium text-slate-500">Loading user directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm">No users match your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5">Verification</th>
                    <th className="px-6 py-3.5">2FA Status</th>
                    <th className="px-6 py-3.5">Joined</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser?._id === u._id || currentUser?.email === u.email;

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* User Identity */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm border border-brand-200">
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px] font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Reassignment Selector */}
                        <td className="px-6 py-4">
                          {canWriteUsers ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={u.role || ROLES.USER}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                disabled={updatingUserId === u._id}
                                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer disabled:opacity-50"
                              >
                                {availableRoles.length > 0 ? (
                                  availableRoles.map((r) => (
                                    <option key={r.name} value={r.name}>
                                      {r.name.toUpperCase()}
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value={ROLES.ADMIN}>ADMIN</option>
                                    <option value={ROLES.MODERATOR}>MODERATOR</option>
                                    <option value={ROLES.USER}>USER</option>
                                  </>
                                )}
                              </select>
                              {updatingUserId === u._id && (
                                <Spinner size="sm" className="text-brand-600" />
                              )}
                            </div>
                          ) : (
                            <Badge variant={u.role} size="sm">
                              {u.role}
                            </Badge>
                          )}
                        </td>

                        {/* Email Verification */}
                        <td className="px-6 py-4">
                          {u.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* 2FA Status */}
                        <td className="px-6 py-4">
                          {u.twoFactorEnabled ? (
                            <span className="inline-flex items-center gap-1 text-purple-700 font-medium bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full text-[11px]">
                              <KeyRound className="w-3 h-3 text-purple-600" />
                              {u.twoFactorMethod?.toUpperCase() || 'ENABLED'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Disabled</span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-4 text-slate-500 text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {canDeleteUsers && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setUserToDelete(u)}
                              disabled={isSelf}
                              title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* MODAL: Delete User Confirmation */}
        <Modal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          title="Delete User Account"
          subtitle="This action is irreversible and permanently removes the user's data."
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                Are you sure you want to permanently delete{' '}
                <strong>{userToDelete?.email}</strong> ({userToDelete?.name})? All associated
                sessions and tokens will be revoked.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUser}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={handleDeleteUser}
                isLoading={deletingUser}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Deletion
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
export default UserManagementPage;
