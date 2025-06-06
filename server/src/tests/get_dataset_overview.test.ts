
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { getDatasetOverview } from '../handlers/get_dataset_overview';

describe('getDatasetOverview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty overview when no data exists', async () => {
    const result = await getDatasetOverview();

    expect(result.total_images).toEqual(0);
    expect(result.processed_images).toEqual(0);
    expect(result.pending_images).toEqual(0);
    expect(result.annotated_images).toEqual(0);
    expect(result.skipped_images).toEqual(0);
    expect(result.manual_review_images).toEqual(0);
    expect(result.average_confidence).toEqual(0);
    expect(result.processing_completion_rate).toEqual(0);
  });

  it('should return correct overview with only pending images', async () => {
    // Create test images without annotation results
    await db.insert(imagesTable).values([
      {
        filename: 'test1.jpg',
        file_path: '/path/test1.jpg',
        file_size: 1000,
        width: 800,
        height: 600
      },
      {
        filename: 'test2.jpg',
        file_path: '/path/test2.jpg',
        file_size: 2000,
        width: 1024,
        height: 768
      }
    ]).execute();

    const result = await getDatasetOverview();

    expect(result.total_images).toEqual(2);
    expect(result.processed_images).toEqual(0);
    expect(result.pending_images).toEqual(2);
    expect(result.annotated_images).toEqual(0);
    expect(result.skipped_images).toEqual(0);
    expect(result.manual_review_images).toEqual(0);
    expect(result.average_confidence).toEqual(0);
    expect(result.processing_completion_rate).toEqual(0);
  });

  it('should return correct overview with mixed processing status', async () => {
    // Create test images
    const images = await db.insert(imagesTable).values([
      {
        filename: 'test1.jpg',
        file_path: '/path/test1.jpg',
        file_size: 1000,
        width: 800,
        height: 600
      },
      {
        filename: 'test2.jpg',
        file_path: '/path/test2.jpg',
        file_size: 2000,
        width: 1024,
        height: 768
      },
      {
        filename: 'test3.jpg',
        file_path: '/path/test3.jpg',
        file_size: 3000,
        width: 1920,
        height: 1080
      },
      {
        filename: 'test4.jpg',
        file_path: '/path/test4.jpg',
        file_size: 1500,
        width: 640,
        height: 480
      }
    ]).returning().execute();

    // Create annotation results with different statuses
    await db.insert(annotationResultsTable).values([
      {
        image_id: images[0].id,
        status: 'annotated',
        confidence_score: 0.9,
        confidence_level: 'high',
        decision_reason: 'Clear annotation',
        processing_time_ms: 1000
      },
      {
        image_id: images[1].id,
        status: 'skipped',
        confidence_score: 0.3,
        confidence_level: 'low',
        decision_reason: 'Poor quality',
        processing_time_ms: 500
      },
      {
        image_id: images[2].id,
        status: 'manual_review',
        confidence_score: 0.6,
        confidence_level: 'medium',
        decision_reason: 'Uncertain annotation',
        processing_time_ms: 1500
      }
      // Fourth image remains unprocessed (pending)
    ]).execute();

    const result = await getDatasetOverview();

    expect(result.total_images).toEqual(4);
    expect(result.processed_images).toEqual(3);
    expect(result.pending_images).toEqual(1);
    expect(result.annotated_images).toEqual(1);
    expect(result.skipped_images).toEqual(1);
    expect(result.manual_review_images).toEqual(1);
    expect(result.average_confidence).toBeCloseTo(0.6, 1); // (0.9 + 0.3 + 0.6) / 3
    expect(result.processing_completion_rate).toEqual(0.75); // 3/4
  });

  it('should calculate correct average confidence with multiple annotations', async () => {
    // Create test images
    const images = await db.insert(imagesTable).values([
      {
        filename: 'test1.jpg',
        file_path: '/path/test1.jpg',
        file_size: 1000,
        width: 800,
        height: 600
      },
      {
        filename: 'test2.jpg',
        file_path: '/path/test2.jpg',
        file_size: 2000,
        width: 1024,
        height: 768
      }
    ]).returning().execute();

    // Create annotation results with specific confidence scores
    await db.insert(annotationResultsTable).values([
      {
        image_id: images[0].id,
        status: 'annotated',
        confidence_score: 0.8,
        confidence_level: 'high',
        decision_reason: 'Good annotation',
        processing_time_ms: 1000
      },
      {
        image_id: images[1].id,
        status: 'annotated',
        confidence_score: 1.0,
        confidence_level: 'high',
        decision_reason: 'Perfect annotation',
        processing_time_ms: 800
      }
    ]).execute();

    const result = await getDatasetOverview();

    expect(result.total_images).toEqual(2);
    expect(result.processed_images).toEqual(2);
    expect(result.pending_images).toEqual(0);
    expect(result.annotated_images).toEqual(2);
    expect(result.average_confidence).toBeCloseTo(0.9, 2); // (0.8 + 1.0) / 2
    expect(result.processing_completion_rate).toEqual(1.0); // 2/2
  });

  it('should handle 100% completion rate correctly', async () => {
    // Create test image
    const images = await db.insert(imagesTable).values([
      {
        filename: 'test1.jpg',
        file_path: '/path/test1.jpg',
        file_size: 1000,
        width: 800,
        height: 600
      }
    ]).returning().execute();

    // Create annotation result
    await db.insert(annotationResultsTable).values([
      {
        image_id: images[0].id,
        status: 'annotated',
        confidence_score: 0.95,
        confidence_level: 'high',
        decision_reason: 'Excellent quality',
        processing_time_ms: 1200
      }
    ]).execute();

    const result = await getDatasetOverview();

    expect(result.total_images).toEqual(1);
    expect(result.processed_images).toEqual(1);
    expect(result.pending_images).toEqual(0);
    expect(result.processing_completion_rate).toEqual(1.0);
    expect(result.average_confidence).toBeCloseTo(0.95, 2);
  });
});
