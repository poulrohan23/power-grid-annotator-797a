
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { resetProcessing } from '../handlers/reset_processing';

describe('resetProcessing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should reset processing state successfully', async () => {
    const result = await resetProcessing();

    expect(result.success).toBe(true);
    expect(result.message).toMatch(/Successfully reset processing state/);
    expect(typeof result.message).toBe('string');
  });

  it('should remove all annotation results', async () => {
    // Create test image first
    const imageResult = await db.insert(imagesTable)
      .values({
        filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024,
        width: 800,
        height: 600,
        metadata: null
      })
      .returning()
      .execute();

    const imageId = imageResult[0].id;

    // Create test annotation results
    await db.insert(annotationResultsTable)
      .values([
        {
          image_id: imageId,
          status: 'annotated',
          confidence_score: 0.95,
          confidence_level: 'high',
          decision_reason: 'High confidence detection',
          annotations: { objects: ['car', 'person'] },
          processing_time_ms: 1500
        },
        {
          image_id: imageId,
          status: 'skipped',
          confidence_score: 0.3,
          confidence_level: 'low',
          decision_reason: 'Low confidence, skipped',
          annotations: null,
          processing_time_ms: 800
        }
      ])
      .execute();

    // Verify annotation results exist
    const beforeReset = await db.select()
      .from(annotationResultsTable)
      .execute();
    expect(beforeReset).toHaveLength(2);

    // Reset processing
    const result = await resetProcessing();

    // Verify all annotation results are removed
    const afterReset = await db.select()
      .from(annotationResultsTable)
      .execute();
    expect(afterReset).toHaveLength(0);

    // Verify success response
    expect(result.success).toBe(true);
    expect(result.message).toContain('Removed 2 annotation results');

    // Verify images are still present (not deleted)
    const images = await db.select()
      .from(imagesTable)
      .execute();
    expect(images).toHaveLength(1);
    expect(images[0].filename).toBe('test.jpg');
  });

  it('should handle empty database gracefully', async () => {
    const result = await resetProcessing();

    expect(result.success).toBe(true);
    expect(result.message).toContain('Removed 0 annotation results');
  });
});
