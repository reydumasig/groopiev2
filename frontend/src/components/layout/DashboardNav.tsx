'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface NavItem {
  name: string
  href: string
  adminOnly?: boolean
}

const userNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Profile', href: '/dashboard/profile' },
  { name: 'My Groups', href: '/dashboard/groups' },
  { name: 'Password', href: '/dashboard/settings/password' },
]

const adminNavigation: NavItem[] = [
  { name: 'Admin Dashboard', href: '/admin', adminOnly: true },
  ...userNavigation
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        // Check profile role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        // Set admin if either the profile role or user metadata indicates admin
        setIsAdmin(
          profile.role === 'admin' || 
          user.user_metadata?.role === 'admin'
        );
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user, supabase]);

  // Filter navigation items based on admin status
  const navigation = adminNavigation.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-black dark:text-white'
              : 'text-muted-foreground',
            item.adminOnly ? 'text-blue-600 dark:text-blue-400' : ''
          )}
        >
          {item.name}
        </Link>
      ))}
      <div className="ml-auto flex items-center space-x-4">
        {isAdmin && (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Admin
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          {user?.email}
        </span>
        <Button
          variant="ghost"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </nav>
  )
} 