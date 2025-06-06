
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteImage = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the image record (cascade will handle annotation_results)
    const result = await db.delete(imagesTable)
      .where(eq(imagesTable.id, id))
      .execute();

    // Check if any rows were affected
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Image deletion failed:', error);
    throw error;
  }
};
