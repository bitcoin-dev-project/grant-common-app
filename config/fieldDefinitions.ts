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
  { id: "other", label: "Other Info" }
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
    organizations: ["opensats"],
    section: "project"
  },
  {
    id: "main_focus",
    label: "Main Focus",
    description: "In which area will your project have the most impact?",
    type: "select",
    required: true,
    options: [
      { value: "core", label: "Bitcoin Core" },
      { value: "education", label: "Education" },
      { value: "layer1", label: "Layer1 / Bitcoin" },
      { value: "layer2", label: "Layer2 / Lightning" },
      { value: "eCash", label: "Layer3 / eCash" },
      { value: "nostr", label: "Nostr" },
      { value: "other", label: "Other" }
    ],
    organizations: ["opensats"],
    section: "project"
  },
  {
    id: "short_description",
    label: "Project Description",
    description: "A great description will help us to evaluate your project more quickly.",
    type: "textarea",
    required: true,
    placeholder: "Provide a clear and concise description of your project, including its purpose, who it serves, and what problem it solves.",
    organizations: ["opensats"],
    section: "project"
  },
  {
    id: "potential_impact",
    label: "Potential Impact",
    description: "Why is this project important to Bitcoin or the broader free and open-source community?",
    type: "textarea",
    required: true,
    placeholder: "Describe how your project will benefit the Bitcoin ecosystem or open-source community. Include potential use cases, user base, and long-term impact.",
    organizations: ["opensats"],
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
  
  // Source Code section
  {
    id: "free_open_source",
    label: "Is this project free and open-source software?",
    type: "checkbox",
    required: true,
    organizations: ["opensats"],
    section: "source"
  },
  {
    id: "license",
    label: "License",
    description: "What license does your project use?",
    type: "text",
    required: true,
    organizations: ["opensats"],
    section: "source"
  },
  {
    id: "github",
    label: "Project GitHub",
    description: "Link to the project's GitHub repository or other code hosting platform.",
    type: "text",
    organizations: ["opensats"],
    section: "source"
  },
  
  // Timeline section
  {
    id: "duration",
    label: "Project Duration",
    description: "This will help us evaluate overall scope and potential grant duration. (It's ok to pivot and/or work on something else during this time)",
    type: "select",
    required: true,
    options: [
      { value: "12_months", label: "12 months" },
      { value: "9_months", label: "9 months" },
      { value: "6_months", label: "6 months" },
      { value: "3_months", label: "3 months" },
      { value: "other", label: "Other (please elaborate below)" }
    ],
    organizations: ["opensats"],
    section: "timeline"
  },
  {
    id: "timelines",
    label: "Project Timelines",
    description: "Please provide a detailed timeline for your project with major milestones.",
    type: "textarea",
    required: true,
    organizations: ["opensats"],
    section: "timeline"
  },
  {
    id: "commitment",
    label: "Time Commitment",
    description: "How much time are you going to commit to the project?",
    type: "select",
    required: true,
    options: [
      { value: "100", label: "100% - Full Time" },
      { value: "75", label: "75% - Part Time" },
      { value: "50", label: "50% - Part Time" },
      { value: "25", label: "25% - Side Project" }
    ],
    organizations: ["opensats"],
    section: "timeline"
  },
  
  // Budget section
  {
    id: "proposed_budget",
    label: "Costs & Proposed Budget",
    description: "Current or estimated costs of the project. Please submit a proposed budget (in USD) around how much funding you are requesting and how it will be used.",
    type: "textarea",
    required: true,
    placeholder: "Break down your budget needs in detail (e.g., development costs, hardware, hosting, etc.). Specify how much funding you are requesting in USD and provide justification for each expense.",
    organizations: ["opensats"],
    section: "budget"
  },
  {
    id: "has_received_funding",
    label: "Has this project received any prior funding?",
    type: "checkbox",
    organizations: ["opensats"],
    section: "budget"
  },
  {
    id: "what_funding",
    label: "If so, please describe.",
    type: "textarea",
    organizations: ["opensats"],
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
    organizations: ["opensats", "maelstrom", "brink"],
    section: "applicant"
  },
  {
    id: "email",
    label: "Email",
    type: "email",
    required: true,
    placeholder: "satoshin@gmx.com",
    organizations: ["opensats", "maelstrom", "brink"],
    section: "applicant"
  },
  {
    id: "date_of_birth",
    label: "Date of Birth",
    description: "Please provide your date of birth in the format DD/MM/YYYY",
    type: "date",
    required: true,
    organizations: ["maelstrom"],
    section: "applicant"
  },
  {
    id: "residential_address",
    label: "Residential Address",
    type: "text",
    required: true,
    organizations: ["maelstrom"],
    section: "applicant"
  },
  {
    id: "citizenship_country",
    label: "Country of Citizenship",
    type: "text",
    required: true,
    organizations: ["maelstrom"],
    section: "applicant"
  },
  {
    id: "github_profile_alt",
    label: "GitHub Profile (Alternative)",
    type: "text",
    organizations: ["maelstrom"],
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
  {
    id: "are_you_lead",
    label: "Are you the Project Lead / Lead Contributor?",
    type: "checkbox",
    organizations: ["opensats"],
    section: "applicant"
  },
  {
    id: "other_lead",
    label: "If someone else, please list the project's Lead Contributor or Maintainer",
    type: "text",
    organizations: ["opensats"],
    section: "applicant"
  },
  {
    id: "personal_github",
    label: "GitHub",
    type: "text",
    required: true,
    placeholder: "https://github.com/username",
    organizations: ["brink", "maelstrom"],
    section: "applicant"
  },
  {
    id: "other_contact",
    label: "Other Contact Details (if applicable)",
    description: "Please list any other relevant contact details you are comfortable sharing in case we need to reach out with questions. These could include nostr pubkeys, social media handles, etc.",
    type: "textarea",
    organizations: ["opensats"],
    section: "applicant"
  },
  {
    id: "personal_website",
    label: "Personal Website",
    type: "text",
    placeholder: "https://example.com",
    organizations: ["brink"],
    section: "applicant"
  },
  {
    id: "twitter_handle",
    label: "Twitter",
    type: "text",
    placeholder: "@username",
    organizations: ["brink"],
    section: "applicant"
  },
  {
    id: "linkedin_profile",
    label: "LinkedIn",
    type: "text",
    placeholder: "https://linkedin.com/in/username",
    organizations: ["brink"],
    section: "applicant"
  },
  {
    id: "bitcoin_contributions",
    label: "Bitcoin Contributions",
    description: "Describe the contributions you've made to Bitcoin Core or other Bitcoin-related projects.",
    type: "textarea",
    required: true,
    placeholder: "Provide details about your contributions to Bitcoin Core or other Bitcoin-related projects.",
    organizations: ["brink"],
    section: "project"
  },
  {
    id: "project_description",
    label: "Project Description",
    description: "What project do you intend to work on? Please include the deliverables and timeline for the project.",
    type: "textarea",
    required: true,
    placeholder: "Describe your project, including deliverables and timeline.",
    organizations: ["brink"],
    section: "project"
  },
  {
    id: "grant_proposal",
    label: "Grant Proposal",
    description: "Feel free to upload your grant proposal here:",
    type: "file",
    organizations: ["brink"],
    section: "other"
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
  {
    id: "additional_info",
    label: "Additional Information",
    description: "Is there anything else we should be aware of when considering your application?",
    type: "textarea",
    placeholder: "Provide any additional information that may be relevant to your application.",
    organizations: ["brink"],
    section: "other"
  },
  
  // References section
  {
    id: "references",
    label: "References",
    description: "Please provide the names and contact information of 1-3 references who can speak to your work and expertise.",
    type: "textarea",
    required: true,
    organizations: ["opensats"],
    section: "references"
  },
  
  {
    id: "reference_name",
    label: "Reference Name",
    description: "Name of your reference",
    type: "text",
    required: true,
    organizations: ["maelstrom"],
    section: "references"
  },
  
  {
    id: "reference_email",
    label: "Reference Email",
    description: "Email of your reference",
    type: "email",
    required: true,
    organizations: ["maelstrom"],
    section: "references"
  },
  
  // Other Info section
  {
    id: "bios",
    label: "Team Bios",
    description: "Brief bio of yourself and any team members, including relevant experience.",
    type: "textarea",
    organizations: ["opensats"],
    section: "other"
  },
  {
    id: "years_experience",
    label: "Years of Experience",
    description: "How many years of experience do you have in this field?",
    type: "text",
    organizations: ["opensats"],
    section: "other"
  },
  {
    id: "anything_else",
    label: "Anything Else?",
    description: "Is there anything else you'd like to share about your project or application?",
    type: "textarea",
    organizations: ["opensats"],
    section: "other"
  }
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