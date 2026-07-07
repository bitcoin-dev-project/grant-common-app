import { COUNTRY_OPTIONS } from "./countries";

// Field types supported in the application form
export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'select'
  | 'checkbox'
  | 'file'
  | 'date';

// Field definition interface
export interface FieldDefinition {
  id: string;
  label: string;
  description?: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  organizations?: string[]; // Organizations that use this field
  section: string; // Form section this field belongs to
  accept?: string; // file fields: allowed extensions, e.g. ".pdf,.doc,.docx"
  maxSizeMB?: number; // file fields: max size in MB
  validation?: 'url' | 'phone'; // text fields: format check
  minWords?: number; // textarea: minimum word count
}

// Define the form sections
export const formSections = [
  { id: "organization", label: "Organization" },
  { id: "project", label: "Project Details" },
  { id: "source", label: "Source Code" },
  { id: "timeline", label: "Timeline" },
  { id: "budget", label: "Budget" },
  { id: "applicant", label: "Applicant" },
  { id: "references", label: "References" },
  { id: "other", label: "Review Your Application" }
];

// Define all possible fields
export const allFields: FieldDefinition[] = [
  // Organization selection field (special handling)
  {
    id: "organizations",
    label: "Organizations",
    description: "Select the organizations you want to apply to",
    type: "checkbox",
    required: true,
    section: "organization"
  },
  
  // Project Details section
  {
    id: "project_name",
    label: "Project Name",
    description: "The name of the project. Abbreviations are fine too.",
    type: "text",
    required: true,
    organizations: ["spiral"],
    section: "project"
  },
  // Consolidated project description field
  {
    id: "project_description",
    label: "Project Description",
    description: "Provide a clear description of your project, including its purpose, deliverables, and timeline.",
    type: "textarea",
    required: true,
    minWords: 10,
    placeholder: "Describe your project in detail, including its purpose, who it serves, what problem it solves, deliverables, and timeline.",
    organizations: ["spiral", "brink", "btrust", "maelstrom"],
    section: "project"
  },
  {
    id: "potential_impact",
    label: "Potential Impact",
    description: "Why is this project important to Bitcoin or the broader free and open-source community?",
    type: "textarea",
    required: true,
    placeholder: "Describe how your project will benefit the Bitcoin ecosystem or open-source community. Include potential use cases, user base, and long-term impact.",
    organizations: ["spiral"],
    section: "project"
  },
  {
    id: "focus_area_description",
    label: "Main Area of Focus",
    description: "What will be your main area of focus (during next 12 months) if you are awarded a grant?",
    type: "textarea",
    required: true,
    organizations: ["maelstrom"],
    section: "project"
  },
  {
    id: "grant_purpose",
    label: "Grant Purpose",
    description: "Why do you need this grant? Explain your goals and how the grant will enable you to achieve them.",
    type: "textarea",
    required: true,
    placeholder: "Explain your goals and how the grant will help you achieve them",
    organizations: ["btrust"],
    section: "project"
  },
  
  // Source Code section
  {
    id: "free_open_source",
    label: "Is this project free and open-source software?",
    type: "checkbox",
    required: true,
    organizations: ["spiral"],
    section: "source"
  },
  {
    id: "license",
    label: "License",
    description: "What license does your project use?",
    type: "text",
    required: true,
    organizations: ["spiral"],
    section: "source"
  },
  {
    id: "github",
    label: "Project GitHub",
    description: "Link to the project's GitHub repository or other code hosting platform.",
    type: "text",
    validation: "url",
    placeholder: "https://github.com/org/repo",
    organizations: ["spiral"],
    section: "source"
  },
  
  // Budget section
  // Consolidated funding information field
  {
    id: "existing_funding",
    label: "Existing Grant Funding",
    description: "Has this project received any prior funding? If so, please describe.",
    type: "textarea",
    placeholder: "Please describe any existing funding or pending applications",
    organizations: ["btrust"],
    section: "budget"
  },
  
  // Applicant section
  {
    id: "your_name",
    label: "Your Name",
    description: "Feel free to use your nym.",
    type: "text",
    required: true,
    placeholder: "John Doe",
    organizations: ["maelstrom", "brink", "spiral", "btrust"],
    section: "applicant"
  },
  {
    id: "email",
    label: "Email",
    type: "email",
    required: true,
    placeholder: "satoshin@gmx.com",
    organizations: ["maelstrom", "brink", "spiral", "btrust"],
    section: "applicant"
  },
  // Consolidated GitHub field
  {
    id: "personal_github",
    label: "GitHub",
    type: "text",
    required: true,
    validation: "url",
    placeholder: "https://github.com/username",
    organizations: ["brink", "maelstrom", "spiral", "btrust"],
    section: "applicant"
  },
  // Consolidated social media fields
  {
    id: "personal_website",
    label: "Personal Website",
    type: "text",
    validation: "url",
    placeholder: "https://example.com",
    organizations: ["brink", "spiral"],
    section: "applicant"
  },
  {
    id: "twitter_handle",
    label: "Twitter",
    type: "text",
    placeholder: "@username",
    organizations: ["brink", "spiral", "btrust"],
    section: "applicant"
  },
  {
    id: "linkedin_profile",
    label: "LinkedIn",
    type: "text",
    validation: "url",
    placeholder: "https://linkedin.com/in/username",
    organizations: ["brink", "btrust"],
    section: "applicant"
  },
  // Address and location fields
  {
    id: "city",
    label: "City",
    type: "text",
    required: true,
    placeholder: "San Francisco",
    organizations: ["btrust", "maelstrom"],
    section: "applicant"
  },
  {
    id: "country",
    label: "Country",
    description: "Country of residence and citizenship",
    type: "select",
    required: true,
    options: COUNTRY_OPTIONS,
    organizations: ["btrust", "maelstrom"],
    section: "applicant"
  },
  {
    id: "phone",
    label: "Telephone Number",
    type: "text",
    required: true,
    validation: "phone",
    placeholder: "+1 123-456-7890",
    organizations: ["btrust", "maelstrom"],
    section: "applicant"
  },
  // Hidden field for API compatibility
  {
    id: "citizenship_country",
    label: "Country of Citizenship",
    type: "text",
    required: false,
    organizations: [], // Not shown to users
    section: "applicant"
  },
  {
    id: "why_considered",
    label: "Why Should You Be Considered",
    description: "Why should you be considered over other candidates?",
    type: "textarea",
    required: true,
    organizations: ["maelstrom"],
    section: "applicant"
  },
  {
    id: "bitcoin_dev_years",
    label: "How many years have you been developing on the Bitcoin network?",
    type: "select",
    required: true,
    options: [
      { value: "0-4 years", label: "0-4 years" },
      { value: "5+ years", label: "5+ years" }
    ],
    organizations: ["maelstrom"],
    section: "applicant"
  },
  // Consolidated technical background field
  {
    id: "technical_background",
    label: "Technical Background",
    description: "Describe your technical background and prior technical contributions, including Bitcoin projects you've worked on.",
    type: "textarea",
    required: true,
    placeholder: "Describe your technical background and contributions",
    organizations: ["btrust", "brink"],
    section: "applicant"
  },
  {
    id: "bitcoin_contributions",
    label: "Bitcoin Contributions",
    description: "Describe the contributions you've made to Bitcoin Core or other Bitcoin-related projects.",
    type: "textarea",
    required: true,
    minWords: 10,
    placeholder: "Provide details about your contributions to Bitcoin Core or other Bitcoin-related projects.",
    organizations: ["brink"],
    section: "project"
  },
  {
    id: "interview_availability",
    label: "Interview Availability",
    description: "What block of time (listed in UTC) are you available for a half-hour interview (Monday-Friday)?",
    type: "text",
    required: true,
    placeholder: "e.g., Monday-Friday 14:00-16:00 UTC",
    organizations: ["brink"],
    section: "applicant"
  },
  // Consolidated grant proposal field
  {
    id: "grant_proposal",
    label: "Grant Proposal",
    description: "Feel free to upload your grant proposal here. For Btrust applications, please use this sample template: https://bit.ly/starter-grant-template",
    type: "file",
    required: true,
    accept: ".pdf,.doc,.docx",
    maxSizeMB: 10,
    organizations: ["brink", "spiral", "btrust"],
    section: "project"
  },
  
  // References section
  {
    id: "references",
    label: "References",
    description: "Please provide the names and contact information of 1-3 references who can speak to your work and expertise.",
    type: "textarea",
    required: true,
    placeholder: "Format: Name, Email, Role (e.g., John Doe, john@example.com, Bitcoin Core Maintainer)",
    organizations: ["btrust", "maelstrom"],
    section: "references"
  },
  // Maelstrom specific fields
  {
    id: "date_of_birth",
    label: "Date of Birth",
    description: "Please provide your date of birth in the format DD/MM/YYYY",
    type: "date",
    required: true,
    organizations: ["maelstrom"],
    section: "applicant"
  },
];

// Helper function to get fields for specific organizations
export function getFieldsForOrganizations(orgIds: string[]): FieldDefinition[] {
  if (!orgIds || orgIds.length === 0) {
    return allFields;
  }
  
  // Always include the organizations field
  const organizationsField = allFields.find(field => field.id === 'organizations');
  
  // Filter fields that are used by any of the selected organizations
  const orgFields = allFields.filter(field => 
    field.id !== 'organizations' && // Skip the organizations field as we handle it separately
    (!field.organizations || // Include fields that don't specify organizations (common fields)
     field.organizations.some(orgId => orgIds.includes(orgId))) // Include fields used by selected orgs
  );
  
  return organizationsField ? [organizationsField, ...orgFields] : orgFields;
}

// Helper function to get fields for a specific section
export function getFieldsForSection(sectionId: string, orgIds: string[]): FieldDefinition[] {
  const orgFields = getFieldsForOrganizations(orgIds);
  return orgFields.filter(field => field.section === sectionId);
}

// Helper function to get required fields by section
export function getRequiredFieldsBySection(orgIds: string[]): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  
  // Initialize with empty arrays for each section
  formSections.forEach((_, index) => {
    result[index] = [];
  });
  
  // Add required fields to each section
  allFields.forEach(field => {
    if (field.required && 
        (!field.organizations || 
         field.organizations.some(orgId => orgIds.includes(orgId)))) {
      
      // Find section index
      const sectionIndex = formSections.findIndex(section => section.id === field.section);
      if (sectionIndex >= 0) {
        result[sectionIndex].push(field.id);
      }
    }
  });
  
  return result;
} 