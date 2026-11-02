import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide an activity name'],
      trim: true,
      default: 'Om Namah Shivay'
    },
    by: {
      type: String,
      default: 'Acharya Devendra Shastri',
      trim: true
    },
    target: {
      type: Number,
      default: 5,
      min: 1
    },
    seconds: {
      type: Number,
      default: 20,
      min: 1
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'done'],
      default: 'pending',
      index: true
    },
    last: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
