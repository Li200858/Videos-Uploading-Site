'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface Invite {
  id: string
  email: string
  token: string
  expiresAt: string
  usedAt: string | null
  inviteUrl: string
}

export default function ManageStudentsPage() {
  const params = useParams()
  const courseId = params.id as string

  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchInvites()
  }, [courseId])

  const fetchInvites = async () => {
    try {
      const response = await fetch(`/api/invites?courseId=${courseId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to fetch invites: ${response.status}`)
      }
      const data = await response.json()
      setInvites(data)
    } catch (error: any) {
      console.error('Error fetching invites:', error)
      toast.error(error.message || '加载邀请列表失败')
      setInvites([]) // 确保设置为空数组，避免显示旧数据
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('请输入学生邮箱地址')
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), courseId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || `创建邀请失败: ${response.status}`
        console.error('Error creating invite:', errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Invite created successfully:', data)
      
      if (data.message) {
        toast.success(data.message)
      } else {
        toast.success('邀请创建成功！邮件已发送到学生邮箱。')
      }
      setEmail('')
      
      // 重新获取邀请列表
      await fetchInvites()
    } catch (error: any) {
      console.error('Error in handleCreateInvite:', error)
      toast.error(error.message || '创建邀请失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  const copyInviteUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Invite URL copied to clipboard!')
  }

  const handleResendEmail = async (inviteId: string) => {
    try {
      const response = await fetch('/api/invites/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend email')
      }

      toast.success('邮件已重新发送！')
    } catch (error: any) {
      console.error('Error resending email:', error)
      toast.error(error.message || '重新发送邮件失败')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <Link
        href={`/teacher/courses/${courseId}`}
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
      >
        ← Back to Course
      </Link>

      <Card className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Invite Students</h1>
        <form onSubmit={handleCreateInvite} className="flex gap-4">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Student email address"
            className="flex-1"
          />
          <Button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create Invite'}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Student Invitations</h2>
        {invites.length === 0 ? (
          <p className="text-gray-500 text-sm">No invitations yet</p>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="border border-gray-200 rounded-md p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-sm text-gray-500">
                    {invite.usedAt
                      ? `Accepted on ${new Date(invite.usedAt).toLocaleDateString()}`
                      : `Expires on ${new Date(invite.expiresAt).toLocaleDateString()}`}
                  </p>
                  {!invite.usedAt && (
                    <p className="text-xs text-indigo-600 mt-1 font-mono break-all">
                      {invite.inviteUrl}
                    </p>
                  )}
                </div>
                {!invite.usedAt && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => copyInviteUrl(invite.inviteUrl)}
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleResendEmail(invite.id)}
                    >
                      Resend Email
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

