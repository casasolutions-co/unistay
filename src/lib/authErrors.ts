// Firebase refuses sign-in with auth/user-disabled once an admin bans the account.
export function suspendedMessage(e: unknown): string | null {
  return String(e).includes('user-disabled')
    ? 'Your account has been suspended. Please contact support if you think this is a mistake.'
    : null;
}
