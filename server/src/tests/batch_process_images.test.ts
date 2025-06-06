
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { type BatchProcessInput } from '../schema';
import { batchProcessImages } from '../handlers/batch_process_images';
import { eq, inArray } from 'drizzle-orm';

describe('batchProcessImages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestImage = async (filename: string) => {
    const result = await db.insert(imagesTable)
      .values({
        filename,
        file_path: `/uploads/${filename}`,
        file_size: 1024000,
        width: 1920,
        height: 1080,
        metadata: { camera: 'test' }
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should process specific images by IDs', async () => {
    // Create test images
    const image1 = await createTestImage('test1.jpg');
    const image2 = await createTestImage('test2.jpg');
    const image3 = await createTestImage('test3.jpg');

    const input: BatchProcessInput = {
      image_ids: [image1.id, image2.id]
    };

    const results = await batchProcessImages(input);

    expect(results).toHaveLength(2);
    
    // Verify all results have required fields
    results.forEach(result => {
      expect(result.id).toBeDefined();
      expect(result.image_id).toBeDefined();
      expect(['annotated', 'skipped', 'manual_review']).toContain(result.status);
      expect(['low', 'medium', 'high']).toContain(result.confidence_level);
      expect(typeof result.confidence_score).toBe('number');
      expect(result.confidence_score).toBeGreaterThanOrEqual(0);
      expect(result.confidence_score).toBeLessThanOrEqual(1);
      expect(result.decision_reason).toBeTruthy();
      expect(typeof result.processing_time_ms).toBe('number');
      expect(result.processed_at).toBeInstanceOf(Date);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    // Verify correct image IDs were processed
    const processedImageIds = results.map(r => r.image_id).sort();
    expect(processedImageIds).toEqual([image1.id, image2.id].sort());

    // Image3 should not be processed
    expect(results.some(r => r.image_id === image3.id)).toBe(false);
  });

  it('should process all pending images when process_all_pending is true', async () => {
    // Create test images
    const image1 = await createTestImage('pending1.jpg');
    const image2 = await createTestImage('pending2.jpg');
    const image3 = await createTestImage('pending3.jpg');

    // Process one image first to make it non-pending
    await db.insert(annotationResultsTable)
      .values({
        image_id: image1.id,
        status: 'annotated',
        confidence_score: 0.8,
        confidence_level: 'high',
        decision_reason: 'Test annotation',
        processing_time_ms: 500
      })
      .execute();

    const input: BatchProcessInput = {
      process_all_pending: true
    };

    const results = await batchProcessImages(input);

    // Should only process the 2 pending images (image2 and image3)
    expect(results).toHaveLength(2);
    
    const processedImageIds = results.map(r => r.image_id).sort();
    expect(processedImageIds).toEqual([image2.id, image3.id].sort());

    // Verify image1 was not processed again
    expect(results.some(r => r.image_id === image1.id)).toBe(false);
  });

  it('should return empty array when no images specified', async () => {
    const input: BatchProcessInput = {};

    const results = await batchProcessImages(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when empty image_ids provided', async () => {
    const input: BatchProcessInput = {
      image_ids: []
    };

    const results = await batchProcessImages(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no pending images exist', async () => {
    // Create an image and process it
    const image = await createTestImage('processed.jpg');
    await db.insert(annotationResultsTable)
      .values({
        image_id: image.id,
        status: 'annotated',
        confidence_score: 0.9,
        confidence_level: 'high',
        decision_reason: 'Already processed',
        processing_time_ms: 300
      })
      .execute();

    const input: BatchProcessInput = {
      process_all_pending: true
    };

    const results = await batchProcessImages(input);

    expect(results).toHaveLength(0);
  });

  it('should save annotation results to database', async () => {
    const image = await createTestImage('save_test.jpg');

    const input: BatchProcessInput = {
      image_ids: [image.id]
    };

    const results = await batchProcessImages(input);
    expect(results).toHaveLength(1);

    // Verify data was saved to database
    const savedResults = await db.select()
      .from(annotationResultsTable)
      .where(eq(annotationResultsTable.image_id, image.id))
      .execute();

    expect(savedResults).toHaveLength(1);
    expect(savedResults[0].image_id).toBe(image.id);
    expect(savedResults[0].status).toBe(results[0].status);
    expect(savedResults[0].confidence_score).toBe(results[0].confidence_score);
    expect(savedResults[0].confidence_level).toBe(results[0].confidence_level);
  });

  it('should handle annotations field correctly', async () => {
    const image = await createTestImage('annotations_test.jpg');

    const input: BatchProcessInput = {
      image_ids: [image.id]
    };

    const results = await batchProcessImages(input);
    const result = results[0];

    if (result.status === 'annotated') {
      expect(result.annotations).toBeTruthy();
      expect(typeof result.annotations).toBe('object');
    } else {
      expect(result.annotations).toBeNull();
    }
  });
});
