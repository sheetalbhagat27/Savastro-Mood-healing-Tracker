import mongoose from 'mongoose';

export const INITIAL_PROS = [
  {
    id: 1,
    name: 'Acharya Devendra Shastri',
    type: 'Vedic Astrologer',
    tags: ['low', 'fluctuating'],
    exp: 18,
    price: 350,
    rating: 4.9,
    avail: 'Today 6 PM'
  },
  {
    id: 2,
    name: 'Meera Nandini',
    type: 'Tarot Reader',
    tags: ['fluctuating'],
    exp: 9,
    price: 250,
    rating: 4.7,
    avail: 'Today 8 PM'
  },
  {
    id: 3,
    name: 'Swami Bodhi',
    type: 'Meditation Guide',
    tags: ['low', 'positive'],
    exp: 14,
    price: 200,
    rating: 4.8,
    avail: 'Tomorrow 7 AM'
  }
];

const proSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    tags: [{ type: String }],
    exp: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    avail: { type: String, default: 'Today' }
  },
  {
    timestamps: true
  }
);

export const Pro = mongoose.model('Pro', proSchema);

export const ensureProsSeeded = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const count = await Pro.countDocuments();
    if (count === 0) {
      await Pro.insertMany(INITIAL_PROS);
      console.log('[Seed] Default guides and astrologers seeded successfully.');
    }
  } catch (err) {
    console.warn('[Seed] Notice during pro seeding:', err.message);
  }
};

export default Pro;
