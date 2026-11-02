import { findPros } from '../models/store.js';

export const getGuides = async (req, res, next) => {
  try {
    const guides = await findPros();
    return res.json(guides);
  } catch (error) {
    next(error);
  }
};

export default { getGuides };
