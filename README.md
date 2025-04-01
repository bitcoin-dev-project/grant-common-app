# Bitcoin Grant Application Portal

A unified platform that allows developers to apply for grants from multiple Bitcoin funding organizations using a single application form.

## Overview

This application provides:

1. A common grant application form that works with multiple Bitcoin funding organizations
2. A centralized place to submit applications rather than visiting each organization's website
3. An expandable architecture that can easily add new grant organizations

## Features

- Single application form with fields commonly required by Bitcoin funding organizations
- Support for multiple organizations with organization-specific submission handling
- Clean, responsive UI with validation
- Easy to expand to additional organizations

## Supported Organizations

Currently, the portal supports:

- OpenSats

More organizations are planned for the future.

## Development

### Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file:
   ```
   OPENSATS_API_URL=https://opensats.org/api/github
   OPENSATS_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Adding a New Organization

To add support for a new grant organization:

1. Add the organization to `config/organizations.ts`
2. Create an organization-specific submission handler in `app/api/submit/route.ts`
3. Add any organization-specific fields to the form component if needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or suggestions, please open an issue in this repository.
