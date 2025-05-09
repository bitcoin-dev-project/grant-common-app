export type Organization = {
  id: string;
  name: string;
  description: string;
  website: string;
  logo?: string;
  apiUrl?: string;
  active: boolean;
  workflowImplemented?: boolean;
  workflowType?: 'api' | 'googleForm' | 'email' | 'custom';
  workflowConfig?: {
    // For API-based submissions
    apiHeaders?: Record<string, string>;
    apiMethod?: 'POST' | 'PUT';
    
    // For Google Form submissions
    formUrl?: string;
    formFields?: Record<string, string>; // Maps our field names to form field IDs
    
    // For email-based submissions
    emailRecipients?: string[];
    emailSubject?: string;
    
    // For custom submissions
    customHandler?: string; // Name of the handler function
  };
  fieldMapping?: Record<string, string>; // Maps common field names to org-specific field names
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
    workflowImplemented: true,
    workflowType: 'api',
    workflowConfig: {
      apiHeaders: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENSATS_API_KEY}`
      }
    },
    fieldMapping: {
      // No special mapping needed for OpenSats
    }
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
    workflowImplemented: true,
    workflowType: 'googleForm',
    workflowConfig: {
      formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSewRtvjps7eABRMR_w3Dn7KLnf2aDTUXpE-nX7IecKm_7nJxw/formResponse',
      formFields: {
        'email': 'entry.267422902',
        'name': 'entry.1152883307',
        'github_profile': 'entry.878663598',
        'residential_address': 'entry.1788647717',
        'citizenship_country': 'entry.510523878',
        'github_profile_alt': 'entry.298649089',
        'why_considered': 'entry.1057282536',
        'focus_area': 'entry.338152386',
        'reference_name': 'entry.1607764047',
        'reference_email': 'entry.1103553241'
      }
    },
    fieldMapping: {
      'your_name': 'name'
    }
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