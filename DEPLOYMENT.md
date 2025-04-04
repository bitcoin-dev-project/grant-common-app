# Deployment Guide for Bitcoin Grant Application Portal

This guide will walk you through deploying and connecting your grant application portal to the OpenSats clone.

## Prerequisites

1. Node.js version 18.17.0 or higher
2. npm or yarn
3. Access to both repositories:
   - The grant application portal (this repository)
   - The OpenSats clone (https://grant-website-wine.vercel.app/)

## Step 1: Configure Environment Variables

Create a `.env.local` file in the root of your grant application portal with the following content:

```
# Organization API endpoints
OPENSATS_API_URL=https://grant-website-wine.vercel.app/api/github
OPENSATS_API_KEY=development-test-key

# SendGrid Email Configuration
SENDGRID_API_URL=https://grant-website-wine.vercel.app/api/sendgrid
```

Make sure that both API endpoints are correctly configured and accessible in the OpenSats clone.

## Step 2: Build and Deploy the Grant Portal

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Access the application at http://localhost:3000

### Production Deployment with Vercel

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```
   vercel
   ```

3. Set environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the Environment Variables section
   - Add all the variables from your `.env.local` file

## Step 3: Testing the Integration

1. Fill out the grant application form with test data
2. Submit the form
3. Check the console logs for request/response details
4. Verify in your OpenSats clone that the application was received properly
5. Confirm that email notifications were sent to both the applicant and admin email

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure your OpenSats clone's API endpoint has CORS headers enabled:

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
```

### API Key Authentication

If the API rejects your requests due to authorization:

1. Check that the `OPENSATS_API_KEY` matches what's expected in the OpenSats clone
2. Ensure the Authorization header is correctly formatted in the request

### Email Delivery Issues

If emails are not being delivered:

1. Verify that the OpenSats clone's SendGrid integration is working correctly
2. Check the logs in the OpenSats clone for any errors related to SendGrid
3. Make sure the `SENDGRID_API_URL` is pointing to the correct endpoint

### Network Errors

If the application fails to connect to the OpenSats clone:

1. Verify that the OpenSats clone is running and accessible
2. Check that the API URLs are correct
3. Test the API endpoints directly with a tool like Postman or cURL

## Adding New Organizations

To add a new organization:

1. Add the organization details to `config/organizations.ts`
2. Add organization-specific API endpoints to `.env.local`
3. Create a submission handler function in `app/api/submit/route.ts`

## Support

For issues or questions, contact the development team. 