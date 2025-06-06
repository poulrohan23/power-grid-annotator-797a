
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { type CreateImageInput } from '../schema';
import { getImageById } from '../handlers/get_image_by_id';

// Test data
const testImageInput: CreateImageInput = {
  filename: 'test-image.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 1024000,
  width: 1920,
  height: 1080,
  metadata: { camera: 'Canon EOS R5', iso: 100 }
};

describe('getImageById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return image without annotation result', async () => {
    // Create test image
    const imageResult = await db.insert(imagesTable)
      .values({
        filename: testImageInput.filename,
        file_path: testImageInput.file_path,
        file_size: testImageInput.file_size,
        width: testImageInput.width,
        height: testImageInput.height,
        metadata: testImageInput.metadata
      })
      .returning()
      .execute();

    const createdImage = imageResult[0];

    // Get image by ID
    const result = await getImageById(createdImage.id);

    // Verify image data
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdImage.id);
    expect(result!.filename).toEqual('test-image.jpg');
    expect(result!.file_path).toEqual('/uploads/test-image.jpg');
    expect(result!.file_size).toEqual(1024000);
    expect(result!.width).toEqual(1920);
    expect(result!.height).toEqual(1080);
    expect(result!.metadata).toEqual({ camera: 'Canon EOS R5', iso: 100 });
    expect(result!.upload_date).toBeInstanceOf(Date);
    expect(result!.annotation_result).toBeNull();
  });

  it('should return image with annotation result', async () => {
    // Create test image
    const imageResult = await db.insert(imagesTable)
      .values({
        filename: testImageInput.filename,
        file_path: testImageInput.file_path,
        file_size: testImageInput.file_size,
        width: testImageInput.width,
        height: testImageInput.height,
        metadata: testImageInput.metadata
      })
      .returning()
      .execute();

    const createdImage = imageResult[0];

    // Create annotation result
    const annotationResult = await db.insert(annotationResultsTable)
      .values({
        image_id: createdImage.id,
        status: 'annotated',
        confidence_score: 0.95,
        confidence_level: 'high',
        decision_reason: 'Clear object detection',
        annotations: { objects: ['cat', 'dog'] },
        processing_time_ms: 1500
      })
      .returning()
      .execute();

    const createdAnnotation = annotationResult[0];

    // Get image by ID
    const result = await getImageById(createdImage.id);

    // Verify image data
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdImage.id);
    expect(result!.filename).toEqual('test-image.jpg');
    expect(result!.annotation_result).toBeDefined();
    expect(result!.annotation_result!.id).toEqual(createdAnnotation.id);
    expect(result!.annotation_result!.image_id).toEqual(createdImage.id);
    expect(result!.annotation_result!.status).toEqual('annotated');
    expect(result!.annotation_result!.confidence_score).toEqual(0.95);
    expect(result!.annotation_result!.confidence_level).toEqual('high');
    expect(result!.annotation_result!.decision_reason).toEqual('Clear object detection');
    expect(result!.annotation_result!.annotations).toEqual({ objects: ['cat', 'dog'] });
    expect(result!.annotation_result!.processing_time_ms).toEqual(1500);
    expect(result!.annotation_result!.processed_at).toBeInstanceOf(Date);
    expect(result!.annotation_result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent image', async () => {
    const result = await getImageById(999);
    expect(result).toBeNull();
  });

  it('should handle image with null metadata', async () => {
    // Create test image with null metadata
    const imageResult = await db.insert(imagesTable)
      .values({
        filename: 'no-metadata.jpg',
        file_path: '/uploads/no-metadata.jpg',
        file_size: 500000,
        width: 800,
        height: 600,
        metadata: null
      })
      .returning()
      .execute();

    const createdImage = imageResult[0];

    // Get image by ID
    const result = await getImageById(createdImage.id);

    expect(result).toBeDefined();
    expect(result!.metadata).toBeNull();
    expect(result!.annotation_result).toBeNull();
  });
});
