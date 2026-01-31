import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
    title: string;
    content: string;
    author?: string;
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPost>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters long'],
            maxlength: [200, 'Title cannot exceed 200 characters']
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            minlength: [10, 'Content must be at least 10 characters long']
        },
        author: {
            type: String,
            trim: true,
            default: 'Anonymous'
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Add indexes for better query performance
postSchema.index({ createdAt: -1 });
postSchema.index({ title: 'text', content: 'text' });

export const Post = mongoose.model<IPost>('Post', postSchema);
