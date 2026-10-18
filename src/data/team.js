export const BIO_PLACEHOLDER = '[coming soon]';

// Framing lives in the image files themselves: every crop is cut so the shoulder line
// sits at the same height and the shoulders are centred left to right (see photos/README).
// There is deliberately no per-person zoom here — one used to exist to patch the older,
// inconsistent crops, and it silently re-zoomed the aligned ones back out of line.

// Roster and class years checked against CampusGroups on October 16, 2026.
// Undergraduate years reflect expected graduation in the 2026-27 academic year.
export const TEAM_SECTIONS = [
  {
    // The team lead sits at the head of Leads rather than in a section of one.
    title: 'Leads',
    members: [
      {
        name: 'Andre Boufama',
        year: 'Junior',
        imageBase: 'Andre',
        bio: "Hi I'm Andre. I like making websites and CAD and also eating",
        role: 'Team Lead',
        project: 'Everything'
      },
      {
        name: 'Nicholas Letendre',
        imageBase: 'NickLet',
        bio: "I'm Nicholas, and I study mechanical and aerospace engineering. I'm interested in programming for robotics and games.",
        role: 'Team Co-Lead',
        year: 'Junior',
        project: 'Hexapod'
      },
      {
        name: 'Jonathan Song',
        year: 'Junior',
        imageBase: 'Jon',
        bio: "I'm really passionate about integrated electronics and anything robotics. In my free time I like to play ultimate frisbee and acoustic guitar",
        role: 'Electrical Co-Lead',
        project: 'Hexapod'
      },
      {
        name: 'Mic Robbins',
        year: 'Junior',
        imageBase: 'Mic',
        bio: "I'm an electrical engineer and like to play clash royale (15k)",
        role: 'Electrical Co-Lead',
        project: 'Quad'
      },
      {
        name: 'Ollie Aizer',
        year: 'Sophomore',
        imageBase: 'Ollie',
        bio: 'Hi, my name is Ollie and I like drone design and cooking.',
        role: 'Mechanical Co-Lead',
        project: 'Quad'
      },
      {
        name: 'James Cenawood',
        year: 'Junior',
        imageBase: 'James',
        bio: BIO_PLACEHOLDER,
        role: 'Computer Science Co-Lead',
        project: 'Quad'
      },
      {
        name: 'Nick Lennon',
        role: 'Computer Science Co-Lead',
        imageBase: 'NickLennon',
        bio: 'Hey, my name is Nick Lennon and I am interested in software, firmware, modeling, team coordination, and spicy food!',
        year: 'Junior',
        project: 'Quad'
      },
      {
        name: 'Aidan Moran',
        imageBase: 'Aidan',
        bio: 'i like skiing reading and fortnite: battle royale',
        role: 'Operations Co-Lead',
        year: 'Junior',
        project: 'Business'
      },
      {
        name: 'Sophie Di',
        imageBase: 'Sophie',
        bio: "I'm a mechanical engineer and I love sketching, bouldering, and throwing paper airplanes",
        role: 'Creative Lead',
        year: 'Sophomore',
        project: 'Quad'
      },
      {
        name: 'Youhanna Meleka',
        year: 'Graduate',
        imageBase: 'Youhanna',
        bio: BIO_PLACEHOLDER,
        role: 'Technical Project Manager'
      },
      {
        name: 'Nathan Cunningham',
        imageBase: 'Nathan',
        bio: "I'm interested in developing embedded systems. I enjoy running and eating",
        role: 'Electrical Co-Lead',
        year: 'Sophomore',
        project: 'Hexapod'
      }
    ]
  },
  {
    title: 'Members',
    members: [
      {
        name: 'Amanuel Adane',
        imageBase: 'Amanuel',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Raymond Sheng',
        imageBase: 'Raymond',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Shaurya Sen',
        imageBase: 'Shaurya',
        bio: BIO_PLACEHOLDER,
        year: 'Junior'
      },
      {
        name: 'Jonathan Bael',
        imageBase: 'JonBael',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Ty Yue',
        imageBase: 'Ty',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Alicia He',
        imageBase: 'Alicia',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Mina Yeh',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Vincent Yi',
        imageBase: 'Vincent',
        bio: BIO_PLACEHOLDER,
        year: 'Junior'
      },
      {
        name: 'Calvin Pang',
        imageBase: 'Calvin',
        bio: BIO_PLACEHOLDER,
        year: 'Junior'
      },
      {
        name: 'Suphia Zhang',
        imageBase: 'Suphia',
        bio: 'I spend my free time gaming and sketching in black and white, and I believe white rice goes with anything.',
        year: 'Sophomore'
      },
      {
        name: 'Claire Shi',
        imageBase: 'Claire',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Julian Gasharov',
        imageBase: 'Julian',
        bio: BIO_PLACEHOLDER,
        year: 'Senior'
      },
      {
        name: 'Luke Evans',
        bio: 'Hi, I’m Luke. I enjoy reading philosophy and learning about propagating technology.',
        year: 'Junior'
      },
      {
        name: 'Carolyn Yu',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Hendry Xu',
        bio: "Hi! I'm from New Jersey and I love Lord of the Rings and hiking.",
        year: 'Freshman'
      },
      {
        name: 'Kevin Yan',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      }
    ]
  }
];

export const PROFESSORS = [
  {
    name: 'Prof. Jake Welde',
    imageBase: 'ProfWelde',
    bio: 'He has worked extensively in drone control systems',
    role: 'Faculty'
  },
  {
    name: 'Prof. Jingjie Yeo',
    imageBase: 'ProfYeo',
    bio: 'Joined Cornell in 2020 after research in Singapore and postdocs at Tufts & MIT.',
    role: 'Faculty'
  }
];
