import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const {
        username = '',  
        page = '1',     // pagination
        limit = '10',
        sortBy = 'email',  // sorting field
        order = 'asc'      // sorting order
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const users = await prisma.users.findMany({
        where: {
          username: {
            contains: username as string,
            mode: 'insensitive'  // case-insensitive search
          }
        },
        orderBy: {
          [sortBy as string]: order === 'desc' ? 'desc' : 'asc'
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true,
          username: true,
          email: true,
          posts: {
            select: { title: true }
          },
          comments: {
            select: { content: true }
          }
        }
      });

      res.status(200).json(users);
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
