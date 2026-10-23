import React, { useState, useEffect, useCallback } from 'react';
import type { AdminUserListItem, UserRole } from '@hiking-companion/core';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ConfirmationModal } from './ConfirmationModal';
import { useFeedback } from '../context/FeedbackContext';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({ isOpen, onClose }) => {
  const { user: currentAdmin } = useAuth();
  const { t } = useTranslation();
  const feedback = useFeedback();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
    trigger: HTMLElement;
  } | null>(null);

  const fetchUsers = useCallback(async (query: string = '') => {
    setIsLoading(true);
    setActionError(null);
    try {
      const url = query
        ? `/api/admin/users?search=${encodeURIComponent(query)}`
        : '/api/admin/users';
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as { users: AdminUserListItem[] };
        setUsers(data.users);
      } else {
        const err = (await res.json()) as any;
        setActionError(err.error || t('adminModal.fetchError'));
      }
    } catch {
      setActionError(t('common.networkError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers(searchTerm);
    }
  }, [isOpen, fetchUsers, searchTerm]);

  if (!isOpen) return null;

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        const err = (await res.json()) as any;
        setActionError(err.error || t('adminModal.updateRoleError'));
      }
    } catch {
      setActionError(t('common.networkError'));
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setActionError(null);
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u))
        );
      } else {
        const err = (await res.json()) as any;
        setActionError(err.error || t('adminModal.updateStatusError'));
      }
    } catch {
      setActionError(t('common.networkError'));
    }
  };

  const handleDeleteUser = (userId: string, userName: string, trigger: HTMLElement) => {
    setPendingDelete({ id: userId, name: userName, trigger });
  };

  const confirmDeleteUser = async () => {
    if (!pendingDelete) return;
    const { id: userId, name: userName } = pendingDelete;
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        feedback.success(t('feedback.userDeleted', { name: userName }));
      } else {
        const err = (await res.json()) as any;
        throw new Error(err.error || t('adminModal.deleteUserError'));
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : t('common.networkError'));
    }
  };

  return (
    <>
      <div
        id="admin-modal-backdrop"
        className="modal-backdrop"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
      <div
        id="admin-users-modal"
        className="modal-card admin-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🛡️</span>
            <h2 id="admin-modal-title" className="modal-title">
              {t('adminModal.title')}
            </h2>
          </div>
          <button
            id="btn-close-admin-modal"
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <Input
            id="admin-search-input"
            type="text"
            placeholder={t('adminModal.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            id="btn-refresh-users"
            variant="secondary"
            size="sm"
            onClick={() => fetchUsers(searchTerm)}
          >
            🔄 {t('adminModal.btnRefresh')}
          </Button>
        </div>

        {actionError && (
          <div id="admin-action-error" className="admin-error-banner">
            ⚠️ {actionError}
          </div>
        )}

        <div className="admin-table-container">
          {isLoading && users.length === 0 ? (
            <p className="admin-loading-text">{t('adminModal.loadingUsers')}</p>
          ) : users.length === 0 ? (
            <p className="admin-empty-text">{t('adminModal.emptyUsers')}</p>
          ) : (
            <table className="admin-table" id="admin-users-table">
              <thead>
                <tr>
                  <th>{t('adminModal.colUser')}</th>
                  <th>{t('adminModal.colRole')}</th>
                  <th>{t('adminModal.colStatus')}</th>
                  <th>{t('adminModal.colProviders')}</th>
                  <th>{t('adminModal.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id} id={`user-row-${u.id}`}>
                      <td>
                        <div className="user-cell">
                          <span className="user-cell-name">{u.name}</span>
                          <span className="user-cell-email">{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <select
                          id={`role-select-${u.id}`}
                          className="role-dropdown"
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value as UserRole)
                          }
                        >
                          <option value="user">{t('adminModal.roleUser')}</option>
                          <option value="planner">{t('adminModal.rolePlanner')}</option>
                          <option value="admin">{t('adminModal.roleAdmin')}</option>
                        </select>
                      </td>
                      <td>
                        <button
                          id={`status-btn-${u.id}`}
                          type="button"
                          className={`status-badge-btn ${
                            u.isActive ? 'active' : 'suspended'
                          }`}
                          disabled={isSelf}
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          title={
                            isSelf
                              ? t('adminModal.tooltipSelfStatus')
                              : u.isActive
                              ? t('adminModal.tooltipDeactivate')
                              : t('adminModal.tooltipActivate')
                          }
                        >
                          {u.isActive ? t('adminModal.statusActive') : t('adminModal.statusBlocked')}
                        </button>
                      </td>
                      <td>
                        <span className="provider-tags">
                          {u.oauthProviders.length > 0
                            ? u.oauthProviders.join(', ')
                            : 'Direct'}
                        </span>
                      </td>
                      <td>
                        {!isSelf && (
                          <button
                            id={`delete-btn-${u.id}`}
                            type="button"
                            className="delete-user-btn"
                            onClick={(event) => handleDeleteUser(u.id, u.name, event.currentTarget)}
                            title={t('adminModal.tooltipDelete')}
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
      <ConfirmationModal
        isOpen={pendingDelete !== null}
        title={t('common.delete')}
        description={pendingDelete ? t('adminModal.deleteConfirm', { name: pendingDelete.name }) : ''}
        onConfirm={confirmDeleteUser}
        onClose={() => setPendingDelete(null)}
        triggerElement={pendingDelete?.trigger}
      />
    </>
  );
};
