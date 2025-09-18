import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
      orgId: string
      roles: string[]
    }
  }

  interface User {
    id: string
    orgId?: string
    roles?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    orgId: string
    roles: string[]
  }
}