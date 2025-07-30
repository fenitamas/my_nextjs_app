// lib/authMiddleware.ts
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'your-secret'

export function authenticate(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Token missing' })
    return null
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, SECRET) as { userId: number; email: string }
    return decoded
  } catch (err) {
    console.error('Token verification failed:', err)
    res.status(401).json({ error: 'Unauthorized: Invalid token' })
    return null
  }
}
