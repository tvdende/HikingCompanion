import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '@hiking-companion/core';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithMock } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMockLogin = async (role: UserRole) => {
    setLoadingRole(role);
    try {
      const success = await loginWithMock(role);
      if (success) {
        onClose();
      }
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div
      id="login-modal-backdrop"
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div
        id="login-modal"
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🥾</span>
            <h2 id="login-modal-title" className="modal-title">
              Inloggen bij Hiking Companion
            </h2>
          </div>
          <button
            id="btn-close-login-modal"
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <p className="modal-description">
          Log in of registreer je gratis met je bestaande account. Er is geen handmatige goedkeuring nodig, je kunt meteen aan de slag!
        </p>

        <div className="oauth-buttons-container">
          <a
            id="oauth-btn-google"
            href="/api/auth/login/google"
            className="oauth-btn google-btn"
          >
            <span className="oauth-icon">🌐</span>
            <span>Verdergaan met Google</span>
          </a>

          <a
            id="oauth-btn-microsoft"
            href="/api/auth/login/microsoft"
            className="oauth-btn microsoft-btn"
          >
            <span className="oauth-icon">🏢</span>
            <span>Verdergaan met Microsoft</span>
          </a>

          <a
            id="oauth-btn-github"
            href="/api/auth/login/github"
            className="oauth-btn github-btn"
          >
            <span className="oauth-icon">🐙</span>
            <span>Verdergaan met GitHub</span>
          </a>
        </div>

        {import.meta.env.DEV && (
          <>
            <div className="modal-divider">
              <span>OF VOOR LOKALE ONTWIKKELING</span>
            </div>

            <div className="mock-login-section">
              <p className="mock-subtitle">Direct inloggen als testrol:</p>
              <div className="mock-btn-group">
                <button
                  id="btn-mock-user"
                  type="button"
                  className="mock-role-btn"
                  disabled={loadingRole !== null}
                  onClick={() => handleMockLogin('user')}
                >
                  <span>👤</span>
                  <span>Wandelaar</span>
                </button>

                <button
                  id="btn-mock-planner"
                  type="button"
                  className="mock-role-btn"
                  disabled={loadingRole !== null}
                  onClick={() => handleMockLogin('planner')}
                >
                  <span>📐</span>
                  <span>Route Planner</span>
                </button>

                <button
                  id="btn-mock-admin"
                  type="button"
                  className="mock-role-btn admin-role"
                  disabled={loadingRole !== null}
                  onClick={() => handleMockLogin('admin')}
                >
                  <span>🛡️</span>
                  <span>Beheerder</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
