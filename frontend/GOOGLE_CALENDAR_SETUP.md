# Google Calendar Integration Setup

This guide will help you set up Google Calendar integration for automatic appointment syncing.

## Prerequisites

- A Google Cloud Platform account
- Access to Google Cloud Console

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in required information
   - Add scopes: `https://www.googleapis.com/auth/calendar.events`
   - Add test users (your email) if in testing mode
4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "MedVita Calendar Sync"
   - Authorized JavaScript origins: `http://localhost:5173` (for dev) and your production URL
   - Authorized redirect URIs: `http://localhost:5173` (for dev) and your production URL
5. Copy the **Client ID**

### 3. Create API Key

1. Still in "Credentials" page
2. Click "Create Credentials" > "API Key"
3. Copy the **API Key**
4. (Optional) Restrict the API key to Google Calendar API only for security

### 4. Configure Environment Variables

1. Create a `.env` file in the `frontend` directory (or update existing one)
2. Add the following variables:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
```

3. Replace `your_client_id_here` and `your_api_key_here` with the values from steps 2 and 3

### 5. Restart Development Server

After adding environment variables, restart your development server:

```bash
npm run dev
```

## Usage

### For Doctors

1. Go to Settings (click your profile icon > Settings)
2. Find "Google Calendar Sync" option
3. Toggle it ON
4. You'll be prompted to sign in with your Google account
5. Grant permissions to access your Google Calendar
6. Once connected, all new appointments will automatically sync to your Google Calendar

### Features

- **Automatic Sync**: New appointments are automatically added to Google Calendar
- **Event Details**: Includes patient name, appointment time, and status
- **Reminders**: Automatically sets reminders (1 day before and 1 hour before)
- **Easy Toggle**: Enable/disable sync anytime from Settings
- **Fallback Option**: If automatic sync fails, you can manually add via calendar link

## Troubleshooting

### "Failed to connect to Google Calendar"

- Check that environment variables are set correctly
- Verify Google Calendar API is enabled in Google Cloud Console
- Ensure OAuth consent screen is configured
- Check browser console for detailed error messages

### "Not authenticated with Google Calendar"

- Sign out and sign back in to Google Calendar
- Check that permissions were granted
- Try disabling and re-enabling the sync

### Events not appearing in Google Calendar

- Check that sync is enabled in Settings
- Verify you're signed in with the correct Google account
- Check browser console for errors
- Try creating a new appointment to test

## Security Notes

- API keys should be restricted to specific APIs in production
- OAuth credentials should use production URLs in production environment
- Never commit `.env` file to version control
- Use environment-specific credentials for dev/staging/production

## Support

For issues or questions, check:
- Google Calendar API documentation: https://developers.google.com/calendar
- Google OAuth 2.0 documentation: https://developers.google.com/identity/protocols/oauth2
