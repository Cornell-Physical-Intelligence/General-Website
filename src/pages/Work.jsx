import HoverVideo from '../components/HoverVideo';
import TechnicalReports from '../components/TechnicalReports';
import SiteFooter from '../components/SiteFooter';
import { WORK_AREAS, workSummaryParts } from '../data/workAreas';
import { assetPath } from '../utils/assetPath';
import './Work.css';

// The team's projects, stacked one over another. Each area is a label, a pair of
// hover-to-play clips, a short summary, and any outbound links or partner mark. Each
// carries an id so the homepage can link straight to it.
//
// `ratio` is per-area because the source footage differs: the arm clips are encoded
// square, the drone clips 4:3, the hexapod's Isaac Sim captures 16:9. Forcing the drone
// pair into a square tile would crop the gate-detection telemetry off the edges of the
// frame.
//
// The `-960` clips are the served re-encodes (see scripts/build-assets.mjs); the masters
// they came from sit beside them in public/media and are never requested.
export default function Work() {
  return (
    <main className="alt-page">
      <h1 className="visually-hidden">Robotics Projects and Technical Reports</h1>

      <section className="work-stack">
        {WORK_AREAS.map((area) => (
          <article className="work-area" key={area.title} id={area.id}>
            <h2 className="section-label">{area.title}</h2>

            <div className="work-area__clips">
              {area.clips.map((clip) => (
                <HoverVideo key={clip.src} {...clip} ratio={area.ratio} autoplay={area.autoplay} />
              ))}
            </div>

            <p className="work-area__summary">
              {workSummaryParts(area).map((part, i) =>
                typeof part === 'string' ? (
                  part
                ) : (
                  <a key={i} href={part.href} target="_blank" rel="noreferrer">
                    {part.text}
                  </a>
                ),
              )}
            </p>

            {(area.links || area.partner) && (
              <div className="work-area__footer">
                {area.links && (
                  <ul className="work-area__links">
                    {area.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} target="_blank" rel="noreferrer">
                          {link.label}
                          <span aria-hidden="true"> ↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {area.partner && (
                  <a
                    className="work-area__partner"
                    href={area.partner.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={area.partner.alt}
                  >
                    <img draggable={false} src={assetPath(area.partner.src)} alt={area.partner.alt} loading="lazy" />
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </section>

      {/* The write-ups follow the projects they come from. */}
      <TechnicalReports />
      <SiteFooter />
    </main>
  );
}
