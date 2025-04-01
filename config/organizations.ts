export type Organization = {
  id: string;
  name: string;
  description: string;
  website: string;
  logo: string;
  apiUrl: string;
  active: boolean;
}

const organizations: Record<string, Organization> = {
  opensats: {
    id: 'opensats',
    name: 'OpenSats',
    description: 'OpenSats is a nonprofit organization dedicated to supporting open-source Bitcoin and other free and open-source software projects.',
    website: 'https://opensats.org',
    logo: '/logos/opensats.png',
    apiUrl: process.env.OPENSATS_API_URL || 'https://opensats.org/api/github',
    active: true
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