import { CROWDFUNDING_URL } from '../data/crowdfunding';
import './CrowdfundingBanner.css';

export default function CrowdfundingBanner() {
  return (
    <a className="crowdfunding-banner" href={CROWDFUNDING_URL} target="_blank" rel="noreferrer">
      <span>Crowdfunding is open all November</span>
      <span className="crowdfunding-banner__cta">Support CUPI</span>
      <span className="crowdfunding-banner__arrow" aria-hidden="true">→</span>
    </a>
  );
}
