'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@simplicity/ui'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You do not have permission to sign in.'
      case 'Verification':
        return 'The sign in link is no longer valid. It may have been used already or it may have expired.'
      default:
        return 'An error occurred during authentication.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/auth/signin">
            <Button className="w-full">
              Try signing in again
            </Button>
          </Link>

          <Link href="/" className="text-primary-600 hover:text-primary-500">
            Return to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}