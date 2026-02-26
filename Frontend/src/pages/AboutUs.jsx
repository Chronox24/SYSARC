import "../styles/AboutUs.css";

export default function AboutPage() {
  return (
    <section className="page-section">
      <div className="container">
        <div className="card">
          <header className="card-header">
            <h1 className="page-title">Welcome to Barangay 830</h1>
            <p className="lead">
              A short history and overview of our community
            </p>
          </header>

          <div className="card-body">
            <div>
              <p className="content-paragraph">
                Way back in the 1980s, almost all of the residents were active
                and retired soldiers and police officers, since the area was
                part of Malacañang. The leader at that time ordered that only
                families or relatives of soldiers and police were allowed to
                live there. But as time went on, other tenants who were not
                related to the soldiers or police also started living in the area.
              </p>

              <p className="content-paragraph">
                Their boundaries are: Estero de Pandacan on one side, Estero
                Heshus St. on the other, Pasig River to the north, and
                Sacaritas Heshus St., Pasig 1 to the south.
              </p>

              <p className="content-paragraph">
                Eventually, a condominium was built consisting of six buildings
                called Residencials de Manila. The population reached 5,736,
                with about 1,450 families.
              </p>
            </div>

            <aside className="illustration">
              <div className="blob" aria-hidden="true"></div>
            </aside>
          </div> {}
        </div> {}
      </div>
    </section>
  );
}
