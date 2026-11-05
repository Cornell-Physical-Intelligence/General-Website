// The November 2026 crowdfunding banner. Everything that changes between campaigns is here.

export const CROWDFUNDING_URL =
  'https://securelb.imodules.com/s/1717/giving/interior.aspx?sid=1717&gid=2&pgid=16421&cid=27217&dids=5762&bledit=1&sort=1&appealcode=AW27FOCR';

// The site is static, so the banner takes itself down instead of waiting on a deploy:
// the first moment of December 1 in Ithaca.
const CLOSES_AT = Date.parse('2026-12-01T00:00:00-05:00');

export const crowdfundingOpen = Date.now() < CLOSES_AT;
