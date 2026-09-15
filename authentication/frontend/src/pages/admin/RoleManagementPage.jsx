/**
 * ==============================================================================
 * 📍 FILE: src/pages/admin/RoleManagementPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Role-Based Access Control (RBAC) Management Console
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/admin/roles` (Configured in `src/constants/index.js`)
 * - Wrapped by: `src/components/common/RoleRoute.jsx` (Admin only)
 * - Interacts with:
 *   - `src/api/roleService.js` (listRoles, createCustomRole, updateRolePermissions)
 *   - `src/components/layout/DashboardLayout.jsx`
 *   - `src/components/ui/*.jsx` (Card, Badge, Button, Input, Modal, Alert)
 *
 * 💡 WHY THIS EXISTS:
 * Demonstrates dynamic enterprise RBAC in action:
 * Allows administrators to inspect built-in system roles (admin, moderator, user)
 * and dynamically create custom roles with tailored permission sets at runtime.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Lock, Check, Info, Users, Sparkles, Edit3 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { roleService } from '../../api/roleService.js';

export const RoleManagementPage = () => {
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // New Custom Role Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [creatingRole, setCreatingRole] = useState(false);

  // Edit Role Permissions Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await roleService.listRoles();
      if (response.success && response.data) {
        setRoles(response.data.roles || []);
        setAvailablePermissions(response.data.availablePermissions || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to retrieve roles from server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const togglePermission = (perm) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setEditPermissions(role.permissions ? [...role.permissions] : []);
    setIsEditModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const toggleEditPermission = (perm) => {
    if (editPermissions.includes(perm)) {
      setEditPermissions(editPermissions.filter((p) => p !== perm));
    } else {
      setEditPermissions([...editPermissions, perm]);
    }
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!editingRole) return;
    setSavingPermissions(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await roleService.updateRolePermissions(
        editingRole.name,
        editPermissions
      );

      if (response.success) {
        setSuccessMessage(
          `Permissions for role '${editingRole.name}' updated successfully!`
        );
        setIsEditModalOpen(false);
        setRoles((prev) =>
          prev.map((r) =>
            r.name === editingRole.name
              ? { ...r, permissions: editPermissions }
              : r
          )
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to update role permissions.'
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!newRoleName.trim()) {
      setError('Role name is required.');
      return;
    }

    setCreatingRole(true);
    try {
      const response = await roleService.createCustomRole({
        name: newRoleName.trim(),
        description: newRoleDesc.trim(),
        permissions: selectedPermissions,
      });

      if (response.success) {
        setSuccessMessage(`Custom role '${newRoleName}' created successfully!`);
        setIsModalOpen(false);
        setNewRoleName('');
        setNewRoleDesc('');
        setSelectedPermissions([]);
        fetchRoles();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create new custom role.'
      );
    } finally {
      setCreatingRole(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin RBAC Control Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Role & Permission Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Inspect system roles and create dynamic custom roles with granular access controls.
            </p>
          </div>

          <div>
            <Button
              variant="primary"
              onClick={() => {
                setError(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Custom Role
            </Button>
          </div>
        </div>

        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        {/* Roles List */}
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Spinner size="lg" className="text-brand-600 mx-auto" />
            <p className="text-sm font-medium text-slate-500">
              Loading role configurations...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((r) => (
              <Card
                key={r._id || r.name}
                title={r.name}
                badge={
                  <Badge variant={r.isSystemRole ? r.name : 'brand'} size="sm">
                    {r.isSystemRole ? 'Built-in System Role' : 'Custom Dynamic Role'}
                  </Badge>
                }
                subtitle={r.description || 'No description provided.'}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Assigned Permissions</span>
                    <span>{r.permissions?.length || 0} permissions</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions && r.permissions.length > 0 ? (
                      r.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          {perm}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        No permissions assigned.
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      {r.isSystemRole ? 'Built-in role' : 'Custom role'}
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleOpenEdit(r)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Edit Permissions
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* MODAL: Create Custom Role */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Custom Role"
          subtitle="Define a unique role and select its granular permission set"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateRole} className="space-y-4">
            <Input
              label="Role Identifier"
              placeholder="e.g. auditor, content-manager"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value.toLowerCase())}
              helperText="Must be unique, lowercase alphanumeric (no spaces)."
              required
            />

            <Input
              label="Description"
              placeholder="e.g. Can view audit logs and read user records"
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />

            {/* Permission Selector Matrix */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Select Permissions
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                {availablePermissions.map((perm) => {
                  const isSelected = selectedPermissions.includes(perm);
                  return (
                    <div
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={`cursor-pointer flex items-center gap-2 p-2 rounded-lg border text-xs font-mono transition-all ${
                        isSelected
                          ? 'bg-brand-50 border-brand-300 text-brand-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected
                            ? 'bg-brand-600 border-brand-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span>{perm}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={creatingRole}
              >
                Create Role
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: Edit Role Permissions */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Permissions: ${editingRole?.name || ''}`}
          subtitle="Configure which capabilities this role can perform across the system"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSavePermissions} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select Permissions ({editPermissions.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPermissions([...availablePermissions])}
                    className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setEditPermissions([])}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                {availablePermissions.map((perm) => {
                  const isSelected = editPermissions.includes(perm);
                  return (
                    <div
                      key={perm}
                      onClick={() => toggleEditPermission(perm)}
                      className={`cursor-pointer flex items-center gap-2 p-2 rounded-lg border text-xs font-mono transition-all ${
                        isSelected
                          ? 'bg-brand-50 border-brand-300 text-brand-900 font-semibold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected
                            ? 'bg-brand-600 border-brand-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span>{perm}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={savingPermissions}
              >
                Save Permissions
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
