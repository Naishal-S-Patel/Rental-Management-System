import { api } from '@/lib/api'
import type { MessageResponse, Role } from '@/types/auth'

// Mirrors SecurityConfig's /api/role1..4/** and /api/admin/** rules + RoleController/AdminController.
const rolePingPaths: Record<Role, string> = {
  ADMIN: '/api/admin/ping',
  ROLE1: '/api/role1/ping',
  ROLE2: '/api/role2/ping',
  ROLE3: '/api/role3/ping',
  ROLE4: '/api/role4/ping',
}

export const roleApi = {
  ping: (role: Role) => api.get<MessageResponse>(rolePingPaths[role]),
}
