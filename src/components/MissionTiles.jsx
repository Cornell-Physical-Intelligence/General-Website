import { useEffect, useRef } from 'react';
import CountUp from './CountUp';
import './MissionTiles.css';

const stats = [
  { label: 'Members', value: 35 },
  { label: 'Subteams', value: 4 }
];

function MissionTiles({ played, onPlay, children }) {
  const statRefs = useRef([]);
  const blurbRef = useRef(null);

  // The tiles rise into place on first scroll-in. The transition itself is in the
  // stylesheet; all this does is decide when to add the class.
  //
  // `rootMargin: '0px 0px -15% 0px'` pulls the trigger line up to 15% above the viewport
  // bottom, which is what ScrollTrigger's `top bottom-=15%` meant.
  useEffect(() => {
    const elements = statRefs.current.filter(Boolean);
    if (elements.length === 0) return undefined;

    if (played) {
      elements.forEach((el) => el.classList.add('is-instant', 'is-revealed'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
          onPlay?.();
        }
      },
      { rootMargin: '0px 0px -15% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [played, onPlay]);

  // Finalize blurb box on scroll (dotted → solid, tag flash out)
  useEffect(() => {
    const el = blurbRef.current;
    if (!el) return;
    let timer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            el.classList.add('is-finalized');
          }, 800);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);

  return (
    <section className="mission-tiles">
      <div className="mission-tiles__content">
        <div className="mission-tiles__blurb-wrapper" ref={blurbRef}>
          <p className="mission-tiles__blurb">
            At CUPI, we aim to create physical systems that can intelligently reason and
            interact with their environments. The gap between AI software and hardware
            needs to be closed seamlessly, and through our multidisciplinary team, we
            pursue this symbiosis. We prioritize creative, ambitious, and self-starting
            thinkers, because the problems worth solving here do not come with
            instructions.
          </p>
        </div>
        {children}
        <div className="mission-tiles__stats" aria-label="Team scale insights">
          {stats.map((stat, index) => (
            <div
              className="mission-stat"
              key={stat.label}
              ref={(el) => {
                statRefs.current[index] = el;
              }}
            >
              <CountUp
                from={0}
                to={stat.value}
                separator=","
                direction="up"
                duration={1.5}
                className="mission-stat__value"
              />
              <span className="mission-stat__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MissionTiles;
