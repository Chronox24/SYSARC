import "../styles/AboutUs.css";

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-logo-container">
            <img src="/logo_brgy.png" alt="Barangay 830 Logo" className="hero-logo" />
          </div>
          <h1 className="hero-title">Barangay 830</h1>
          <p className="hero-subtitle">District VI, City of Manila</p>
          <p className="hero-lead">Committed to dedicated service and transparent governance since the 1980s.</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="about-container">
        {/* Mission & Vision Cards */}
        <div className="vision-mission-grid">
          <div className="info-card mission-card">
            <div className="card-icon">🎯</div>
            <h2 className="card-title">Our Mission</h2>
            <p>Good public service and good governance ensure that government actions are transparent, accountable, and focused on meeting the needs of the people, promoting fairness, efficiency, and sustainable development.</p>
          </div>
          
          <div className="info-card vision-card">
            <div className="card-icon">✨</div>
            <h2 className="card-title">Our Vision</h2>
            <p>To serve our constituents with full dedication and effort, ensuring readiness to help at all times. To remain committed to providing service 24/7 to meet their needs.</p>
          </div>
        </div>

        {/* History Section */}
        <section className="history-section">
          <div className="history-content">
            <h2 className="section-title">The Story of Brgy. 830</h2>
            <div className="history-grid">
              <div className="history-text">
                <p>
                  Way back in the 1980s, almost all of the residents were active
                  and retired soldiers and police officers, since the area was
                  part of Malacañang. The leader at that time ordered that only
                  families or relatives of soldiers and police were allowed to
                  live there.
                </p>
                <p>
                  As time went on, other tenants who were not related to the soldiers or 
                  police also started living in the area. Today, the population has 
                  reached 5,736, with about 1,450 families residing in the community.
                </p>
                <p>
                  Eventually, a condominium was built consisting of six buildings
                  called Residencials de Manila, marking a new chapter in our 
                  barangay's growth and development.
                </p>
              </div>
              <div className="history-details">
                <div className="detail-item">
                  <strong>Boundaries</strong>
                  <p>Estero de Pandacan, Estero Heshus St., Pasig River, and Sacaritas Heshus St.</p>
                </div>
                <div className="detail-item">
                  <strong>Landmark</strong>
                  <p>Residencials de Manila (6 Buildings)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Decoration */}
      <footer className="about-footer">
        <p>© 2024 Barangay 830, District VI, City of Manila. All rights reserved.</p>
      </footer>
    </div>
  );
}

