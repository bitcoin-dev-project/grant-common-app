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
    apiUrl: process.env.OPENSATS_API_URL || 'https://opensats.org/api/github',
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
  maelstrom: {
    id: 'maelstrom',
    name: 'Maelstrom',
    description: 'Maelstrom supports Bitcoin developers working on tools and technologies that enhance Bitcoin\'s resilience, scalability, censorship resistance and privacy characteristics.',
    website: 'https://maelstrom.fund/bitcoin-grant-program/',
    logo: '/logos/maelstrom.png',
    active: true,
    workflowImplemented: false
  },
  spiral: {
    id: 'spiral',
    name: 'Spiral',
    description: 'Spiral is a team funded by Block that supports Bitcoin development through their FOSS Bitcoin Grants program.',
    website: 'https://spiral.xyz',
    logo: '/logos/spiral.svg',
    active: true,
    workflowImplemented: false
  }
};

export default organizations; 