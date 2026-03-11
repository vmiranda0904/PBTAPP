# PBT Sports — Team Management App

A Progressive Web App (PWA) for managing your PBT sports team: stats, scheduling, rankings, live streams, and more.

## 🚀 Live App

> **[https://vmiranda0904.github.io/PBTAPP/](https://vmiranda0904.github.io/PBTAPP/)**

The app is automatically deployed to GitHub Pages on every push to `main`.

## Download & Install

**Option 1 — Install as a PWA (recommended)**

Open the [live app](https://vmiranda0904.github.io/PBTAPP/) in Chrome, Edge, or Safari (iOS 16.4+). A **Download App** button in the sidebar lets you install it directly to your device — it works offline and behaves like a native app.

**Option 2 — Run locally**

[⬇ Download ZIP](https://github.com/vmiranda0904/PBTAPP/archive/refs/heads/main.zip)

Then run locally:

```bash
npm install
npm run dev
```

## Features

- Dashboard with player stats and upcoming events
- Team communication / chat
- Live stream viewer
- Stats & analysis charts
- Heat map
- Calendar / event scheduling
- Points system
- Rankings

---

## ⚙️ Configuration & Setup

The app requires **Firebase** (database) and **EmailJS** (email notifications) to be configured. All credentials are stored as GitHub Secrets and injected at build time — nothing sensitive is committed to the repo.

### 1. Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com) and create a project.
2. Enable **Firestore Database** (start in production mode).
3. Add a **Web App** to the project and copy the config values.
4. Add the following GitHub Secrets (Settings → Secrets → Actions):

| Secret | Where to find it |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project settings → Your web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase project settings → Your web app |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project settings → Your web app |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase project settings → Your web app |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase project settings → Your web app |
| `VITE_FIREBASE_APP_ID` | Firebase project settings → Your web app |

### 2. EmailJS

The app sends two types of emails:

- **Admin notification** — sent to the admin when a new user registers, with approve/reject links.
- **User status notification** — sent to the registrant once the admin approves or rejects their account.

#### Setup steps

1. Sign up at [emailjs.com](https://www.emailjs.com) and create an **Email Service** (connect your email provider).
2. Create **Template 1 — Admin notification** with these variables:

   | Variable | Description |
   |---|---|
   | `{{to_email}}` | The admin's email address (set as the *To* field) |
   | `{{user_name}}` | The registrant's full name |
   | `{{user_email}}` | The registrant's email |
   | `{{user_position}}` | The registrant's playing position |
   | `{{approve_url}}` | One-click link to approve the account |
   | `{{reject_url}}` | One-click link to reject the account |

3. Create **Template 2 — User status notification** with these variables:

   | Variable | Description |
   |---|---|
   | `{{to_email}}` | The registrant's email address (set as the *To* field) |
   | `{{user_name}}` | The registrant's full name |
   | `{{status}}` | `approved` or `rejected` |
   | `{{app_url}}` | Link back to the app's sign-in page |

4. Add the following GitHub Secrets:

| Secret | Where to find it |
|---|---|
| `VITE_EMAILJS_SERVICE_ID` | EmailJS → Email Services → your service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS → Email Templates → Template 1 ID |
| `VITE_EMAILJS_USER_TEMPLATE_ID` | EmailJS → Email Templates → Template 2 ID |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS → Account → Public Key |
| `VITE_ADMIN_EMAIL` | The email address that receives admin notifications |
| `VITE_APP_URL` | `https://vmiranda0904.github.io` |

Once all secrets are added, push to `main` (or re-run the **Deploy to GitHub Pages** workflow) to deploy with email notifications active.

---

## 🔐 Admin Setup & Login

The app has a single designated admin account, identified by the `VITE_ADMIN_EMAIL` GitHub Secret.

### First-time setup

1. Make sure `VITE_ADMIN_EMAIL` is set to **your email address** in the GitHub Secrets (see Configuration section above).
2. Deploy the app (push to `main`).
3. Open the app and go to the **Create Account** tab on the sign-in page.
4. Register using **the same email address** you set as `VITE_ADMIN_EMAIL` and **create a password** (minimum 8 characters). There is no default password — you choose your own during registration.
5. Because the email matches, your account is **automatically approved** — no approval step required.
6. You will see an **"Admin Account Created!"** confirmation. Click **Sign In Now**.
7. Sign in with your admin email and the password you chose in step 4.

### Forgot your password?

There is no automated password-reset flow. If you forget your password:

- **Regular users** — contact the administrator to have your account reset. The admin can reject the old account in Firebase and approve a new registration from you.
- **Admin** — delete your account document from the Firebase Firestore `registrations` collection, then repeat the First-time setup steps above to create a new admin account with a new password.

### Accessing the Admin Panel

Once signed in as admin, a **🛡 Admin** link appears in the sidebar. Click it to open the Admin Panel where you can:

- Approve or reject pending user registrations
- Add, edit, and remove players
- Manage player stats, points, and events

### Important notes

- Only **one** admin account exists at a time, determined solely by the `VITE_ADMIN_EMAIL` value.
- If you change `VITE_ADMIN_EMAIL` and redeploy, the **old** account loses admin access and the **new** email gains it (provided that new email has a registered account).
- Admin accounts bypass the approval workflow — they are active immediately upon registration.

---

