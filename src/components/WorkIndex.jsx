import HoverVideo from './HoverVideo';
import { WORK_AREAS } from '../data/workAreas';
import './WorkIndex.css';

// The homepage's view of the Work page: one card per project, each a hover-to-play clip
// (still frame until asked, exactly as on Work), a title that links to that project's
// section, and one line on what it is. The detail lives on Work; this is the index.
//
// Every card shares one 4:3 frame so the row reads as a set, which is why each project
// names the clip that survives that crop best.
const CARD_CLIP = {
  hexapod: '/media/hexapod-tripod-960.mp4',
  manipulation: '/media/arm-ball-960.mp4',
  'drone-racing': '/media/drone-sim-960.mp4',
};

// Three across a 1100px row, one per row below 720px.
const CARD_SIZES = '(max-width: 720px) 92vw, 360px';

export default function WorkIndex({ onNavigate }) {
  return (
    <section className="work-index" aria-labelledby="work-index-title">
      <h2 className="section-label" id="work-index-title">
        Current Work
      </h2>
      <ul className="work-index__list">
        {WORK_AREAS.map((area) => {
          const clip = area.clips.find((c) => c.src === CARD_CLIP[area.id]) ?? area.clips[0];
          return (
            <li className="work-index__item" key={area.id}>
              <div className="work-index__media">
                {/* Lazy: on the homepage these sit a screen and a half down, and the
                    first visit should spend its bytes on the hero. */}
                <HoverVideo
                  {...clip}
                  ratio="4 / 3"
                  sizes={CARD_SIZES}
                  loading="lazy"
                  autoplay={area.autoplay}
                />
              </div>
              <h3 className="work-index__title">
                <a
                  href={`/work/#${area.id}`}
                  onClick={(event) => onNavigate?.(event, 'work', area.id)}
                >
                  {area.title}
                </a>
              </h3>
              <p className="work-index__teaser">{area.teaser}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
