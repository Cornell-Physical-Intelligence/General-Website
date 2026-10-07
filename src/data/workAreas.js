export const WORK_AREAS = [
  {
    id: 'hexapod',
    title: 'Hexapod Locomotion',
    // Plays on its own when on screen; the other projects play on hover.
    autoplay: true,
    teaser: 'A six-legged walker with 18 direct-drive joints, developed simulation first in Isaac Sim.',
    ratio: '16 / 9',
    clips: [
      {
        src: '/media/hexapod-motions-960.mp4',
        poster: 'hexapod-motions',
        label: 'Play: twenty optimized hexapod motions replayed in Isaac Sim',
      },
      {
        src: '/media/hexapod-tripod-960.mp4',
        poster: 'hexapod-tripod',
        label: 'Play: the prescribed tripod gait walking forward in Isaac Sim',
      },
    ],
    summary: `The hexapod project continues from last semester, in collaboration with
      Cornell Geo Data. Version two is substantially larger with quasi direct drive motors
      instead of servos. Every structural part is metal, and all PCBs are custom. The
      walking is trained with PPO using motion priors, and the policy runs onboard on an
      Orin Jetson Nano.`,
    // Phrases in the summary that link out; the summary itself stays plain text for SEO.
    summaryLinks: [{ text: 'Cornell Geo Data', href: 'https://cornellgeodata.com/' }],
    links: [
      { label: 'Research log', href: 'https://cornell-physical-intelligence.github.io/hexapod-cupi/' },
      { label: 'Code', href: 'https://github.com/Cornell-Physical-Intelligence/hexapod-cupi' },
    ],
  },
  {
    id: 'manipulation',
    title: 'Robotic Manipulation Tasks',
    teaser: 'Fine-tuning π0.5, an open vision-language-action model, to the grippers and tasks in our lab.',
    ratio: '1 / 1',
    clips: [
      {
        src: '/media/arm-ball-960.mp4',
        poster: 'arm-ball',
        label: 'Play: a 3D-printed arm picking up a ball',
      },
      {
        src: '/media/arm-meat-960.mp4',
        poster: 'arm-meat',
        label: 'Play: a robot arm cutting on a processing line',
      },
    ],
    summary: `The clips above are our fine-tuned π0.5 policy running on our own arm.
      π0.5 is Physical Intelligence's open vision-language-action model, so we are not
      training from scratch: the released checkpoint brings broad manipulation priors
      from web and robot data, and our work is adapting it to the grippers, camera
      placement, and tasks in our lab.`,
  },
  {
    id: 'drone-racing',
    title: 'Autonomous Perception and Navigation',
    teaser: 'Racing autonomy for the Anduril AI Grand Prix. We passed Virtual Qualifier 1 with no learned network in the loop.',
    ratio: '4 / 3',
    clips: [
      {
        src: '/media/drone-sim-960.mp4',
        poster: 'drone-sim',
        label: 'Play: a quadrotor flying a simulated race course',
      },
      {
        src: '/media/drone-gates-960.mp4',
        poster: 'drone-gates',
        label: 'Play: an FPV replay showing gate detections and live telemetry',
      },
    ],
    summary: `We build the autonomy stack for the Anduril AI Grand Prix, an autonomous
      drone racing competition run with the Drone Champions League, and passed Virtual
      Qualifier 1 with a fully deterministic policy and no learned network in the loop.
      Virtual Qualifier 2 removes all pose and gate telemetry, leaving a monocular camera
      and IMU, so the policy now guides on bearings alone and reads closing rate from
      optical looming.`,
    partner: {
      href: 'https://theaigrandprix.com/',
      src: 'icons/ai-gp-logo-orange.svg',
      alt: 'AI Grand Prix',
    },
  },
];

export const normalizedWorkSummary = (area) => area.summary.replace(/\s+/g, ' ').trim();

// The summary split into text and link pieces, in order, for the Work page to render.
export const workSummaryParts = (area) => {
  let parts = [normalizedWorkSummary(area)];
  for (const link of area.summaryLinks ?? []) {
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return [part];
      const pieces = part.split(link.text);
      return pieces.flatMap((piece, i) => (i ? [link, piece] : [piece]));
    });
  }
  return parts.filter((part) => part !== '');
};
