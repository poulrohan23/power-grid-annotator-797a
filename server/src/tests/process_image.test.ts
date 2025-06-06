
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { type ProcessImageInput, type CreateImageInput } from '../schema';
import { processImage } from '../handlers/process_image';
import { eq } from 'drizzle-orm';

// Test input for creating an image first
const testImageInput: CreateImageInput = {
  filename: 'test-image.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 1024000,
  width: 800,
  height: 600,
  metadata: { camera: 'Canon EOS', iso: 400 }
};

describe('processImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should process an image and create annotation result', async () => {
    // First create an image
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

    const image = imageResult[0];
    const processInput: ProcessImageInput = { image_id: image.id };

    const result = await processImage(processInput);

    // Validate annotation result fields
    expect(result.id).toBeDefined();
    expect(result.image_id).toEqual(image.id);
    expect(result.status).toEqual('annotated');
    expect(typeof result.confidence_score).toBe('number');
    expect(result.confidence_score).toBeGreaterThan(0);
    expect(result.confidence_score).toBeLessThanOrEqual(1);
    expect(result.confidence_level).toEqual('high');
    expect(result.decision_reason).toBeDefined();
    expect(result.annotations).toBeDefined();
    expect(result.processing_time_ms).toBeGreaterThanOrEqual(0);
    expect(result.processed_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save annotation result to database', async () => {
    // Create an image first
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

    const image = imageResult[0];
    const processInput: ProcessImageInput = { image_id: image.id };

    const result = await processImage(processInput);

    // Verify annotation result is saved in database
    const savedResults = await db.select()
      .from(annotationResultsTable)
      .where(eq(annotationResultsTable.id, result.id))
      .execute();

    expect(savedResults).toHaveLength(1);
    const savedResult = savedResults[0];
    expect(savedResult.image_id).toEqual(image.id);
    expect(savedResult.status).toEqual('annotated');
    expect(parseFloat(savedResult.confidence_score.toString())).toBeGreaterThan(0);
    expect(savedResult.confidence_level).toEqual('high');
    expect(savedResult.annotations).toBeDefined();
    expect(savedResult.processing_time_ms).toBeGreaterThanOrEqual(0);
  });

  it('should throw error for non-existent image', async () => {
    const processInput: ProcessImageInput = { image_id: 999999 };

    await expect(processImage(processInput)).rejects.toThrow(/Image with ID 999999 not found/i);
  });

  it('should handle annotations with proper structure', async () => {
    // Create an image first
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

    const image = imageResult[0];
    const processInput: ProcessImageInput = { image_id: image.id };

    const result = await processImage(processInput);

    // Validate annotation structure
    expect(result.annotations).toBeDefined();
    const annotations = result.annotations as any;
    expect(annotations.objects).toBeDefined();
    expect(Array.isArray(annotations.objects)).toBe(true);
    expect(annotations.total_objects).toBeGreaterThan(0);
    
    // Validate individual object annotations
    if (annotations.objects.length > 0) {
      const firstObject = annotations.objects[0];
      expect(firstObject.type).toBeDefined();
      expect(firstObject.bbox).toBeDefined();
      expect(Array.isArray(firstObject.bbox)).toBe(true);
      expect(firstObject.confidence).toBeGreaterThan(0);
    }
  });
});
