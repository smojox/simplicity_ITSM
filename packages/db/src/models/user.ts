import mongoose, { Schema, Document } from 'mongoose'
import type { User } from '@simplicity/types'

export interface IUser extends User, Document {}

const userSchema = new Schema<IUser>({
  orgId: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  roles: [{
    type: String,
    enum: ['admin', 'member', 'oncall'],
    default: 'member'
  }]
}, {
  timestamps: true
})

userSchema.index({ orgId: 1, email: 1 }, { unique: true })
userSchema.index({ email: 1 })

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema)