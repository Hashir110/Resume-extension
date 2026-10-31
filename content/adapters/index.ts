import { devJobAdapter } from "./dev-job";
import { genericAdapter } from "./generic";
import { greenhouseAdapter } from "./greenhouse";
import { indeedAdapter } from "./indeed";
import { leverAdapter } from "./lever";
import { linkedInAdapter } from "./linkedin";
import { rozeeAdapter } from "./rozee";
import type { JobPageAdapter } from "./types";
import { workdayAdapter } from "./workday";

const SITE_ADAPTERS: JobPageAdapter[] = [
  linkedInAdapter,
  indeedAdapter,
  greenhouseAdapter,
  leverAdapter,
  workdayAdapter,
  rozeeAdapter,
  devJobAdapter,
];

/** Returns the matching site-specific adapter, or genericAdapter as universal fallback. */
export function selectSiteAdapter(url: string): JobPageAdapter | null {
  return SITE_ADAPTERS.find((adapter) => adapter.canHandle(url)) ?? genericAdapter;
}

export { genericAdapter };
export type { JobPageAdapter } from "./types";
