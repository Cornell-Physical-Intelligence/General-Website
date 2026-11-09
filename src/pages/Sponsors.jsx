import { useEffect, useRef, useState } from 'react';
import SiteFooter from '../components/SiteFooter';
import SponsorMark from '../components/SponsorMark';
import ResponsiveImage from '../components/ResponsiveImage';
import PageViewer from '../components/PageViewer';
import { SPONSOR_ART_PICTURES } from '../data/sponsorArt';
import { PACKET } from '../data/packet';
import { getReportPdf } from '../data/reports';
import { assetPath } from '../utils/assetPath';
import './Sponsors.css';

// Display order, top to bottom. Every tier shows whether or not it has sponsors yet.
const TIERS = [
  { key: 'gold', label: 'Gold' },
  { key: 'silver', label: 'Silver' },
  { key: 'bronze', label: 'Bronze' },
];

// `colour` marks artwork that carries its own brand colours, which the dark theme has to
// leave alone rather than invert. `lightMonochrome` marks official artwork supplied for
// a dark surface that needs a monochrome treatment on the optional light theme. `emblem`
// marks a tall, compact mark rather than a
// wordmark — matched on height it would look half the weight of its neighbours, so it runs
// taller. `wide` optically reduces an unusually broad wordmark. Without a logo file a mark
// gets drawn from the name.
// `art` names an entry in the generated image manifest; `logo` is a supplied asset path
// used as-is when the source artwork should not be generated or re-encoded.
const SPONSORS = [
  {
    name: 'CU GeoData',
    tier: 'gold',
    logo: 'icons/CUGeoData_Wordmark.png',
  },
  // Current Picogrid wordmark only; the older hexagon is retired.
  { name: 'Picogrid', tier: 'gold', logo: 'icons/Picogrid_Wordmark.svg', wide: true },
  { name: 'Modovolo', tier: 'silver', art: 'Modovolo_Logo', emblem: true },
  // Current vector wordmark from Onshape's own production website.
  {
    name: 'Onshape',
    tier: 'silver',
    logo: 'icons/Onshape_Wordmark.svg',
    colour: true,
    lightMonochrome: true,
  },
  { name: 'Tantalus', tier: 'bronze' },
  // Wikimedia Commons, public domain — the shield is below the threshold of originality.
  // Still a UPS trademark, so it stays unmodified.
  { name: 'UPS', tier: 'bronze', logo: 'icons/UPS_Logo.svg', colour: true, emblem: true },
];

// Marks are laid out by height, so the width they occupy varies per logo. These are the
// widest either can be drawn at, which is all the browser needs to rule out the 2x file
// on a 1x screen.
const LOGO_SIZES = '(max-width: 640px) 40vw, 220px';

const CONTACT = 'ab3233@cornell.edu';

export default function Sponsors() {
  const [copied, setCopied] = useState(false);
  const [packetOpen, setPacketOpen] = useState(false);
  const resetRef = useRef(null);

  useEffect(() => () => window.clearTimeout(resetRef.current), []);

  // Clicking the address copies it rather than launching a mail client, which on most
  // machines opens something nobody uses.
  const copyContact = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CONTACT);
      } else {
        // execCommand fallback for non-secure contexts, where the Clipboard API is absent.
        const field = document.createElement('textarea');
        field.value = CONTACT;
        field.setAttribute('readonly', '');
        field.style.position = 'absolute';
        field.style.left = '-9999px';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        document.body.removeChild(field);
      }
      setCopied(true);
      window.clearTimeout(resetRef.current);
      resetRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="alt-page">
      <div className="sponsors">
        {/* The wireframe is cropped at its base, so aligning that cut edge with the
            rule makes the leg read as rising out from behind the line. */}
        <div className="sponsors__masthead">
          {/* Drawn to a height of 13.5vw capped at 205px, and it is 3.53 times as wide as
              it is tall, so the width it occupies is 47.7vw until that cap bites at a
              1518px viewport. */}
          <ResponsiveImage
            sources={SPONSOR_ART_PICTURES.HexapodLegWireframe}
            sizes="(min-width: 1518px) 724px, 47.7vw"
            className="sponsors__art"
            alt=""
            aria-hidden="true"
            draggable={false}
            fetchPriority="low"
            decoding="async"
          />
          <div className="page-head">
            <h1 className="page-title">Sponsors</h1>
          </div>
        </div>

        <p className="sponsors__lede">
          CUPI builds the future of human robot interaction at Cornell. Robots and compute
          are super expensive, so we are extremely grateful for our awesome sponsors! To
          become one, read the{' '}
          {/* A plain click reads it here; a modified or middle click still gets the
              file in a new tab, which is what the href is for. */}
          <a
            href={getReportPdf(PACKET.slug)}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
              }
              event.preventDefault();
              setPacketOpen(true);
            }}
          >
            sponsorship packet
          </a>{' '}
          and write to{' '}
          <span className="sponsors__email-wrap">
            <button type="button" className="sponsors__email" onClick={copyContact}>
              {CONTACT}
            </button>
            <span className={`sponsors__copied ${copied ? 'is-visible' : ''}`} aria-hidden="true">
              copied!
            </span>
          </span>
          .
        </p>

        {TIERS.map(({ key, label }) => {
          const members = SPONSORS.filter((s) => s.tier === key);
          return (
            <section className="tier" key={key}>
              <h2 className={`tier__name tier__name--${key}`}>{label}</h2>
              {members.length > 0 && (
                <ul className="tier__list">
                  {members.map(({ name, logo, art, colour, lightMonochrome, emblem, wide }) => {
                    const markClass = [
                      colour && 'is-colour',
                      lightMonochrome && 'is-light-monochrome',
                      emblem && 'is-emblem',
                      wide && 'is-wide',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <li className="tier__sponsor" key={name}>
                        {/* No artwork on hand, so draw the lockup instead of dropping a
                            bare line of text into a row of logos. */}
                        {art && (
                          <ResponsiveImage
                            sources={SPONSOR_ART_PICTURES[art]}
                            sizes={LOGO_SIZES}
                            className={markClass}
                            alt={name}
                            draggable={false}
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        {!art && logo && (
                          <img
                            draggable={false}
                            className={markClass}
                            src={assetPath(logo)}
                            alt={name}
                            loading="lazy"
                          />
                        )}
                        {!art && !logo && <SponsorMark name={name} />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}

      </div>

      <SiteFooter />

      <PageViewer doc={packetOpen ? PACKET : null} onClose={() => setPacketOpen(false)} />
    </main>
  );
}
