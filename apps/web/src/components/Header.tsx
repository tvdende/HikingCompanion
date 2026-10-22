import React, { useState, useRef, useEffect } from 'react';
import type { AppMode } from '@hiking-companion/core';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LogIn } from 'lucide-react';

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
  const { t } = useTranslation();
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
        return <Badge variant="destructive">{t('nav.roleAdmin')}</Badge>;
      case 'planner':
        return <Badge variant="secondary">{t('nav.rolePlanner')}</Badge>;
      default:
        return <Badge variant="default">{t('nav.roleHiker')}</Badge>;
    }
  };

  return (
    <header id="app-header" className="app-header">
      <div className="brand-section">
        <div className="brand-icon">🥾</div>
        <span id="header-brand" className="brand-title">
          {t('common.appName')}
        </span>
      </div>

      {user && (
        <div className="mode-toggle-container" role="group" aria-label="Application Mode">
          <button
            id="mode-switch-planner"
            type="button"
            className={`mode-btn ${currentMode === 'planner' ? 'active' : ''}`}
            onClick={() => onModeChange('planner')}
            aria-pressed={currentMode === 'planner'}
          >
            <span>📐</span>
            <span>{t('nav.planner')}</span>
          </button>

          <button
            id="mode-switch-companion"
            type="button"
            className={`mode-btn ${currentMode === 'companion' ? 'active' : ''}`}
            onClick={() => onModeChange('companion')}
            aria-pressed={currentMode === 'companion'}
          >
            <span>🧭</span>
            <span>{t('nav.companion')}</span>
          </button>
        </div>
      )}

      <div className="header-auth-section flex items-center gap-3">
        <LanguageSelector />

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
                    <span>{t('nav.userManagement')}</span>
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
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button
            id="btn-open-login"
            variant="primary"
            onClick={onOpenLogin}
          >
            <LogIn className="w-4 h-4" />
            <span>{t('nav.login')}</span>
          </Button>
        )}
      </div>
    </header>
  );
};
