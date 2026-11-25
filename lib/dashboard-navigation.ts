export const DASHBOARD_NAVIGATE = "dashboard:navigate";
export type RequestNavigation = { href: string; proceed: () => void };

export function requestDashboardNavigation(href: string, proceed: () => void) {
  const event = new CustomEvent<RequestNavigation>(DASHBOARD_NAVIGATE, { cancelable: true, detail: { href, proceed } });
  if (window.dispatchEvent(event)) proceed();
}
