export type Organization = {
  id: string;
  name: string;
  description: string;
  website: string;
  logo?: string;
  apiUrl?: string;
  active: boolean;
  workflowImplemented?: boolean;
}

const organizations: Record<string, Organization> = {
  opensats: {
    id: 'opensats',
    name: 'OpenSats',
    description: 'OpenSats is a nonprofit organization dedicated to supporting open-source Bitcoin and other free and open-source software projects.',
    website: 'https://opensats.org',
    logo: '/logos/opensats.png',
    apiUrl: process.env.OPENSATS_API_URL,
    active: true,
    workflowImplemented: true
  },
  brink: {
    id: 'brink',
    name: 'Brink',
    description: 'Brink empowers Bitcoin developers and researchers through funding, education, and mentoring.',
    website: 'https://brink.dev',
    logo: '/logos/brink.png',
    active: true,
    workflowImplemented: false
  },
  btrust: {
    id: 'btrust',
    name: 'Btrust',
    description: 'Btrust is a Bitcoin-focused trust dedicated to funding Bitcoin development and education throughout Africa and beyond.',
    website: 'https://btrust.tech',
    logo: '/logos/btrust.jpg',
    active: true,
    workflowImplemented: false
  },
  hrf: {
    id: 'hrf',
    name: 'Human Rights Foundation',
    description: 'The Human Rights Foundation supports Bitcoin developers working on tools and technologies that enhance financial privacy and sovereignty.',
    website: 'https://hrf.org/programs_posts/devfund/',
    logo: '/logos/hrf.png',
    apiUrl: process.env.HRF_MONDAY_API_URL || 'https://api.monday.com/v2',
    active: true,
    workflowImplemented: true
  },
  // Placeholder for future organizations
  // spiralbtc: {
  //   id: 'spiralbtc',
  //   name: 'Spiral',
  //   description: 'Spiral (formerly Square Crypto) is a team funded by Block that supports Bitcoin development.',
  //   website: 'https://spiral.xyz',
  //   logo: '/logos/spiral.png',
  //   apiUrl: 'https://api.spiral.xyz/applications',
  //   active: false
  // }
};

export default organizations; 