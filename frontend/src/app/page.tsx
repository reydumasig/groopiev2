'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-900">Groopie</div>
        <div className="space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Monetize Your WhatsApp Community
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create, manage, and grow your paid WhatsApp communities with ease. Set up subscription tiers, automate member access, and focus on building your community.
        </p>
        <Button size="lg" asChild className="mr-4">
          <Link href="/signup">Start for Free</Link>
        </Button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Groopie?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-4">Easy Setup</h3>
            <p className="text-gray-600">
              Create your community and start accepting members in minutes. No technical knowledge required.
            </p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-4">Automated Management</h3>
            <p className="text-gray-600">
              Automatic Slack channel creation, member invitations, and access control.
            </p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-4">Flexible Pricing</h3>
            <p className="text-gray-600">
              Set up multiple subscription tiers with custom pricing and features.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Start?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of community creators already using Groopie.
        </p>
        <Button size="lg" asChild>
          <Link href="/signup">Create Your Community</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>© {new Date().getFullYear()} Groopie. All rights reserved.</p>
      </footer>
    </div>
  )
}
