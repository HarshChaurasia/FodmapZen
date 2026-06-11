import { NextResponse } from 'next/server';

// The mobile app (Expo web on :8090, or a device build) calls these API
// routes cross-origin. The endpoints hold no user secrets — auth context is
// passed explicitly in the body — so a permissive CORS policy is fine.
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function corsJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
