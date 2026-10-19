import React, { useState, useRef, useEffect } from 'react';
import type { AppMode } from '@hiking-companion/core';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenLogin: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  onOpenLogin,
  onOpenAdmin,
}) => {
  const { user, isLoading, logout, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="role-tag admin">Beheerder</span>;
      case 'planner':
        return <span className="role-tag planner">Planner</span>;
      default:
        return <span className="role-tag user">Wandelaar</span>;
    }
  };

  return (
    <header id="app-header" className="app-header">
      <div className="brand-section">
        <div className="brand-icon">🥾</div>
        <span id="header-brand" className="brand-title">
          Hiking Companion
        </span>
      </div>

      <div className="mode-toggle-container" role="group" aria-label="Application Mode">
        <button
          id="mode-switch-planner"
          type="button"
          className={`mode-btn ${currentMode === 'planner' ? 'active' : ''}`}
          onClick={() => onModeChange('planner')}
          aria-pressed={currentMode === 'planner'}
        >
          <span>📐</span>
          <span>Planner</span>
        </button>

        <button
          id="mode-switch-companion"
          type="button"
          className={`mode-btn ${currentMode === 'companion' ? 'active' : ''}`}
          onClick={() => onModeChange('companion')}
          aria-pressed={currentMode === 'companion'}
        >
          <span>🧭</span>
          <span>Companion</span>
        </button>
      </div>

      <div className="header-auth-section">
        {isLoading ? (
          <div className="auth-skeleton" />
        ) : user ? (
          <div className="user-profile-menu-container" ref={dropdownRef}>
            <button
              id="user-profile-trigger"
              type="button"
              className="user-profile-trigger-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <div className="user-avatar-circle">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="avatar-img" />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span id="header-user-name" className="user-display-name">
                {user.name}
              </span>
              {getRoleBadge(user.role)}
              <span className="dropdown-caret">▼</span>
            </button>

            {dropdownOpen && (
              <div id="user-profile-dropdown" className="user-profile-dropdown" role="menu">
                <div className="dropdown-user-info">
                  <span className="dropdown-user-name">{user.name}</span>
                  <span className="dropdown-user-email">{user.email}</span>
                </div>

                <div className="dropdown-divider" />

                {isAdmin && (
                  <button
                    id="btn-header-admin-panel"
                    type="button"
                    className="dropdown-item admin-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAdmin();
                    }}
                    role="menuitem"
                  >
                    <span>🛡️</span>
                    <span>Gebruikersbeheer</span>
                  </button>
                )}

                <button
                  id="btn-header-logout"
                  type="button"
                  className="dropdown-item logout-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  role="menuitem"
                >
                  <span>🚪</span>
                  <span>Uitloggen</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            id="btn-open-login"
            type="button"
            className="login-trigger-btn"
            onClick={onOpenLogin}
          >
            <span>👤</span>
            <span>Inloggen</span>
          </button>
        )}
      </div>
    </header>
  );
};
