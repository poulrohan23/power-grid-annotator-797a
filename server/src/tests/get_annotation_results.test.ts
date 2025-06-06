
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { getAnnotationResults } from '../handlers/get_annotation_results';

describe('getAnnotationResults', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no annotation results exist', async () => {
    const results = await getAnnotationResults();
    expect(results).toEqual([]);
  });

  it('should return all annotation results', async () => {
    // Create test image first
    const imageResult = await db.insert(imagesTable)
      .values({
        filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024,
        width: 800,
        height: 600
      })
      .returning()
      .execute();

    const imageId = imageResult[0].id;

    // Create annotation results
    await db.insert(annotationResultsTable)
      .values([
        {
          image_id: imageId,
          status: 'annotated',
          confidence_score: 0.95,
          confidence_level: 'high',
          decision_reason: 'Clear detection',
          processing_time_ms: 150
        },
        {
          image_id: imageId,
          status: 'manual_review',
          confidence_score: 0.65,
          confidence_level: 'medium',
          decision_reason: 'Uncertain detection',
          processing_time_ms: 200
        }
      ])
      .execute();

    const results = await getAnnotationResults();

    expect(results).toHaveLength(2);
    
    // Check first result
    expect(results[0].image_id).toBe(imageId);
    expect(results[0].status).toBe('annotated');
    expect(results[0].confidence_score).toBe(0.95);
    expect(typeof results[0].confidence_score).toBe('number');
    expect(results[0].confidence_level).toBe('high');
    expect(results[0].decision_reason).toBe('Clear detection');
    expect(results[0].processing_time_ms).toBe(150);
    expect(results[0].id).toBeDefined();
    expect(results[0].processed_at).toBeInstanceOf(Date);
    expect(results[0].created_at).toBeInstanceOf(Date);

    // Check second result
    expect(results[1].image_id).toBe(imageId);
    expect(results[1].status).toBe('manual_review');
    expect(results[1].confidence_score).toBe(0.65);
    expect(typeof results[1].confidence_score).toBe('number');
    expect(results[1].confidence_level).toBe('medium');
    expect(results[1].decision_reason).toBe('Uncertain detection');
    expect(results[1].processing_time_ms).toBe(200);
  });

  it('should handle annotation results with jsonb fields', async () => {
    // Create test image
    const imageResult = await db.insert(imagesTable)
      .values({
        filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024,
        width: 800,
        height: 600
      })
      .returning()
      .execute();

    const imageId = imageResult[0].id;

    // Create annotation result with jsonb data
    await db.insert(annotationResultsTable)
      .values({
        image_id: imageId,
        status: 'annotated',
        confidence_score: 0.85,
        confidence_level: 'high',
        decision_reason: 'Object detected',
        annotations: {
          objects: [
            { type: 'person', bbox: [10, 20, 100, 200], confidence: 0.9 },
            { type: 'car', bbox: [150, 50, 300, 150], confidence: 0.8 }
          ]
        },
        processing_time_ms: 175
      })
      .execute();

    const results = await getAnnotationResults();

    expect(results).toHaveLength(1);
    expect(results[0].annotations).toEqual({
      objects: [
        { type: 'person', bbox: [10, 20, 100, 200], confidence: 0.9 },
        { type: 'car', bbox: [150, 50, 300, 150], confidence: 0.8 }
      ]
    });
  });
});
