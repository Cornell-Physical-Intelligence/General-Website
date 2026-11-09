import { useEffect, useState } from 'react';
import Overlay from './Overlay';
import ResponsiveImage from './ResponsiveImage';
import { REPORT_PAGE_SIZES, getReportPagePicture, getReportPdf } from '../data/reports';
import './PageViewer.css';

// A PDF read in place: the lightbox shell holding a scrollable stack of page renders,
// with the file itself one click away. The technical reports open in it, and so does the
// sponsorship packet. Pages are images rather than an embedded PDF so the viewer can be
// styled and scrolled like the rest of the site instead of handing off to the browser's
// built-in reader, which we can't theme and which degrades badly on mobile.
//
// `doc` is `{ slug, title, pageCount }` while open and null while closed. Its renders and
// its PDF live where `getReportPagePicture` and `getReportPdf` say.
export default function PageViewer({ doc, onClose }) {
  // What was open when the viewer started closing, so it still has pages to draw while
  // it fades out. Escape is handled by Overlay.
  const [last, setLast] = useState(doc);
  if (doc && doc !== last) setLast(doc);
  const shown = doc ?? last;
  const open = Boolean(doc);

  // Blur the glass bar (shared with the gallery) and lock the page behind the viewer, so
  // a scroll gesture inside the modal can't chain through to the document underneath.
  useEffect(() => {
    document.body.classList.toggle('lightbox-open', open);
    document.body.classList.toggle('report-viewer-open', open);
    return () => {
      document.body.classList.remove('lightbox-open');
      document.body.classList.remove('report-viewer-open');
    };
  }, [open]);

  return (
    <Overlay
      open={open}
      onClose={onClose}
      className="report-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={shown?.title}
    >
      {shown && (
        <>
          <div className="report-viewer__bar" onClick={(e) => e.stopPropagation()}>
            <span className="report-viewer__name">{shown.title}</span>
            <span className="report-viewer__actions">
              {/* Glyph, not the word "PDF": you are already looking at the document, so
                  the only thing worth saying here is that this fetches the file. */}
              <a
                className="report-viewer__download"
                href={getReportPdf(shown.slug)}
                target="_blank"
                rel="noreferrer"
                aria-label="Download the PDF"
                title="Download PDF"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M12 3v12" />
                  <polyline points="7 10 12 15 17 10" />
                  <path d="M4 20h16" />
                </svg>
              </a>
              <button
                className="report-viewer__close"
                onClick={onClose}
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
            </span>
          </div>

          {/* The scroll container. stopPropagation keeps a click on a page from
              reaching the backdrop's close handler. */}
          <div
            className="report-viewer__scroll"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Only the opening spread is worth blocking on; the rest stream in as the
                reader scrolls. That was always the intent, but it did not happen: an
                <img> with no width or height is zero pixels tall until its bytes land,
                so all sixteen pages stacked inside one screen, every one of them counted
                as near the viewport, and `loading="lazy"` fetched the entire report on
                open — 2.8MB to read page one. ResponsiveImage carries the encoded
                dimensions, which gives each page a real height before it loads and lets
                the browser defer the ones genuinely further down. */}
            {Array.from({ length: shown.pageCount }, (_, i) => (
              <ResponsiveImage
                key={i}
                sources={getReportPagePicture(shown.slug, i + 1)}
                sizes={REPORT_PAGE_SIZES}
                className="report-viewer__page"
                alt={`Page ${i + 1} of ${shown.pageCount}`}
                draggable={false}
                loading={i < 2 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                decoding="async"
              />
            ))}
          </div>
        </>
      )}
    </Overlay>
  );
}
