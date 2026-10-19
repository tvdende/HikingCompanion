import React, { useState, useEffect, useCallback } from 'react';
import type { AdminUserListItem, UserRole } from '@hiking-companion/core';
import { useAuth } from '../context/AuthContext';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({ isOpen, onClose }) => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
        setActionError(err.error || 'Fout bij het ophalen van gebruikers');
      }
    } catch {
      setActionError('Netwerkfout bij communicatie met de server');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        setActionError(err.error || 'Kon rol niet wijzigen');
      }
    } catch {
      setActionError('Netwerkfout');
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
        setActionError(err.error || 'Kon status niet wijzigen');
      }
    } catch {
      setActionError('Netwerkfout');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Weet je zeker dat je account "${userName}" permanent wilt verwijderen?`)) {
      return;
    }
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const err = (await res.json()) as any;
        setActionError(err.error || 'Kon gebruiker niet verwijderen');
      }
    } catch {
      setActionError('Netwerkfout');
    }
  };

  return (
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
              Gebruikersbeheer (Beheerder)
            </h2>
          </div>
          <button
            id="btn-close-admin-modal"
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <div className="admin-controls-bar">
          <input
            id="admin-search-input"
            type="text"
            className="admin-search-input"
            placeholder="Zoek op naam of e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            id="btn-refresh-users"
            type="button"
            className="admin-refresh-btn"
            onClick={() => fetchUsers(searchTerm)}
          >
            🔄 Verversen
          </button>
        </div>

        {actionError && (
          <div id="admin-action-error" className="admin-error-banner">
            ⚠️ {actionError}
          </div>
        )}

        <div className="admin-table-container">
          {isLoading && users.length === 0 ? (
            <p className="admin-loading-text">Gebruikers laden...</p>
          ) : users.length === 0 ? (
            <p className="admin-empty-text">Geen gebruikers gevonden.</p>
          ) : (
            <table className="admin-table" id="admin-users-table">
              <thead>
                <tr>
                  <th>Gebruiker</th>
                  <th>Rol</th>
                  <th>Status</th>
                  <th>Provider(s)</th>
                  <th>Acties</th>
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
                          <option value="user">Wandelaar (user)</option>
                          <option value="planner">Planner</option>
                          <option value="admin">Beheerder (admin)</option>
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
                              ? 'Je kunt je eigen status niet wijzigen'
                              : u.isActive
                              ? 'Klik om te deactiveren'
                              : 'Klik om te activeren'
                          }
                        >
                          {u.isActive ? '● Actief' : '○ Geblokkeerd'}
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
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            title="Gebruiker verwijderen"
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
  );
};
