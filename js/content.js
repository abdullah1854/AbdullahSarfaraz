// Single source of visible portfolio content.
// Accurate profile, mirrored from https://abdullahsarfaraz.cloud (source of truth).

export const CONTENT = {
  brand: {
    initials: 'AS',
    name: 'Abdullah Sarfaraz',
    siteLinkText: 'abdullahsarfaraz.cloud',
    resumeLabel: 'LinkedIn',
    resumeUrl: 'https://www.linkedin.com/in/abdullah0094/',
  },

  nav: [
    { label: 'ABOUT', target: '#about' },
    { label: 'EXPERIENCE', target: '#career' },
    { label: 'WORK', target: '#work' },
    { label: 'CONTACT', target: '#contact' },
  ],

  social: [
    { type: 'github', label: 'GitHub', url: 'https://github.com/abdullah1854' },
    { type: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/abdullah0094/' },
    { type: 'email', label: 'Email', url: 'mailto:abdullah0094@gmail.com' },
    { type: 'website', label: 'Website', url: 'https://abdullahsarfaraz.cloud/' },
  ],

  hero: {
    greeting: "Hello! I'm",
    name: ['Abdullah', 'Sarfaraz'],
    roleTop: 'Solution Architect &',
    roleBig: 'AI Innovation Leader',
    subtitle:
      'Manager, IT System at Goldbell Group — driving ERP transformation and AI adoption with 8+ years of Microsoft Dynamics 365 F&O expertise.',
    badge: 'Based in Singapore · Open to consulting',
    stats: [
      { value: '8+', label: 'Years Experience' },
      { value: '20+', label: 'ERP Projects' },
      { value: '50%', label: 'Efficiency Gains' },
      { value: '15+', label: 'Certifications' },
    ],
    marquee: ['D365 F&O', 'Microsoft Copilot', 'Power Platform', 'Azure', 'AI Adoption', 'ERP Strategy'],
  },

  about: {
    eyebrow: 'About',
    title: 'I lead ERP transformation and AI adoption that real operations run on.',
    body:
      'Solution Architect and AI Innovation Leader with 8+ years in Microsoft Dynamics 365 Finance & Operations. As Manager, IT System at Goldbell Group in Singapore, I lead ERP and AI initiatives — pairing deep D365 integration work (Web Services, Logic Apps, Data Entities, OData) with Microsoft Copilot and Power Platform automation. My path runs through Accenture, OnActuate, PwC, CGI, and Microsenze Dynamics, with "Sparkling Star" and "ACE" recognition along the way.',
    facts: ['Goldbell Group · Singapore', 'MCT since 2020', '8+ yrs · D365 F&O'],
  },

  careerHeading: ['Career &', 'experience'],
  // Grouped by company → roles → bullet points (LinkedIn style). A role may carry its
  // own `company`/`location`; when a card mixes employers (the merged short stints), the
  // renderer tags each role with its real company so nothing is misrepresented.
  experience: [
    {
      company: 'Goldbell Group',
      location: 'Singapore',
      period: 'Oct 2022 — Present',
      current: true,
      roles: [
        {
          title: 'Manager, IT System',
          period: 'Jul 2025 — Present',
          duration: '4 mos',
          current: true,
          points: [
            'Spearheaded ERP and AI initiatives, aligning D365 F&O customization with business strategy.',
            'Led cross-functional teams to implement Microsoft Copilot, boosting operational efficiency by 50%.',
            'Drove adoption of intelligent automation tools, reducing process times and improving data accuracy.',
          ],
        },
        {
          title: 'Assistant Manager, IT System',
          period: 'Oct 2022 — Jul 2025',
          duration: '2 yrs 10 mos',
          points: [
            'Managed D365 F&O customizations and system integrations.',
            'Led AI adoption strategies and digital transformation initiatives.',
            'Collaborated with stakeholders to optimize business processes.',
          ],
        },
      ],
    },
    {
      company: 'Accenture',
      location: 'Noida, India',
      period: 'Sep 2021 — Oct 2022',
      roles: [
        {
          title: 'Application Development Senior Analyst',
          period: 'Sep 2021 — Oct 2022',
          duration: '1 yr 2 mos',
          points: [
            'Integration Lead on D365 F&O programs, designing integrations with Web Services, Logic Apps, Data Entities, and OData.',
            'Recognized with the "Sparkling Star" and "ACE" awards.',
          ],
        },
      ],
    },
    {
      company: 'Microsenze Dynamics',
      location: 'Noida, India',
      period: 'Dec 2019 — Sep 2021',
      roles: [
        {
          title: 'Senior Consultant — D365',
          company: 'OnActuate',
          location: 'Gurugram, India',
          period: 'May 2021 — Sep 2021',
          duration: '5 mos',
          points: [
            'Led the AX 2012 → Dynamics 365 F&O upgrade.',
            'Provided optimization support for existing D365 F&O implementations.',
          ],
        },
        {
          title: 'Senior Consultant',
          company: 'Microsenze Dynamics',
          location: 'Noida, India',
          period: 'Dec 2019 — May 2021',
          duration: '1 yr 6 mos',
          points: [
            'Delivered D365 F&O implementation projects.',
            'Provided technical consulting for enterprise clients.',
          ],
        },
      ],
    },
    {
      company: 'CGI',
      location: 'Bangalore, India',
      period: 'Sep 2018 — Nov 2019',
      roles: [
        {
          title: 'D365 Technical Consultant',
          company: 'PwC',
          location: 'Gurugram, India',
          period: 'Sep 2019 — Nov 2019',
          duration: '3 mos',
          points: [
            'Provided D365 technical consulting services.',
            'Supported client implementations and customizations.',
          ],
        },
        {
          title: 'Software Engineer',
          company: 'CGI',
          location: 'Bangalore, India',
          period: 'Sep 2018 — Jul 2019',
          duration: '10 mos',
          points: [
            'Developed software solutions for enterprise clients.',
            'Worked on Dynamics 365 and ERP projects.',
          ],
        },
      ],
    },
  ],

  projectsHeading: 'Selected work',
  projectsIntro:
    'Infrastructure, automation, and AI accelerators — built for real Microsoft Dynamics operations.',
  projectsAllUrl: 'https://github.com/abdullah1854',
  projects: [
    {
      title: 'MCP Gateway',
      type: 'AI Infrastructure',
      number: '01',
      description:
        'A universal Model Context Protocol gateway that aggregates many MCP servers behind a single secure endpoint, with orchestration, observability, and developer-friendly management for AI agents.',
      stack: 'TypeScript · MCP · Docker · Prometheus',
      points: ['One secure endpoint for many MCP servers', 'Orchestration + observability', 'Developer-friendly agent tooling'],
    },
    {
      title: 'SimpleQuran',
      type: 'Web & iOS',
      number: '02',
      description:
        'A clean, accessible Quran reading platform — web and native iOS — for browsing surahs, following translations, and listening to recitation, backed by Supabase.',
      stack: 'Next.js · TypeScript · Supabase · Swift / iOS',
      points: ['Web + native iOS (Swift) apps', 'Surahs, translation & audio recitation', 'Accessibility-first, audited UI'],
    },
    {
      title: 'KitchenGarden',
      type: 'Web App',
      number: '03',
      description:
        'A home kitchen-garden planner — track what to plant, when to water, and when to harvest across the growing season.',
      stack: 'JavaScript · HTML · CSS',
      points: ['Plant & watering schedule', 'Seasonal planting guide', 'Lightweight, no-login tracker'],
    },
    {
      title: 'D365 F&O Intelligent Automation Framework',
      type: 'Enterprise ERP',
      number: '04',
      description:
        'A custom automation framework for Microsoft Dynamics 365 F&O built on Power Platform and Azure services — cutting process times by 60%.',
      stack: 'D365 F&O · Power Platform · Azure · Logic Apps',
      points: ['60% faster processing', 'Power Platform + Azure automation', 'Reusable across modules'],
    },
    {
      title: 'Microsoft Copilot Integration Accelerator',
      type: 'AI & Automation',
      number: '05',
      description:
        'A pre-built integration package for rolling out Microsoft Copilot across D365 environments — achieving a 50% operational-efficiency boost.',
      stack: 'Copilot Studio · D365 · AI Services · Power Automate',
      points: ['50% efficiency gain', 'Drop-in Copilot for D365', 'Power Automate flows'],
    },
    {
      title: 'ERP Migration Toolkit (AX 2012 → D365)',
      type: 'Migration',
      number: '06',
      description:
        'A migration framework for upgrading AX 2012 to D365 F&O — data-migration scripts, customization templates, and testing automation that cut migration time by 40%.',
      stack: 'AX 2012 · D365 F&O · Azure DevOps · X++',
      points: ['40% faster migration', 'Data + customization templates', 'Testing automation'],
    },
  ],

  techHeading: 'My techstack',
  techSubheading: 'Grab, throw, and inspect the stack I use to ship enterprise Dynamics and AI work.',
  techstack: [
    { label: 'D365 F&O', accent: '#7c3aed' },
    { label: 'X++', accent: '#60a5fa' },
    { label: 'Copilot Studio', accent: '#22d3ee' },
    { label: 'Power Platform', accent: '#f59e0b' },
    { label: 'Power Automate', accent: '#5eead4' },
    { label: 'Azure', accent: '#38bdf8' },
    { label: 'Azure DevOps', accent: '#2496ed' },
    { label: 'SQL Server', accent: '#ef4444' },
    { label: 'Power BI', accent: '#f2c811' },
    { label: 'ETL · SSIS', accent: '#a78bfa' },
    { label: 'Data Warehousing', accent: '#34d399' },
    { label: 'AI Adoption', accent: '#ff4fd8' },
  ],

  contact: {
    heading: "Let's innovate",
    lead:
      'Transforming operations through AI and Microsoft technologies. Open to consulting, speaking, and strategic partnerships.',
    email: 'abdullah0094@gmail.com',
    location: 'Singapore',
    current: 'Manager, IT System · Goldbell Group',
    status: 'Open to consulting · replies within 24h',
    certifications: [
      'Microsoft Certified Trainer — since 2020',
      'MCSA: SQL 2016 BI Development',
      'Copilot Studio — Subject-Matter Expert',
    ],
  },

  footer: {
    text: 'Designed and developed by Abdullah Sarfaraz',
    year: '2026',
  },

  palette: {
    background: '#050810',
    surface: '#0a0e17',
    accent: '#5eead4',
    magenta: '#ff4fd8',
    ink: '#f6f8fb',
  },
};
