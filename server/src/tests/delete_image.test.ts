
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { type CreateImageInput } from '../schema';
import { deleteImage } from '../handlers/delete_image';
import { eq } from 'drizzle-orm';

// Test image input
const testImage: CreateImageInput = {
  filename: 'test-image.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 1024000,
  width: 800,
  height: 600,
  metadata: { camera: 'Canon EOS', iso: 200 }
};

describe('deleteImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing image', async () => {
    // Create test image
    const insertResult = await db.insert(imagesTable)
      .values({
        filename: testImage.filename,
        file_path: testImage.file_path,
        file_size: testImage.file_size,
        width: testImage.width,
        height: testImage.height,
        metadata: testImage.metadata
      })
      .returning()
      .execute();

    const imageId = insertResult[0].id;

    // Delete the image
    const result = await deleteImage(imageId);

    expect(result.success).toBe(true);

    // Verify image was deleted
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, imageId))
      .execute();

    expect(images).toHaveLength(0);
  });

  it('should return false for non-existent image', async () => {
    const nonExistentId = 999;

    const result = await deleteImage(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should cascade delete annotation results', async () => {
    // Create test image
    const insertResult = await db.insert(imagesTable)
      .values({
        filename: testImage.filename,
        file_path: testImage.file_path,
        file_size: testImage.file_size,
        width: testImage.width,
        height: testImage.height,
        metadata: testImage.metadata
      })
      .returning()
      .execute();

    const imageId = insertResult[0].id;

    // Create annotation result for the image
    await db.insert(annotationResultsTable)
      .values({
        image_id: imageId,
        status: 'annotated',
        confidence_score: 0.85,
        confidence_level: 'high',
        decision_reason: 'Clear object detection',
        annotations: { objects: ['car', 'tree'] },
        processing_time_ms: 1500
      })
      .execute();

    // Delete the image
    const result = await deleteImage(imageId);

    expect(result.success).toBe(true);

    // Verify both image and annotation result were deleted
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, imageId))
      .execute();

    const annotations = await db.select()
      .from(annotationResultsTable)
      .where(eq(annotationResultsTable.image_id, imageId))
      .execute();

    expect(images).toHaveLength(0);
    expect(annotations).toHaveLength(0);
  });
});
