import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import { updateUserStatus, getUserById } from '../lib/userService';
import { sendStatusNotificationEmail } from '../lib/emailService';

type PageState = 'loading' | 'confirm' | 'success' | 'error';

interface PageData {
  state: PageState;
  userName: string;
  userEmail: string;
  errorMsg: string;
}

export default function ApproveUser() {
  const [params] = useSearchParams();
  const uid = params.get('uid') ?? '';
  const token = params.get('token') ?? '';
  const action = params.get('action');
  const isApprove = action === 'approve';

  const paramsValid = !!uid && !!token && (action === 'approve' || action === 'reject');

  const [data, setData] = useState<PageData>({
    state: paramsValid ? 'loading' : 'error',
    userName: '',
    userEmail: '',
    errorMsg: paramsValid ? '' : 'Invalid or incomplete approval link.',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!paramsValid) return;

    getUserById(uid)
      .then(user => {
        if (!user) {
          setData({ state: 'error', userName: '', userEmail: '', errorMsg: 'User not found. The link may be invalid or expired.' });
          return;
        }
        if (user.approvalToken !== token) {
          setData({ state: 'error', userName: '', userEmail: '', errorMsg: 'Invalid approval token. This link may have already been used or is invalid.' });
          return;
        }
        if (user.status !== 'pending') {
          setData({ state: 'error', userName: '', userEmail: '', errorMsg: `This account has already been ${user.status}.` });
          return;
        }
        setData({ state: 'confirm', userName: user.name, userEmail: user.email, errorMsg: '' });
      })
      .catch(() => {
        setData({ state: 'error', userName: '', userEmail: '', errorMsg: 'Failed to load user information. Please try again.' });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    setSubmitting(true);
    const result = await updateUserStatus(uid, token, isApprove ? 'approved' : 'rejected');
    if (result.success) {
      try {
        await sendStatusNotificationEmail(
          data.userName,
          data.userEmail,
          isApprove ? 'approved' : 'rejected',
        );
      } catch {
        // Email notification is best-effort; proceed regardless
      }
      setData(prev => ({ ...prev, state: 'success' }));
    } else {
      setData(prev => ({ ...prev, state: 'error', errorMsg: 'Failed to update the account status. Please try again.' }));
    }
    setSubmitting(false);
  };

  const { state, userName, userEmail, errorMsg } = data;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-3 shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-lg">PBT</span>
          </div>
          <h1 className="text-white text-xl font-bold">PBT Sports</h1>
          <p className="text-slate-400 text-xs mt-1">Administrator Action</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 shadow-xl text-center">
          {/* Loading */}
          {state === 'loading' && (
            <div className="space-y-3">
              <Loader size={40} className="text-blue-400 mx-auto animate-spin" />
              <p className="text-slate-300 text-sm">Loading request…</p>
            </div>
          )}

          {/* Confirm */}
          {state === 'confirm' && (
            <div className="space-y-5">
              {isApprove ? (
                <CheckCircle size={48} className="text-green-400 mx-auto" />
              ) : (
                <XCircle size={48} className="text-red-400 mx-auto" />
              )}

              <div>
                <h2 className="text-white text-lg font-semibold">
                  {isApprove ? 'Approve Account' : 'Reject Account'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {isApprove
                    ? 'This will allow the user to sign in to PBT Sports.'
                    : 'This will prevent the user from signing in to PBT Sports.'}
                </p>
              </div>

              <div className="bg-slate-800 rounded-lg px-4 py-3 text-left space-y-1">
                <p className="text-white text-sm font-medium">{userName}</p>
                <p className="text-slate-400 text-xs">{userEmail}</p>
              </div>

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`w-full font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                  isApprove
                    ? 'bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white'
                    : 'bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white'
                }`}
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isApprove ? (
                  <CheckCircle size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                {submitting
                  ? 'Processing…'
                  : isApprove
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          )}

          {/* Success */}
          {state === 'success' && (
            <div className="space-y-4">
              {isApprove ? (
                <CheckCircle size={48} className="text-green-400 mx-auto" />
              ) : (
                <XCircle size={48} className="text-red-400 mx-auto" />
              )}
              <div>
                <h2 className="text-white text-lg font-semibold">
                  {isApprove ? 'Account Approved' : 'Account Rejected'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {isApprove
                    ? `${userName} can now sign in to PBT Sports.`
                    : `${userName}'s request has been rejected.`}
                </p>
              </div>
              <Link
                to="/login"
                className="inline-block text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="space-y-4">
              <AlertTriangle size={48} className="text-amber-400 mx-auto" />
              <div>
                <h2 className="text-white text-lg font-semibold">Action Failed</h2>
                <p className="text-slate-400 text-sm mt-1">{errorMsg}</p>
              </div>
              <Link
                to="/login"
                className="inline-block text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
