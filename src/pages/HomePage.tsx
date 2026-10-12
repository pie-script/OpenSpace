import React from 'react';
import type { PageView, Role, Venue } from '../types';
import {
  Compass,
  Shield,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Volume2,
} from 'lucide-react';

interface HomePageProps {
  venues: Venue[];
  onNavigate: (page: PageView) => void;
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  venues,
  onNavigate,
  currentRole,
  onRoleChange,
}) => {
  // Feature the first 3 venues on the home page
  const featuredVenues = venues.slice(0, 3);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-section__container">
          <div className="hero-section__content">
            <div className="hero-badge">
              <Sparkles size={14} className="hero-badge__icon" />
              <span>Campus Bookings Outside Academic Hours</span>
            </div>

            <h1 id="hero-title" className="hero-title">
              Unlock School, University & Library Spaces for Your Community
            </h1>

            <p className="hero-description">
              Connect local organizers, sports leagues, theatre troupes, and study groups with vetted
              auditoriums, gymnasiums, labs, and reading halls during evenings and weekends.
              Fair public rates, automated campus rule checks, and transparent staff approvals.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="btn-primary btn-lg"
                onClick={() => onNavigate('venues')}
              >
                <Compass size={18} aria-hidden="true" />
                <span>Browse Available Venues</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="btn-secondary btn-lg"
                onClick={() => {
                  onRoleChange('staff');
                  onNavigate('staff');
                }}
              >
                <Shield size={18} aria-hidden="true" />
                <span>Staff Management Portal</span>
              </button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat__number">{venues.length}</span>
                <span className="hero-stat__label">Sample Campus Spaces</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat__number">3</span>
                <span className="hero-stat__label">Institution Types</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat__number">100%</span>
                <span className="hero-stat__label">Rule-Fit Verified</span>
              </div>
            </div>
          </div>

          <div className="hero-section__visual">
            <div className="hero-card-preview">
              <img
                src="/images/hero-venue.jpg"
                alt="Bright multi-purpose campus auditorium with stage and warm wood panels"
                className="hero-card-preview__image"
              />
              <div className="hero-card-preview__overlay">
                <div className="hero-card-preview__pill">
                  <GraduationCap size={14} /> High School Space
                </div>
                <h3 className="hero-card-preview__title">Oakridge Performing Arts Auditorium</h3>
                <p className="hero-card-preview__meta">
                  <Clock size={14} /> Evenings (18:00–22:00) & Weekends
                  <span className="hero-card-preview__separator">•</span>
                  <Users size={14} /> Seats 350
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section" aria-labelledby="hiw-title">
        <div className="section-container">
          <div className="section-header">
            <span className="section-eyebrow">Seamless Booking Journey</span>
            <h2 id="hiw-title" className="section-title">
              How OpenSpace Works
            </h2>
            <p className="section-subtitle">
              Designed specifically for educational institutions to safely welcome public events
              without disrupting academic schedules.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-card__icon-wrapper step-card__icon-wrapper--blue">
                <Compass size={24} />
                <span className="step-card__step-number">1</span>
              </div>
              <h3 className="step-card__title">1. Discover Spaces</h3>
              <p className="step-card__text">
                Browse school auditoriums, sports gyms, university lecture halls, and library
                galleries by location, capacity, and specialized equipment.
              </p>
            </div>

            <div className="step-card">
              <div className="step-card__icon-wrapper step-card__icon-wrapper--emerald">
                <CheckCircle2 size={24} />
                <span className="step-card__step-number">2</span>
              </div>
              <h3 className="step-card__title">2. Fit & Policy Check</h3>
              <p className="step-card__text">
                Input your event timing, attendance, and sound level. Our automated fit engine
                evaluates institution-configured rules instantly.
              </p>
            </div>

            <div className="step-card">
              <div className="step-card__icon-wrapper step-card__icon-wrapper--purple">
                <Shield size={24} />
                <span className="step-card__step-number">3</span>
              </div>
              <h3 className="step-card__title">3. Staff Approval</h3>
              <p className="step-card__text">
                Institution administrators review the request, ensure no academic conflict exists,
                and approve with optional coordination notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Sample Venues Preview */}
      <section className="featured-section" aria-labelledby="featured-title">
        <div className="section-container">
          <div className="section-header-flex">
            <div>
              <span className="section-eyebrow">Available Sample Venues</span>
              <h2 id="featured-title" className="section-title">
                Featured Campus Facilities
              </h2>
              <p className="section-subtitle">
                Sample spaces currently loaded into the prototype’s local storage.
              </p>
            </div>

            <button
              type="button"
              className="btn-outline"
              onClick={() => onNavigate('venues')}
            >
              <span>View All {venues.length} Venues</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="venue-cards-grid">
            {featuredVenues.map((venue) => (
              <article key={venue.id} className="venue-preview-card">
                <div className="venue-preview-card__image-box">
                  <img
                    src={venue.imageUrl}
                    alt={venue.name}
                    className="venue-preview-card__image"
                    loading="lazy"
                  />
                  <span className="venue-preview-card__badge">
                    {venue.institutionType === 'School' && <GraduationCap size={13} />}
                    {venue.institutionType === 'University' && <Building2 size={13} />}
                    {venue.institutionType === 'Library' && <BookOpen size={13} />}
                    <span>{venue.institutionType}</span>
                  </span>
                </div>

                <div className="venue-preview-card__body">
                  <div className="venue-preview-card__inst">{venue.institutionName}</div>
                  <h3 className="venue-preview-card__title">{venue.name}</h3>

                  <div className="venue-preview-card__meta">
                    <span className="meta-item">
                      <MapPin size={14} />
                      <span>{venue.city}</span>
                    </span>
                    <span className="meta-item">
                      <Users size={14} />
                      <span>Up to {venue.capacity} people</span>
                    </span>
                    <span className="meta-item">
                      <Volume2 size={14} />
                      <span>Max {venue.rules.maxSoundLevel} sound</span>
                    </span>
                  </div>

                  <p className="venue-preview-card__desc">{venue.description}</p>

                  <div className="venue-preview-card__facilities">
                    {venue.facilities.slice(0, 3).map((f) => (
                      <span key={f} className="facility-chip">
                        {f}
                      </span>
                    ))}
                    {venue.facilities.length > 3 && (
                      <span className="facility-chip facility-chip--more">
                        +{venue.facilities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="venue-preview-card__footer">
                    <div className="venue-price">
                      <span className="venue-price__amount">${venue.hourlyPrice}</span>
                      <span className="venue-price__unit">/ hour</span>
                    </div>

                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => onNavigate('venues')}
                    >
                      <span>Explore Space</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Mode Guide Banner */}
      <section className="demo-guide-section">
        <div className="section-container">
          <div className="demo-guide-card">
            <div className="demo-guide-card__header">
              <Sparkles size={20} className="demo-guide-card__sparkle" />
              <h3>Interactive Prototype Walkthrough</h3>
            </div>
            <p className="demo-guide-card__text">
              This application includes a two-sided demo workflow. Toggle between the roles at any
              point using the header switcher:
            </p>
            <div className="demo-roles-comparison">
              <div
                className={`demo-role-box ${currentRole === 'organizer' ? 'demo-role-box--current' : ''}`}
              >
                <div className="demo-role-box__header">
                  <h4>Community Organizer</h4>
                  {currentRole === 'organizer' && <span className="active-pill">Active</span>}
                </div>
                <p>
                  Explore sample campus venues, check event timing against after-hours rules, and
                  submit a test booking request.
                </p>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => {
                    onRoleChange('organizer');
                    onNavigate('venues');
                  }}
                >
                  Browse as Organizer
                </button>
              </div>

              <div
                className={`demo-role-box ${currentRole === 'staff' ? 'demo-role-box--current' : ''}`}
              >
                <div className="demo-role-box__header">
                  <h4>Institution Staff</h4>
                  {currentRole === 'staff' && <span className="active-pill">Active</span>}
                </div>
                <p>
                  Review incoming community booking requests, inspect scheduling conflicts, and
                  authorize or decline events with administrative notes.
                </p>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => {
                    onRoleChange('staff');
                    onNavigate('staff');
                  }}
                >
                  Open Staff Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
