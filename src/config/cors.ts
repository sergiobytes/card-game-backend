/** Lee CORS_ORIGIN ("a,b,c") y devuelve la lista de orígenes permitidos. */
export function parseCorsOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
