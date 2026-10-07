import { useState } from 'react';
import VoronoiTitle from '../components/VoronoiTitle';
import MissionTiles from '../components/MissionTiles';
import WorkIndex from '../components/WorkIndex';
import SubteamPanel from '../components/SubteamPanel';
import Gallery from '../components/Gallery';
import SiteFooter from '../components/SiteFooter';

export default function Home({ titleApi, onNavigate }) {
  // Held here rather than in MissionTiles so the count-up and the stat fade-in only
  // play once per visit — remounting the section on navigation would otherwise replay it.
  const [missionTilesPlayed, setMissionTilesPlayed] = useState(false);

  const go = (event, page, hash) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate?.(page, hash);
  };

  return (
    <main className="page">
      <section className="hero">
        <div className="hero__intro">
          <h1 className="hero__title">
            <span className="visually-hidden">Cornell Physical Intelligence (CUPI)</span>
            <VoronoiTitle text="CUPI" apiRef={titleApi} />
          </h1>
          <p className="hero__subtitle">(Cornell University Physical Intelligence)</p>
        </div>
      </section>

      {/* Current work sits between the mission blurb and the stats, so the first thing
          under the blurb is what the team is building. */}
      <MissionTiles
        played={missionTilesPlayed}
        onPlay={() => setMissionTilesPlayed(true)}
      >
        <WorkIndex onNavigate={go} />
      </MissionTiles>

      <SubteamPanel />

      <Gallery />

      <SiteFooter />
    </main>
  );
}
