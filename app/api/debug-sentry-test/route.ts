// Temporary — verifies Sentry captures server errors in production.
// Delete after confirming an event lands in the Sentry issues feed.
export async function GET() {
  throw new Error("Sentry verification test — safe to ignore/delete");
}
