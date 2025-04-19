# Portfolio Website with Firebase

## Security Implementation

This project implements several security measures to protect Firebase API keys and configuration:

1. **Environment-based configuration:** Firebase config is loaded from a protected file rather than being embedded in client-side code.

2. **Server-side validation:** The Express server validates requests and only serves configuration to valid origins.

3. **Firebase Security Rules:** Strict access rules are implemented for the Realtime Database and Storage.

## Local Development Setup

When running locally directly from file system (file:// protocol), the code will automatically use a local configuration approach.

1. Clone this repository.

2. For quick testing, open the HTML files directly in your browser.

## Production Setup

For production deployment with proper security:

1. Create a `config` directory and add your Firebase configuration:

```bash
mkdir -p config
```

Create a file `config/firebase-config.json` with your Firebase config:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "databaseURL": "https://YOUR_PROJECT_ID.firebaseio.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT_ID.appspot.com",
  "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "measurementId": "YOUR_MEASUREMENT_ID"
}
```

2. For environment variable usage, copy `.env.example` to `.env` and fill in your Firebase configuration:

```bash
cp .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

## Firebase Security Rules

Update your Firebase Security Rules in the Firebase Console with the rules defined in `firebase-rules.json`.

## Additional Security Recommendations

1. **IP Restrictions:** In the Firebase Console, restrict your API key to specific IP addresses/domains.

2. **API Key Restrictions:** In the Google Cloud Console, restrict which Firebase services your API key can access.

3. **Regular Rotation:** Periodically rotate your Firebase API keys.

4. **Environment Variables:** For production, use environment variables instead of config files. 