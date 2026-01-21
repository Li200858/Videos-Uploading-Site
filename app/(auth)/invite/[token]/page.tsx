'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [inviteInfo, setInviteInfo] = useState<{
    email: string
    courseTitle: string
    courseDescription?: string | null
    expiresAt?: string
    userExists?: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verify token is valid when page loads
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/invites/verify?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invalid invitation link')
          setInviteInfo(null)
        } else {
          setInviteInfo({
            email: data.email,
            courseTitle: data.courseTitle,
            courseDescription: data.courseDescription,
            expiresAt: data.expiresAt,
            userExists: data.userExists,
          })
          setError(null)
        }
      } catch (err: any) {
        setError('Failed to verify invitation. Please check the link and try again.')
        setInviteInfo(null)
      } finally {
        setVerifying(false)
      }
    }

    if (token) {
      verifyToken()
    } else {
      setError('Invalid invitation link')
      setVerifying(false)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      toast.success('Account created successfully! Please sign in.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="text-gray-600">Verifying invitation...</div>
        </div>
      </div>
    )
  }

  if (error || !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600">
              Invalid Invitation
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {error || 'This invitation link is invalid or has expired.'}
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Go to Login Page
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (inviteInfo.userExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Account Already Exists
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              An account with email <strong>{inviteInfo.email}</strong> already exists.
              Please log in to access the course.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/login"
              className="inline-block px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Login Page
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accept Invitation
          </h2>
          <div className="mt-4 p-4 bg-indigo-50 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Course:</strong> {inviteInfo.courseTitle}
            </p>
            {inviteInfo.courseDescription && (
              <p className="text-sm text-gray-600 mt-1">
                {inviteInfo.courseDescription}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              <strong>Email:</strong> {inviteInfo.email}
            </p>
            {inviteInfo.expiresAt && (
              <p className="text-xs text-gray-500 mt-1">
                Expires: {new Date(inviteInfo.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your student account to access this course
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

