import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Get the token from the request
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Redirect unauthenticated users to sign in
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Check if accessing organization-specific routes
  if (pathname.startsWith('/api/orgs/')) {
    const pathSegments = pathname.split('/')
    const orgId = pathSegments[3]

    // Validate that user has access to this organization
    if (orgId && token.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Forbidden - Invalid organization access' },
        { status: 403 }
      )
    }
  }

  // Check if accessing organization dashboard routes
  if (pathname.startsWith('/dashboard/') || pathname.match(/^\/[a-zA-Z0-9]{24}\//)) {
    const orgId = pathname.startsWith('/dashboard/')
      ? pathname.split('/')[2]
      : pathname.split('/')[1]

    if (orgId && token.orgId !== orgId) {
      // Redirect to user's organization dashboard
      return NextResponse.redirect(new URL(`/dashboard/${token.orgId}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}