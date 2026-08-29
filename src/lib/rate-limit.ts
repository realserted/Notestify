import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Per-user rate limits for the Gemini-backed endpoints. These bound how often
 * a request can be made; `MAX_*` in lib/ai bounds what one request can cost.
 * Both are needed — 30 requests/hour still hurts if one carries a 2 MB body.
 */
export const LIMITS = {
  /** Tutor turns. Higher: a study session is naturally chatty. */
  tutor: { limit: 30, windowSeconds: 3600 },
  /** Flashcard/quiz/summary generation. Each is a large, slow call. */
  generate: { limit: 10, windowSeconds: 3600 },
} as const;

export type LimitedAction = keyof typeof LIMITS;

interface RateLimitRow {
  allowed: boolean;
  remaining: number;
  reset_at: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Consumes one unit of the caller's budget. The Postgres function reads
 * auth.uid() itself, so the client cannot spend another user's allowance.
 *
 * Fails closed: if the check errors we reject. That adds no new failure mode,
 * because the route already cannot work without Supabase, and the thing being
 * protected here is spend.
 */
export const checkRateLimit = async (
  supabase: SupabaseClient,
  action: LimitedAction
): Promise<RateLimitResult> => {
  const { limit, windowSeconds } = LIMITS[action];

  const { data, error } = await supabase
    .rpc('check_rate_limit', {
      p_action: action,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    .single<RateLimitRow>();

  if (error || !data) {
    console.error('[rate-limit]', action, error);
    return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + windowSeconds * 1000) };
  }

  return {
    allowed: data.allowed,
    remaining: data.remaining,
    resetAt: new Date(data.reset_at),
  };
};

/** 429 with the headers a well-behaved client expects. */
export const rateLimitResponse = (action: LimitedAction, result: RateLimitResult) => {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));

  return NextResponse.json(
    {
      error:
        action === 'tutor'
          ? "You've hit the hourly message limit. Try again shortly."
          : "You've hit the hourly generation limit. Try again shortly.",
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'RateLimit-Limit': String(LIMITS[action].limit),
        'RateLimit-Remaining': String(result.remaining),
        'RateLimit-Reset': String(retryAfter),
      },
    }
  );
};
