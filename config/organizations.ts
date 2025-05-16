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
    // apiUrl: process.env.OPENSATS_API_URL || 'https://opensats.org/api/github',
    apiUrl: process.env.OPENSATS_API_URL,
    active: true,
    workflowImplemented: true,
    workflowType: 'api',
    workflowConfig: {
      apiHeaders: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENSATS_API_KEY}`
      },
      emailRecipients: process.env.OPENSATS_EMAIL_RECIPIENTS ? 
        process.env.OPENSATS_EMAIL_RECIPIENTS.split(',') : 
        []
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
    workflowImplemented: true,
    workflowType: 'email',
    workflowConfig: {
      emailRecipients: process.env.BRINK_EMAIL_RECIPIENTS ? 
        process.env.BRINK_EMAIL_RECIPIENTS.split(',') : 
        [],
      emailSubject: 'New Brink Grant Application'
    },
    fieldMapping: {
      'your_name': 'name',
      'email': 'email',
      'personal_website': 'website',
      'twitter_handle': 'twitter',
      'linkedin_profile': 'linkedin',
      'personal_github': 'github',
      'bitcoin_contributions': 'bitcoin_contributions',
      'project_description': 'project_description',
      'additional_info': 'additional_info',
      'grant_proposal': 'grant_proposal',
      'interview_availability': 'interview_availability',
      'satoshi_last_name': 'satoshi_last_name'
    }
  },
  btrust: {
    id: 'btrust',
    name: 'Btrust',
    description: 'Btrust is a Bitcoin-focused trust dedicated to funding Bitcoin development and education throughout Africa and beyond.',
    website: 'https://btrust.tech',
    logo: '/logos/btrust.jpg',
    active: true,
    workflowImplemented: true,
    workflowType: 'email',
    workflowConfig: {
      emailRecipients: process.env.BTRUST_EMAIL_RECIPIENTS ? 
        process.env.BTRUST_EMAIL_RECIPIENTS.split(',') : 
        [],
      emailSubject: 'New Btrust Grant Application'
    },
    fieldMapping: {
      'your_name': 'name',
      'email': 'email',
      'city': 'city',
      'country': 'country',
      'phone': 'telephone_number',
      'twitter_handle': 'twitter',
      'linkedin_profile': 'linkedin',
      'personal_github': 'github',
      'education': 'education',
      'work_experience': 'work_experience',
      'existing_funding': 'existing_funding',
      'technical_background': 'technical_background',
      'grant_purpose': 'grant_purpose',
      'project_details': 'project_details',
      'references': 'references',
      'additional_info': 'additional_info',
      'grant_proposal': 'grant_proposal'
    }
  },
  maelstrom: {
    id: 'maelstrom',
    name: 'Maelstrom',
    description: 'Maelstrom supports Bitcoin developers working on tools and technologies that enhance Bitcoin\'s resilience, scalability, censorship resistance and privacy characteristics.',
    website: 'https://maelstrom.fund/bitcoin-grant-program/',
    logo: '/logos/maelstrom.png',
    active: true,
    workflowImplemented: true,
    workflowType: 'email',
    workflowConfig: {
      emailRecipients: process.env.MAELSTROM_EMAIL_RECIPIENTS ? 
        process.env.MAELSTROM_EMAIL_RECIPIENTS.split(',') : 
        [],
      emailSubject: 'New Maelstrom Grant Application'
    },
    fieldMapping: {
      'your_name': 'name',
      'personal_github': 'github_profile',
      'focus_area_description': 'focus_area'
    }
  },
  spiral: {
    id: 'spiral',
    name: 'Spiral',
    description: 'Spiral is a team funded by Block that supports Bitcoin development through their FOSS Bitcoin Grants program.',
    website: 'https://spiral.xyz',
    logo: '/logos/spiral.svg',
    active: true,
    workflowImplemented: true,
    workflowType: 'email',
    workflowConfig: {
      emailRecipients: process.env.SPIRAL_EMAIL_RECIPIENTS ? 
        process.env.SPIRAL_EMAIL_RECIPIENTS.split(',') : 
        [],
      emailSubject: 'New Spiral Grant Application'
    },
    fieldMapping: {
      'your_name': 'name',
      'email': 'email',
      'personal_website': 'website',
      'twitter_handle': 'twitter',
      'personal_github': 'github',
      'project_description': 'project_description',
      'potential_impact': 'potential_impact',
      'short_description': 'short_description',
      'grant_proposal': 'grant_proposal',
      'additional_info': 'additional_info'
    }
  }
};

export default organizations; 