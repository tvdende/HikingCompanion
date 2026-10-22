import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '@hiking-companion/core';
import { Button } from './ui/button';
import { User, Compass, Shield, X } from 'lucide-react';

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

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
            <X className="w-5 h-5" />
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
            <GoogleIcon className="w-5 h-5 shrink-0" />
            <span>Verdergaan met Google</span>
          </a>

          <a
            id="oauth-btn-microsoft"
            href="/api/auth/login/microsoft"
            className="oauth-btn microsoft-btn"
          >
            <MicrosoftIcon className="w-5 h-5 shrink-0" />
            <span>Verdergaan met Microsoft</span>
          </a>

          <a
            id="oauth-btn-github"
            href="/api/auth/login/github"
            className="oauth-btn github-btn"
          >
            <GitHubIcon className="w-5 h-5 shrink-0" />
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
                <Button
                  id="btn-mock-user"
                  variant="secondary"
                  size="sm"
                  className="flex-1 flex-col h-auto py-2.5 text-xs font-semibold gap-1"
                  disabled={loadingRole !== null}
                  onClick={() => handleMockLogin('user')}
                >
                  <User className="w-4 h-4 text-[#24583d]" />
                  <span>Wandelaar</span>
                </Button>

                <Button
                  id="btn-mock-planner"
                  variant="secondary"
                  size="sm"
                  className="flex-1 flex-col h-auto py-2.5 text-xs font-semibold gap-1"
                  disabled={loadingRole !== null}
                  onClick={() => handleMockLogin('planner')}
                >
                  <Compass className="w-4 h-4 text-[#24583d]" />
                  <span>Route Planner</span>
                </Button>

                <Button
                  id="btn-mock-admin"
                  variant="secondary"
                  size="sm"
                  className="flex-1 flex-col h-auto py-2.5 text-xs font-semibold gap-1 border-amber-300 hover:bg-amber-50"
                  disabled={loadingRole !== null}
                  onClick={() => handleMockLogin('admin')}
                >
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Beheerder</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
