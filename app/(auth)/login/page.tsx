'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteInfo, setInviteInfo] = useState<{ email: string; courseTitle?: string; userExists?: boolean } | null>(null)
  const [verifyingInvite, setVerifyingInvite] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [name, setName] = useState('')
  const [registering, setRegistering] = useState(false)

  // Check for invite token in URL
  useEffect(() => {
    const emailParam = searchParams.get('email')
    const tokenParam = searchParams.get('token')

    if (emailParam && tokenParam) {
      setEmail(emailParam)
      setInviteToken(tokenParam)
      verifyInviteToken(tokenParam, emailParam)
    } else if (emailParam) {
      // Only email, no token - just set email (normal login)
      setEmail(emailParam)
    }
  }, [searchParams])

  const verifyInviteToken = async (token: string, email: string) => {
    setVerifyingInvite(true)
    try {
      const response = await fetch(`/api/invites/verify?token=${token}`)
      const data = await response.json()

      if (response.ok && data.valid) {
        // Verify email matches
        if (data.email !== email) {
          toast.error('邀请链接中的邮箱与URL参数不匹配')
          setInviteToken(null)
          setVerifyingInvite(false)
          return
        }

        setInviteInfo({
          email: data.email,
          courseTitle: data.courseTitle,
          userExists: data.userExists,
        })
        
        if (data.userExists) {
          // Account exists, auto-login immediately
          await handleAutoLogin(token, email)
        } else {
          // Account doesn't exist, show name input only
          setShowRegister(true)
          toast.success(`欢迎加入课程：${data.courseTitle}`)
        }
      } else {
        toast.error(data.error || '邀请链接无效')
        setInviteToken(null)
      }
    } catch (error) {
      console.error('Failed to verify invite:', error)
      toast.error('验证邀请链接失败，请重试')
      setInviteToken(null)
    } finally {
      setVerifyingInvite(false)
    }
  }

  const handleAutoLogin = async (token: string, email: string) => {
    try {
      // Login using inviteToken (no password needed)
      const result = await signIn('credentials', {
        email,
        password: '', // Empty password for invite-based login
        inviteToken: token,
        redirect: false,
      })

      if (result?.error) {
        throw new Error('自动登录失败')
      }

      // Mark invite as used after successful login
      try {
        await fetch('/api/invites/accept-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
      } catch (error) {
        // Ignore errors, invite might already be used
      }

      toast.success('登录成功！')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      console.error('Auto login failed:', error)
      toast.error('自动登录失败，请重试')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
      } else {
        toast.success('Logged in successfully')
        
        // If this was from an invite, mark it as used
        if (inviteToken) {
          try {
            await fetch('/api/invites/accept-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: inviteToken }),
            })
          } catch (error) {
            // Ignore errors, invite might already be used
          }
        }
        
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteToken) {
      toast.error('Invalid invitation')
      return
    }

    if (!name.trim()) {
      toast.error('请输入姓名')
      return
    }

    setRegistering(true)
    try {
      // Use auto-login API which will create account and login
      const response = await fetch('/api/invites/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, name: name.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      toast.success('账号创建成功！正在登录...')
      
      // Auto login using inviteToken
      const result = await signIn('credentials', {
        email: data.email,
        password: '',
        inviteToken: inviteToken,
        redirect: false,
      })

      if (result?.error) {
        throw new Error('账号创建成功但登录失败')
      }

      // Mark invite as used after successful login
      try {
        await fetch('/api/invites/accept-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: inviteToken }),
        })
      } catch (error) {
        // Ignore errors, invite might already be used
      }

      toast.success('登录成功！')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'An error occurred. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  if (verifyingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="text-gray-600">验证邀请链接...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showRegister ? '创建学生账号' : 'Sign in to your account'}
          </h2>
          {inviteInfo && inviteInfo.courseTitle && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>课程：</strong> {inviteInfo.courseTitle}
              </p>
            </div>
          )}
          {!showRegister && !inviteToken && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                create a new teacher account
              </Link>
            </p>
          )}
        </div>

        {showRegister ? (
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  value={email}
                />
                <p className="mt-1 text-xs text-gray-500">邮箱已锁定（来自邀请链接）</p>
              </div>
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
            </div>

            <div>
              <button
                type="submit"
                disabled={registering}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={!!inviteToken}
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                    inviteToken ? 'bg-gray-100 text-gray-500' : ''
                  }`}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {inviteToken && (
                  <p className="mt-1 text-xs text-gray-500 px-3">邮箱已锁定（来自邀请链接）</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
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
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

