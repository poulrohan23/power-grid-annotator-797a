
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type CreateImageInput, type Image } from '../schema';

export const createImage = async (input: CreateImageInput): Promise<Image> => {
  try {
    // Insert image record
    const result = await db.insert(imagesTable)
      .values({
        filename: input.filename,
        file_path: input.file_path,
        file_size: input.file_size,
        width: input.width,
        height: input.height,
        metadata: input.metadata || null
      })
      .returning()
      .execute();

    // Cast metadata to the expected type since drizzle returns unknown for jsonb
    const image = result[0];
    return {
      ...image,
      metadata: image.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Image creation failed:', error);
    throw error;
  }
};
