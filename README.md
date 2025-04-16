# Portfolio Website

A modern, responsive portfolio website with HR contact form integration.

## Deployment Guide

### Option 1: GitHub Pages (Free & Easy)

1. Create a GitHub repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin your-repository-url
git push -u origin main
```

2. Go to repository Settings > Pages
3. Select 'main' branch and 'root' folder
4. Click Save - your site will be live at `https://username.github.io/repository-name`

### Option 2: Netlify (Free & Easy with more features)

1. Sign up at [Netlify](https://www.netlify.com/)
2. Connect your GitHub repository
3. Select repository and branch
4. Deploy! Your site will be live with a Netlify subdomain

### Option 3: Custom Domain Setup

1. Purchase a domain from any registrar (GoDaddy, Namecheap, etc.)
2. If using GitHub Pages:
   - Add your custom domain in repository Settings > Pages
   - Create a CNAME file with your domain
   - Update DNS settings at your registrar

3. If using Netlify:
   - Add your custom domain in Site settings > Domain management
   - Follow Netlify's DNS instructions

## Environment Setup

### Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Update the Firebase config in `script.js`:
```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    databaseURL: "your-database-url",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### EmailJS Configuration
1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create email templates for:
   - HR notification (template_id_hr)
   - Owner notification (template_id_owner)
3. Update EmailJS config in `index.html`:
```javascript
emailjs.init("your-public-key");
```
4. Update service and template IDs in `script.js`

## Security Notes

1. Enable Firebase Authentication and Database Rules
2. Set up CORS policies if needed
3. Use environment variables for sensitive data in production

## Maintenance

1. Regularly update dependencies
2. Monitor Firebase/EmailJS usage and limits
3. Check browser console for any errors
4. Test form submissions periodically

## Local Development

1. Use a local server (e.g., Live Server VS Code extension)
2. Test in multiple browsers
3. Check mobile responsiveness
4. Validate form submissions

## Features
- Responsive design with dark/light mode
- HR information collection form
- Email notifications using EmailJS
- Analytics tracking with Firebase
- Resume download tracking
- Mobile-friendly interface

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <repo-name>
```

2. Configure EmailJS:
- Create an account at [EmailJS](https://www.emailjs.com/)
- Create an email service
- Create two templates:
  - `template_se66vt2` for owner notifications
  - `template_0ud01k4` for HR confirmations
- Replace the EmailJS public key in `index.html`

3. Configure Firebase:
- Create a project at [Firebase Console](https://console.firebase.google.com/)
- Enable Realtime Database
- Replace the Firebase config in `script.js`

## File Structure
```
├── index.html
├── styles.css
├── script.js
├── admin.html
├── admin.js
├── login.html
└── README.md
``` 