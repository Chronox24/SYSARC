import "../styles/AboutUs.css"

export default function MissionVisionPage() {
  return (
    <section className="page-section">
      <div className="container">
        <div className="card">
          <header className="card-header">
            <h1 className="page-title">Mission & Vision</h1>
            <p className="lead">Our purpose and the future we strive to achieve</p>
          </header>

          <div className="card-body">
            <h2 className="sub-title">Mission</h2>
            <p className="content-paragraph">
              Good public service and good governance ensure that government
              actions are transparent, accountable, and focused on meeting
              the needs of the people, promoting fairness, efficiency, and
              sustainable development.
            </p>

            <h2 className="sub-title">Vision</h2>
            <p className="content-paragraph">
              To serve our constituents with full dedication and effort,
              ensuring readiness to help at all times. To remain committed
              to providing service 24/7 to meet their needs.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
