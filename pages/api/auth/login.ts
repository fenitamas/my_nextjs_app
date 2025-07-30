import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const SECRET = process.env.JWT_SECRET || 'your-secret'

// 🔐 Login schema with strong password rules
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number')
    .regex(/[\W_]/, 'Password must include at least one special character'),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ✅ Validate input using Zod
  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    const errors = result.error.issues.map((e) => e.message)
    return res.status(400).json({ error: errors })
  }

  const { email, password } = result.data

  try {
    const user = await prisma.users.findUnique({ where: { email } })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, {
      expiresIn: '1h',
    })

    return res.status(200).json({ message: 'Login successful', token })
  } catch (error) {
    console.error('❌ Login failed:', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
