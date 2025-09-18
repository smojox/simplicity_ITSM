import { NextAuthOptions } from 'next-auth'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import connectToDatabase from '@/lib/db/connection'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { UserModel, OrganizationModel } from '@/lib/models/organization'

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(connectToDatabase()),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        await connectToDatabase()
        const dbUser = await UserModel.findOne({ email: user.email }).exec()
        if (dbUser) {
          token.orgId = dbUser.orgId
          token.roles = dbUser.roles
          token.userId = dbUser._id.toString()
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.userId as string
        session.user.orgId = token.orgId as string
        session.user.roles = token.roles as string[]
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        await connectToDatabase()

        let existingUser = await UserModel.findOne({ email: user.email }).exec()

        if (!existingUser) {
          const newOrg = new OrganizationModel({
            name: user.name ? `${user.name}'s Organization` : 'New Organization',
            plan: 'free',
            settings: {
              features: {
                incidentManagement: true,
                problemManagement: false,
                changeManagement: false,
                requestFulfillment: false,
                serviceCatalog: false,
                knowledgeBase: false,
                assetManagement: false,
                slaManagement: false,
              }
            },
            billing: {}
          })

          const savedOrg = await newOrg.save()

          existingUser = new UserModel({
            email: user.email,
            name: user.name || 'Unknown User',
            orgId: savedOrg._id.toString(),
            roles: ['admin']
          })

          await existingUser.save()
        }

        return true
      } catch (error) {
        console.error('Sign in error:', error)
        return false
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}