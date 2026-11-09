import { useState } from 'react';
import PageViewer from './PageViewer';
import {
  REPORTS,
  getReportCover,
  getReportCoverSet,
} from '../data/reports';
import './TechnicalReports.css';

// Technical reports, sitting above the gallery and following its conventions: the same
// eyebrow label, the same shimmer-then-fade-in tile treatment, and the same lightbox
// shell. The difference is what the lightbox holds — a scrollable stack of page renders
// rather than a single image (PageViewer).
export default function TechnicalReports() {
  const [openReport, setOpenReport] = useState(null);

  if (REPORTS.length === 0) return null;

  return (
    <>
      <section className="reports-section">
        <h2 className="section-label">Technical Reports</h2>
        <div className="reports-grid">
          {REPORTS.map((report) => (
            <article className="report-card" key={report.slug}>
              <a
                className="report-card__cover"
                href={report.path}
                aria-label={`Open ${report.title}`}
                onClick={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  ) {
                    return;
                  }

                  event.preventDefault();
                  setOpenReport(report);
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                    setOpenReport(report);
                  }
                }}
              >
                {/* Not lazy. These sit below the fold, so lazy loading held the request
                    until the scroll almost reached them and the fade-in then waited on a
                    cold fetch. Loading eagerly at low priority starts them with the page
                    without competing with the hero, so they are decoded before arrival. */}
                <picture>
                  <source
                    type="image/avif"
                    srcSet={getReportCoverSet(report.slug, 'avif')}
                    sizes="240px"
                  />
                  <source
                    type="image/webp"
                    srcSet={getReportCoverSet(report.slug, 'webp')}
                    sizes="240px"
                  />
                  <img
                    draggable={false}
                    src={getReportCover(report.slug)}
                    alt={`First page of ${report.title}`}
                    width={240}
                    height={311}
                    decoding="async"
                    fetchPriority="low"
                    /* closest(), not parentElement: the parent is now <picture>, and the
                       skeleton sweep lives on the cover div outside it. */
                    onLoad={(e) => {
                      e.currentTarget.classList.add('loaded');
                      e.currentTarget.closest('.report-card__cover')?.classList.add('is-loaded');
                    }}
                    onError={(e) => {
                      e.currentTarget.classList.add('loaded');
                      e.currentTarget.closest('.report-card__cover')?.classList.add('is-loaded');
                    }}
                  />
                </picture>
              </a>
              <div className="report-card__meta">
                <h3 className="report-card__title">{report.title}</h3>
                <p className="report-card__subtitle">{report.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PageViewer doc={openReport} onClose={() => setOpenReport(null)} />
    </>
  );
}
