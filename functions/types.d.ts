// Ambient types for Cloudflare Pages Functions.
// Kept local (no @cloudflare/workers-types dependency) so `astro build`
// and `astro check` run without new devDependencies. Only the surface the
// functions actually use is declared here.

declare interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; expiration?: number }
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

declare interface EventContext<
  Env = unknown,
  P extends string = string,
  Data = Record<string, unknown>
> {
  request: Request;
  env: Env;
  params: Record<P, string | string[]>;
  data: Data;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
}

declare type PagesFunction<Env = unknown, P extends string = string> = (
  context: EventContext<Env, P>
) => Response | Promise<Response>;
