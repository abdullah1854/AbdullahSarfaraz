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
      { value: '8+', label: 'Years Experience', note: 'D365 + AI delivery' },
      { value: '20+', label: 'ERP Projects', note: 'Implementations & upgrades' },
      { value: '50%', label: 'Efficiency Gains', note: 'Automation-led outcomes' },
      { value: '15+', label: 'Certifications', note: 'Microsoft ecosystem' },
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
          duration: '11 mos',
          durationMonths: 11,
          current: true,
          points: [
            'Spearheaded ERP and AI initiatives, aligning D365 F&O customization with business strategy.',
            'Led cross-functional teams to roll out Microsoft Copilot across operations, lifting day-to-day efficiency.',
            'Drove adoption of intelligent automation tools, reducing process times and improving data accuracy.',
          ],
        },
        {
          title: 'Assistant Manager, IT System',
          period: 'Oct 2022 — Jul 2025',
          duration: '2 yrs 10 mos',
          durationMonths: 34,
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
          durationMonths: 14,
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
          durationMonths: 5,
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
          durationMonths: 18,
          points: [
            'Built and configured D365 F&O modules through full implementation cycles, from design to go-live.',
            'Advised enterprise clients on solution design and resolved post-go-live technical issues.',
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
          durationMonths: 3,
          points: [
            'Delivered D365 technical consulting on client engagements, translating requirements into working configurations.',
            'Supported implementations with X++ customizations and data-migration fixes.',
          ],
        },
        {
          title: 'Software Engineer',
          company: 'CGI',
          location: 'Bangalore, India',
          period: 'Sep 2018 — Jul 2019',
          duration: '10 mos',
          durationMonths: 10,
          points: [
            'Developed and tested ERP features for enterprise clients across the delivery lifecycle.',
            'Contributed to Dynamics 365 build and customization work within project teams.',
          ],
        },
      ],
    },
  ],

  projectsHeading: 'Selected work',
  projectsIntro:
    'Enterprise Dynamics accelerators alongside personal builds — infrastructure, automation, and AI, shipped end to end.',
  projectsAllUrl: 'https://github.com/abdullah1854',
  projects: [
    {
      title: 'MCP Gateway',
      type: 'AI Infrastructure',
      number: '01',
      impact: 'Secure AI-agent operations',
      description:
        'A universal Model Context Protocol gateway that aggregates many MCP servers behind a single secure endpoint, with orchestration, observability, and developer-friendly management for AI agents.',
      stack: 'TypeScript · MCP · Docker · Prometheus',
      points: ['One secure endpoint for many MCP servers', 'Orchestration + observability', 'Developer-friendly agent tooling'],
    },
    {
      title: 'SimpleQuran',
      type: 'Web & iOS',
      number: '02',
      impact: 'Accessible Quran reading',
      description:
        'A clean, accessible Quran reading platform — web and native iOS — for browsing surahs, following translations, and listening to recitation, backed by Supabase.',
      stack: 'Next.js · TypeScript · Supabase · Swift / iOS',
      points: ['Web + native iOS (Swift) apps', 'Surahs, translation & audio recitation', 'Accessibility-first, audited UI'],
    },
    {
      title: 'KitchenGarden',
      type: 'Web App',
      number: '03',
      impact: 'Personalized care schedule',
      description:
        'A dynamic plant-care scheduler based on the Kitchen Garden Fertilizer guide — generates a personalized 6-to-12-month care calendar and auto-resolves conflicts between incompatible treatments.',
      stack: 'JavaScript · HTML · CSS · PWA',
      points: ['Personalized 6–12 month care calendar', 'Smart treatment-conflict resolution', 'Installable PWA — no manual date tracking'],
    },
    {
      title: 'D365 F&O Intelligent Automation Framework',
      type: 'Enterprise ERP',
      number: '04',
      impact: 'Lower manual processing',
      description:
        'A custom automation framework for Microsoft Dynamics 365 F&O built on Power Platform and Azure services — cutting manual processing time on repetitive, high-volume workflows.',
      stack: 'D365 F&O · Power Platform · Azure · Logic Apps',
      points: ['Cuts manual processing time on repetitive workflows', 'Power Platform + Azure automation', 'Reusable across modules'],
    },
    {
      title: 'Microsoft Copilot Integration Accelerator',
      type: 'AI & Automation',
      number: '05',
      impact: 'Faster Copilot rollout',
      description:
        'A pre-built integration package for rolling out Microsoft Copilot across D365 environments — a measurable lift in operational efficiency from day one.',
      stack: 'Copilot Studio · D365 · AI Services · Power Automate',
      points: ['Faster operational throughput', 'Drop-in Copilot for D365', 'Power Automate flows'],
    },
    {
      title: 'ERP Migration Toolkit (AX 2012 → D365)',
      type: 'Migration',
      number: '06',
      impact: 'Repeatable AX-to-D365 migration',
      description:
        'A migration framework for upgrading AX 2012 to D365 F&O — data-migration scripts, customization templates, and testing automation that shorten upgrade cycles with repeatable, low-risk tooling.',
      stack: 'AX 2012 · D365 F&O · Azure DevOps · X++',
      points: ['Shortens upgrade cycles with repeatable tooling', 'Data + customization templates', 'Testing automation'],
    },
  ],

  techHeading: 'My techstack',
  // Positioning line only. The device/interaction instruction lives in `techHint`,
  // which techstack.js surfaces device-adaptively (cursor vs touch wording).
  techSubheading: 'The stack I use to ship enterprise Dynamics and AI work.',
  techHint: { fine: 'Move your cursor anywhere — grab, throw & inspect.', touch: 'Tap, drag & fling the stack.' },
  techCategories: [
    { id: 'erp', label: 'ERP core', accent: '#7c3aed' },
    { id: 'ai', label: 'AI automation', accent: '#ff4fd8' },
    { id: 'cloud', label: 'Cloud delivery', accent: '#38bdf8' },
    { id: 'data', label: 'Data & BI', accent: '#34d399' },
  ],
  techstack: [
    { label: 'D365 F&O', accent: '#7c3aed', category: 'erp' },
    { label: 'X++', accent: '#60a5fa', category: 'erp' },
    { label: 'Copilot Studio', accent: '#22d3ee', category: 'ai' },
    { label: 'Power Platform', accent: '#f59e0b', category: 'ai' },
    { label: 'Power Automate', accent: '#5eead4', category: 'ai' },
    { label: 'Azure', accent: '#38bdf8', category: 'cloud' },
    { label: 'Azure DevOps', accent: '#2496ed', category: 'cloud' },
    { label: 'SQL Server', accent: '#ef4444', category: 'data' },
    { label: 'Power BI', accent: '#f2c811', category: 'data' },
    { label: 'ETL · SSIS', accent: '#a78bfa', category: 'data' },
    { label: 'Data Warehousing', accent: '#34d399', category: 'data' },
    { label: 'AI Adoption', accent: '#ff4fd8', category: 'ai' },
  ],

  contact: {
    heading: "Let's innovate",
    lead:
      'Transforming operations through AI and Microsoft technologies. Open to consulting, speaking, and strategic partnerships.',
    email: 'abdullah0094@gmail.com',
    location: 'Singapore',
    current: 'Manager, IT System · Goldbell Group',
    status: 'Open to consulting · usually replies within a day',
    ctaLabel: 'Book a conversation',
    ctaSubject: 'Consulting enquiry via abdullahsarfaraz.cloud',
    // 15+ certifications held in total (see hero stat); the list below is a curated subset.
    certificationsNote: 'A selection from 15+ certifications',
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
