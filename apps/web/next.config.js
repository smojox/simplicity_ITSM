/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ["@simplicity/ui", "@simplicity/lib", "@simplicity/db", "@simplicity/types"]
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
}

module.exports = nextConfig