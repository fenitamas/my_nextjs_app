import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '@/lib/authMiddleware'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = authenticate(req, res)
  if (!user) return // Authentication failed, response already sent

  // ------------------ GET ------------------
  if (req.method === 'GET') {
    const { tagId, search, category } = req.query

    try {
      const posts = await prisma.posts.findMany({
        where: {
          ...(tagId && {
            tags: {
              some: { id: parseInt(tagId as string) }
            }
          }),
          ...(search && {
            OR: [
              { title: { contains: search as string, mode: 'insensitive' } },
              { content: { contains: search as string, mode: 'insensitive' } }
            ]
          }),
          ...(category && {
            category: {
              name: { equals: category as string, mode: 'insensitive' }
            }
          })
        },
        include: {
          users: { select: { id: true, username: true } },
          comments: true,
          category: true,
          tags: true
        }
      })

      return res.status(200).json(posts)
    } catch (error) {
      console.error('❌ Error fetching posts:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  // ------------------ POST ------------------
  if (req.method === 'POST') {
    const { title, content, categoryId, tagIds } = req.body

    if (!title || !categoryId || !Array.isArray(tagIds)) {
      return res.status(400).json({ error: 'Title, categoryId, and tagIds are required' })
    }

    try {
      const post = await prisma.posts.create({
        data: {
          title,
          content,
          user_id: user.userId,
          categoryId,
          tags: {
            connect: tagIds.map((id: number) => ({ id }))
          }
        },
        include: {
          users: { select: { username: true } },
          category: true,
          tags: true
        }
      })

      return res.status(201).json({ message: 'Post created', post })
    } catch (error) {
      console.error('❌ Error creating post:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  // ------------------ Method Not Allowed ------------------
  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
