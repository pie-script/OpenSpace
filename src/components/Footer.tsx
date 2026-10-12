import React from 'react';
import type { PageView } from '../types';
import { School, RotateCcw, ShieldCheck, HeartHandshake } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: PageView) => void;
  onResetData: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onResetData }) => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__grid">
          {/* Brand info */}
          <div className="footer__col footer__col--brand">
            <div className="footer__logo">
              <School size={20} aria-hidden="true" />
              <span>OpenSpace</span>
            </div>
            <p className="footer__desc">
              Unlocking underutilized school auditoriums, university labs, gymnasiums, and
              civic library rooms for community organizers outside academic hours.
            </p>
            <div className="footer__badges">
              <span className="footer__pill">
                <HeartHandshake size={14} /> Community First
              </span>
              <span className="footer__pill">
                <ShieldCheck size={14} /> Vetted Public Venues
              </span>
            </div>
          </div>

          {/* Quick navigation */}
          <div className="footer__col">
            <h4 className="footer__title">Navigation</h4>
            <ul className="footer__links">
              <li>
                <button
                  type="button"
                  className="footer__link-btn"
                  onClick={() => onNavigate('home')}
                >
                  Home Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer__link-btn"
                  onClick={() => onNavigate('venues')}
                >
                  Browse Venues
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer__link-btn"
                  onClick={() => onNavigate('staff')}
                >
                  Staff Management Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Demo Controls */}
          <div className="footer__col">
            <h4 className="footer__title">Prototype Demo Controls</h4>
            <p className="footer__demo-note">
              This prototype runs entirely in your browser with local demo storage. You can
              reset back to the initial sample venues and requests anytime.
            </p>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={onResetData}
              title="Reset all venues and requests to baseline sample state"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Disclaimer bar */}
        <div className="footer__bottom">
          <p className="footer__disclaimer">
            <strong>Prototype Notice:</strong> OpenSpace is in Demo Mode. All sample schools,
            institutions, bookings, and fee structures are simulated for prototype evaluation. No real
            charges or academic agreements are made.
          </p>
          <p className="footer__copyright">
            &copy; 2026 OpenSpace Civic Facilities Network. Built for educational facility access.
          </p>
        </div>
      </div>
    </footer>
  );
};
