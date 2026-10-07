export const BIO_PLACEHOLDER = '[coming soon]';

// Framing lives in the image files themselves: every crop is cut so the shoulder line
// sits at the same height and the shoulders are centred left to right (see photos/README).
// There is deliberately no per-person zoom here — one used to exist to patch the older,
// inconsistent crops, and it silently re-zoomed the aligned ones back out of line.

export const TEAM_SECTIONS = [
  {
    // The team lead sits at the head of Leads rather than in a section of one.
    title: 'Leads',
    members: [
      {
        name: 'Andre Boufama',
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
        imageBase: 'Jon',
        bio: "I'm really passionate about integrated electronics and anything robotics. In my free time I like to play ultimate frisbee and acoustic guitar",
        role: 'Electrical Co-Lead',
        project: 'Hexapod'
      },
      {
        name: 'Mic Robbins',
        imageBase: 'Mic',
        bio: "I'm an electrical engineer and like to play clash royale (15k)",
        role: 'Electrical Co-Lead',
        project: 'Quad'
      },
      {
        name: 'Alan Munschy',
        imageBase: 'Alan',
        bio: 'Hi, I like working on robot controls and I play chess',
        role: 'Mechanical Co-Lead',
        project: 'Hexapod'
      },
      {
        name: 'Ollie Aizer',
        imageBase: 'Ollie',
        bio: 'Hi, my name is Ollie and I like drone design and cooking.',
        role: 'Mechanical Co-Lead',
        project: 'Quad'
      },
      {
        name: 'James Cenawood',
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
        year: 'Sophomore',
        project: 'Quad'
      },
      {
        name: 'Aidan Moran',
        imageBase: 'Aidan',
        bio: BIO_PLACEHOLDER,
        role: 'Operations Co-Lead',
        year: 'Sophomore',
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
        imageBase: 'Youhanna',
        bio: BIO_PLACEHOLDER,
        role: 'Technical Project Manager'
      }
    ]
  },
  {
    title: 'Members',
    members: [
      {
        name: 'Nigel Tatem',
        imageBase: 'Nigel',
        bio: BIO_PLACEHOLDER,
        year: 'Junior'
      },
      {
        name: 'Nathan Cunningham',
        imageBase: 'Nathan',
        bio: "I'm interested in developing embedded systems. I enjoy running and eating",
        year: 'Freshman',
        project: 'Hexapod'
      },
      {
        name: 'Ronan Alo',
        imageBase: 'Ronan',
        bio: 'I am majoring in mechanical engineering and computer science, interested in drone pathing',
        year: 'Junior',
        project: 'Quad'
      },
      {
        name: 'Amanuel Adane',
        imageBase: 'Amanuel',
        bio: BIO_PLACEHOLDER,
        year: 'Freshman'
      },
      {
        name: 'Raymond Sheng',
        imageBase: 'Raymond',
        bio: BIO_PLACEHOLDER,
        year: 'Freshman'
      },
      {
        name: 'Shaurya Sen',
        imageBase: 'Shaurya',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Jonathan Bael',
        imageBase: 'JonBael',
        bio: BIO_PLACEHOLDER,
        year: 'Freshman'
      },
      {
        name: 'Ty Yue',
        imageBase: 'Ty',
        bio: BIO_PLACEHOLDER,
        year: 'Freshman'
      },
      {
        name: 'Alicia He',
        imageBase: 'Alicia',
        bio: BIO_PLACEHOLDER,
        year: 'Freshman'
      },
      {
        name: 'Mina Yeh',
        bio: BIO_PLACEHOLDER,
        year: 'Freshman'
      },
      {
        name: 'Vincent Yi',
        imageBase: 'Vincent',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Calvin Pang',
        imageBase: 'Calvin',
        bio: BIO_PLACEHOLDER,
        year: 'Sophomore'
      },
      {
        name: 'Suphia Zhang',
        imageBase: 'Suphia',
        bio: BIO_PLACEHOLDER,
        year: 'Freshman'
      },
      {
        name: 'Claire Shi',
        imageBase: 'Claire',
        bio: BIO_PLACEHOLDER,
        year: 'Freshman'
      },
      {
        name: 'Julian Gasharov',
        imageBase: 'Julian',
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
