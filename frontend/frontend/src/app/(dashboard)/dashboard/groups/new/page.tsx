// This is a server component by default (no 'use client' directive)
import { Metadata } from 'next'
import { Suspense } from 'react'
import { CreateGroupForm } from '@/components/group/CreateGroupForm'

export const metadata: Metadata = {
  title: 'Create Group | Groopi',
  description: 'Create a new group with Slack or WhatsApp integration',
}

export default function CreateGroupPage() {
  return (
    <div className="container max-w-2xl py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <CreateGroupForm />
      </Suspense>
    </div>
  )
}