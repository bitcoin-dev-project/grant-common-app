# Grant Application Platform

This application provides a common platform where grantees can apply to multiple grant programs in one place, instead of visiting each organization's website individually. A user selects the organizations they want to apply to, and the app forwards their data to the specific grant programs.

## System Design

The system is designed to be flexible and extensible, allowing for different organizations with their own application workflows and field requirements.

### Key Components

1. **Organization Configuration**
   - Each organization has its own configuration in `config/organizations.ts`
   - Organizations can specify their workflow type, field mappings, and other settings

2. **Field Definitions**
   - Field definitions are centralized in `config/fieldDefinitions.ts`
   - Each field specifies which organizations use it
   - The system dynamically shows only the fields relevant to selected organizations

3. **Workflow Handlers**
   - Different workflow types (API, Google Form, Email) have their own handlers
   - Handlers are implemented in `app/api/submit/route.ts`
   - Each handler knows how to format and submit data for its workflow type

4. **Field Mapping**
   - Organizations can define mappings between common fields and their specific field names
   - This allows for field reuse across organizations with different naming conventions

### Workflow Types

The system supports multiple workflow types:

1. **API-based Workflow**
   - Submits data to an organization's API endpoint
   - Used by OpenSats

2. **Google Form Workflow**
   - Submits data to a Google Form

3. **Email Workflow**
   - Sends application data via email
   - Used by Maelstrom, Brink, Spiral, and Btrust

4. **Custom Workflow**
   - For organizations with unique requirements
   - Implemented through custom handler functions

## Adding a New Organization

To add a new organization:

1. Update `config/organizations.ts` with the organization's details
2. Configure the appropriate `workflowType` and `workflowConfig`
3. Add any organization-specific fields to `config/fieldDefinitions.ts`
4. Set `workflowImplemented: true` when ready to accept applications

### Example: API-based Organization

```typescript
{
  id: 'example-org',
  name: 'Example Organization',
  description: 'An example organization using API workflow',
  website: 'https://example.org',
  logo: '/logos/example.png',
  active: true,
  workflowImplemented: true,
  workflowType: 'api',
  workflowConfig: {
    apiUrl: 'https://api.example.org/applications',
    apiHeaders: {
      'Authorization': `Bearer ${process.env.EXAMPLE_API_KEY}`
    }
  },
  fieldMapping: {
    'name': 'applicant_name'
  }
}
```

### Example: Google Form Organization

```typescript
{
  id: 'form-org',
  name: 'Form Organization',
  description: 'An example organization using Google Form workflow',
  website: 'https://form-org.example',
  logo: '/logos/form-org.png',
  active: true,
  workflowImplemented: true,
  workflowType: 'googleForm',
  workflowConfig: {
    formUrl: 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse',
    formFields: {
      'email': 'entry.123456789',
      'your_name': 'entry.987654321'
    }
  }
}
```

### Example: Email-based Organization

```typescript
{
  id: 'email-org',
  name: 'Email Organization',
  description: 'An example organization using email-based workflow',
  website: 'https://email-org.example',
  logo: '/logos/email-org.png',
  active: true,
  workflowImplemented: true,
  workflowType: 'email',
  workflowConfig: {
    emailRecipients: ['grants@email-org.example', 'admin@email-org.example'],
    emailSubject: 'New Grant Application Submission'
  },
  fieldMapping: {
    'your_name': 'applicant_name'
  }
}
```

## Adding New Fields

To add a new field:

1. Add the field definition to `config/fieldDefinitions.ts`
2. Specify which organizations use this field
3. The field will automatically appear for users who select those organizations

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env.local`)
4. Run the development server: `npm run dev`

### Environment Variables

- `OPENSATS_API_URL`: API endpoint for OpenSats
- `OPENSATS_API_KEY`: API key for OpenSats
- `OPENSATS_EMAIL_RECIPIENTS`: Comma-separated list of email recipients for OpenSats applications
- `SENDGRID_API_KEY`: SendGrid API key for sending emails directly (used by Brink and other email-based workflows)
- `SENDGRID_VERIFIED_SENDER`: Verified sender email address for SendGrid (required for all email workflows)
- `SENDGRID_API_URL`: API endpoint for OpenSats' SendGrid integration (only used for OpenSats)
- `BRINK_EMAIL_RECIPIENTS`: Comma-separated list of email recipients for Brink applications
- `SPIRAL_EMAIL_RECIPIENTS`: Comma-separated list of email recipients for Spiral applications
- `BTRUST_EMAIL_RECIPIENTS`: Comma-separated list of email recipients for Btrust applications
- `MAELSTROM_EMAIL_RECIPIENTS`: Comma-separated list of email recipients for Maelstrom applications

## License

[MIT License](LICENSE)
