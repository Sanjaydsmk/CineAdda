import React from 'react'
import { assets } from '../../assets/assets'
import {
  LayoutDashboardIcon,
  ListCollapseIcon,
  ListIcon,
  PlusSquareIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const AdminSidebar = () => {
  const user = {
    firstName: 'Admin',
    lastName: 'User',
    imageUrl: assets.profile,
  }

  const adminNavlinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboardIcon },
    { name: 'Add Shows', path: '/admin/add-shows', icon: PlusSquareIcon },
    { name: 'List Shows', path: '/admin/list-shows', icon: ListIcon },
    {
      name: 'List Bookings',
      path: '/admin/list-bookings',
      icon: ListCollapseIcon,
    },
  ]

  return (
    <aside className="h-[calc(100vh-64px)] w-16 md:w-60 border-r border-gray-300/20 text-sm flex flex-col items-center pt-8">
      <img
        className="h-10 w-10 md:h-14 md:w-14 rounded-full"
        src={user.imageUrl}
        alt="admin"
      />
      <p className="mt-2 text-base font-medium max-md:hidden">
        {user.firstName} {user.lastName}
      </p>
      <nav className="w-full mt-6">
        {adminNavlinks.map(link => (
          <NavLink
          end
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `relative flex items-center gap-3 py-2.5 px-4 md:px-10 text-gray-400
               hover:bg-primary/10 hover:text-primary
               ${isActive ? 'bg-primary/15 text-primary' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className="h-5 w-5 shrink-0" />
                <span className="max-md:hidden">{link.name}</span>

                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute right-0 h-8 w-1.5 rounded-l bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar
