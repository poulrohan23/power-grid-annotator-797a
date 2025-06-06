
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type Image } from '../schema';

export const getImages = async (): Promise<Image[]> => {
  try {
    const results = await db.select()
      .from(imagesTable)
      .execute();

    return results.map(image => ({
      ...image,
      // Convert timestamp fields to Date objects and handle metadata type
      upload_date: image.upload_date,
      created_at: image.created_at,
      metadata: image.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to fetch images:', error);
    throw error;
  }
};
