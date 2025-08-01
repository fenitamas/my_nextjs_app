import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9._]*$/,
      'Username must start with a letter and can contain letters, numbers, underscores, or periods only'
    ),
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
  const result = registerSchema.safeParse(req.body)

  if (!result.success) {
  const errors = result.error.issues.map((e) => e.message)
  return res.status(400).json({ error: errors })
}


  const { username, email, password } = result.data

  try {
    // 🔎 Check if email is already registered
    const existingUser = await prisma.users.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // ✅ Create new user
    const newUser = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    })

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      },
    })
  } catch (error) {
    console.error('❌ Registration failed:', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
