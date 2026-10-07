import { useState } from 'react';
import SiteFooter from '../components/SiteFooter';
import ResponsiveImage from '../components/ResponsiveImage';
import { TEAM_SECTIONS, PROFESSORS, BIO_PLACEHOLDER } from '../data/team';
import PHOTOS from 'virtual:cupi-people-image-manifest';
import './Members.css';

// Rebuilt rather than ported. The old roster spent a 230px card and a sliding drawer on
// each person, which pushed 37 people over several screens. Here the tile is small, the
// name and role are always visible, and the bio comes up as an overlay on the portrait
// so opening one never reflows the grid.

// One photo per person for now; formal portraits will come back as a second file and a
// toggle when they are shot.
//
// Photos are imported rather than read from public/, so Vite fingerprints each filename
// with a content hash. Swapping someone's headshot then changes its URL, which is what
// stops browsers and the CDN serving the previous one from cache -- an unhashed
// /img/People/Jon.png is cached forever under the same name.
//
// What is imported is the `sized/` set, not the 600x680 crops beside it: a card is 96-135
// CSS px wide, so a 600px file was between four and six times the pixels any display could
// resolve, thirty-four times over. The crops stay in the repo as the framing of record
// (see photos/README.md) and are what scripts/build-assets.mjs cuts these from.
const PORTRAIT_VARIANT_WIDTHS = [160, 240, 320, 480];
const toSrcSet = (entries) =>
  entries.map((src, index) => `${src} ${PORTRAIT_VARIANT_WIDTHS[index]}w`).join(', ');

// Portraits are all one shape, so the box can be stated once rather than read per file.
const PORTRAIT_WIDTH = 600;
const PORTRAIT_HEIGHT = 680;

// Cards sit in a `repeat(auto-fill, minmax(118px, 1fr))` grid, which on a phone packs to
// roughly a third of the viewport and on a desktop settles near its 118px minimum.
const PORTRAIT_SIZES = '(max-width: 640px) 33vw, 160px';

const sourcesFor = (member) => {
  const entry = PHOTOS[member.imageBase] ?? PHOTOS.Placeholder;
  if (!entry) return null;
  const [avif, webp] = entry;
  return {
    avif: toSrcSet(avif),
    webp: toSrcSet(webp),
    src: webp[webp.length - 1],
    width: PORTRAIT_WIDTH,
    height: PORTRAIT_HEIGHT,
  };
};

const hasPhoto = (member) => Boolean(PHOTOS[member.imageBase]);

// "Co-Lead" must not break at its hyphen: "Computer Science Co-" over "Lead" read as a
// typo in a narrow column. Wrapped in a no-wrap span rather than given a non-breaking
// hyphen, which the subset Questrial does not carry.
const keepTogether = (text) =>
  text.split(/(Co-Lead)/).map((part, i) =>
    part === 'Co-Lead' ? (
      <span className="member__nowrap" key={i}>
        {part}
      </span>
    ) : (
      part
    ),
  );

// Role wins over class year; "First Year" reads better as "Freshman".
const metaFor = (member) => {
  if (member.role) return member.role;
  if (member.meta) return member.meta;
  if (member.year && member.year !== 'TBD') {
    return member.year === 'First Year' ? 'Freshman' : member.year;
  }
  return null;
};

function MemberCard({ member, isOpen, onToggle, eager }) {
  const meta = metaFor(member);
  const bio = member.bio ?? BIO_PLACEHOLDER;
  const hasBio = bio !== BIO_PLACEHOLDER;

  return (
    <article className={`member ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="member__frame"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={hasBio ? `Read about ${member.name}` : member.name}
      >
        <ResponsiveImage
          sources={sourcesFor(member)}
          sizes={PORTRAIT_SIZES}
          alt={member.name}
          draggable={false}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
        {!hasPhoto(member) && <span className="member__nophoto">photo coming soon</span>}
        <span className="member__bio">
          <span className="member__bio-text">{bio}</span>
        </span>
      </button>
      <p className="member__name">{member.name}</p>
      {meta && (
        <p className={`member__meta${member.role === 'Team Lead' ? ' is-lead' : ''}`}>
          {keepTogether(meta)}
        </p>
      )}
    </article>
  );
}

// How many cards to load without waiting for a scroll. The first section fills roughly
// two rows above the fold on a laptop; everything past that is lazy, which is now safe
// because each portrait carries its own dimensions and the grid therefore has its real
// height before any of them arrive.
const EAGER_CARDS = 12;

export default function Members() {
  const [openCard, setOpenCard] = useState(null);

  // There was a preload here that fetched all thirty-four portraits at high priority and
  // forced a decode on each. It fought its own `loading="lazy"`, and at 600px per file it
  // meant a megabyte before the roster could paint. At a card-sized 240px the whole set is
  // a fraction of that, so the images no longer need rescuing from their own weight.

  // Two rules, in order: the team lead heads the roster regardless of whether a headshot
  // exists yet, then anyone still awaiting one sinks to the end of their own section so
  // the placeholders group into a block instead of speckling the grid. Keyed on the role
  // rather than a name so it survives a change of lead. The sort is stable, so everything
  // else keeps the order it has in the data.
  const sections = [...TEAM_SECTIONS, { title: 'Faculty', members: PROFESSORS }].map(
    (section) => ({
      ...section,
      members: [...section.members].sort(
        (a, b) =>
          (a.role === 'Team Lead' ? 0 : 1) - (b.role === 'Team Lead' ? 0 : 1) ||
          Number(Boolean(b.imageBase)) - Number(Boolean(a.imageBase))
      ),
    })
  );

  return (
    <main className="alt-page">
      <div className="members">
        <div className="page-head">
          <h1 className="page-title">Members</h1>
        </div>

        {sections.map((section, sectionIndex) => (
          <section className="members__section block" key={section.title}>
            <h2 className="block-title">
              {section.title}
              <span className="block-count">{section.members.length}</span>
            </h2>
            <div className="members__grid">
              {section.members.map((member, index) => {
                const id = `${section.title}-${member.name}`;
                return (
                  <MemberCard
                    key={id}
                    member={member}
                    eager={sectionIndex === 0 && index < EAGER_CARDS}
                    isOpen={openCard === id}
                    onToggle={() => setOpenCard((prev) => (prev === id ? null : id))}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <SiteFooter />
    </main>
  );
}
