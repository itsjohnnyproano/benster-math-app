export function formatResponseTime(milliseconds: number | null) {
  return milliseconds === null ? "—" : `${(milliseconds / 1000).toFixed(1)} sec`;
}
