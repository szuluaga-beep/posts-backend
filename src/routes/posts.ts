import { Router, Request, Response } from 'express';
import { Post } from '../models/Post';

const router = Router();

// Create a new post
router.post('/', async (req: Request, res: Response) => {
    try {
        const { title, content, author } = req.body;

        const post = new Post({
            title,
            content,
            author
        });

        const savedPost = await post.save();
        res.status(201).json({
            success: true,
            data: savedPost
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Error creating post'
        });
    }
});

// Get all posts
router.get('/', async (req: Request, res: Response) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: posts.length,
            data: posts
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'Error fetching posts'
        });
    }
});

// Get a single post by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        res.status(200).json({
            success: true,
            data: post
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'Error fetching post'
        });
    }
});

// Update a post
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { title, content, author } = req.body;

        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { title, content, author },
            { new: true, runValidators: true }
        );

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        res.status(200).json({
            success: true,
            data: post
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Error updating post'
        });
    }
});

// Delete a post
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully',
            data: post
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'Error deleting post'
        });
    }
});

export default router;
