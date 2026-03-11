import { send as emailjsSend } from '@emailjs/browser';
import type { RegisteredUser } from './userService';

// ─── Config ───────────────────────────────────────────────────────────────────

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin;
const BASE_PATH = import.meta.env.BASE_URL ?? '/';
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '';
const SERVICE_ID = (import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined) ?? '';
const ADMIN_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined) ?? '';
const USER_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_USER_TEMPLATE_ID as string | undefined) ?? '';
const PUBLIC_KEY = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined) ?? '';

// ─── Emails ───────────────────────────────────────────────────────────────────

/**
 * Sends an approval-request email to the team admin when a new user registers.
 * `teamAdminEmail` is the email of the team's admin; falls back to the
 * environment-level ADMIN_EMAIL for backwards compatibility.
 * Template variables: {{to_email}}, {{user_name}}, {{user_email}},
 *   {{user_role}}, {{approve_url}}, {{reject_url}}
 */
export async function sendApprovalEmail(
  user: RegisteredUser,
  teamAdminEmail?: string,
): Promise<void> {
  if (!SERVICE_ID || !ADMIN_TEMPLATE_ID || !PUBLIC_KEY) return;

  const recipientEmail = teamAdminEmail || ADMIN_EMAIL;
  if (!recipientEmail) return;

  const base = `${APP_URL}${BASE_PATH}approve`;
  const approveUrl = `${base}?uid=${user.id}&token=${user.approvalToken}&action=approve`;
  const rejectUrl = `${base}?uid=${user.id}&token=${user.approvalToken}&action=reject`;

  await emailjsSend(
    SERVICE_ID,
    ADMIN_TEMPLATE_ID,
    {
      to_email: recipientEmail,
      user_name: user.name,
      user_email: user.email,
      user_role: user.role,
      approve_url: approveUrl,
      reject_url: rejectUrl,
    },
    PUBLIC_KEY,
  );
}

/**
 * Sends a status notification email to the registrant after admin action.
 * Template variables: {{to_email}}, {{user_name}}, {{status}}, {{app_url}}
 */
export async function sendStatusNotificationEmail(
  userName: string,
  userEmail: string,
  status: 'approved' | 'rejected',
): Promise<void> {
  if (!SERVICE_ID || !USER_TEMPLATE_ID || !PUBLIC_KEY) return;

  const appUrl = `${APP_URL}${BASE_PATH}`;

  await emailjsSend(
    SERVICE_ID,
    USER_TEMPLATE_ID,
    {
      to_email: userEmail,
      user_name: userName,
      status,
      app_url: appUrl,
    },
    PUBLIC_KEY,
  );
}
