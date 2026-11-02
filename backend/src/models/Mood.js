import mongoose from 'mongoose';

export const MOOD_DEFINITIONS = {
  happy: ['😄', 'Happy', 5],
  good: ['🙂', 'Good', 4],
  okay: ['😐', 'Okay', 3],
  confused: ['😕', 'Confused', 3],
  notgood: ['🙁', 'Not very good', 2],
  low: ['😔', 'Low', 2],
  anxious: ['😰', 'Anxious', 1],
  stressed: ['😣', 'Stressed', 1]
};

const moodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
    },
    mood: {
      type: String,
      required: [true, 'Please select how you feel'],
      enum: {
        values: Object.keys(MOOD_DEFINITIONS),
        message: 'Invalid mood value'
      }
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// One mood entry per user per calendar day
moodSchema.index({ user: 1, date: 1 }, { unique: true });

export const Mood = mongoose.model('Mood', moodSchema);
export default Mood;
