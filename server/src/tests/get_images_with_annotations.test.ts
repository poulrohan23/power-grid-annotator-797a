
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { getImagesWithAnnotations } from '../handlers/get_images_with_annotations';

describe('getImagesWithAnnotations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no images exist', async () => {
    const result = await getImagesWithAnnotations();
    expect(result).toEqual([]);
  });

  it('should return image without annotation result', async () => {
    // Create test image
    const imageResult = await db.insert(imagesTable)
      .values({
        filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024,
        width: 800,
        height: 600,
        metadata: { camera: 'Canon' }
      })
      .returning()
      .execute();

    const result = await getImagesWithAnnotations();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(imageResult[0].id);
    expect(result[0].filename).toEqual('test.jpg');
    expect(result[0].file_path).toEqual('/uploads/test.jpg');
    expect(result[0].file_size).toEqual(1024);
    expect(result[0].width).toEqual(800);
    expect(result[0].height).toEqual(600);
    expect(result[0].metadata).toEqual({ camera: 'Canon' });
    expect(result[0].upload_date).toBeInstanceOf(Date);
    expect(result[0].annotation_result).toBeNull();
  });

  it('should return image with annotation result', async () => {
    // Create test image
    const imageResult = await db.insert(imagesTable)
      .values({
        filename: 'annotated.jpg',
        file_path: '/uploads/annotated.jpg',
        file_size: 2048,
        width: 1024,
        height: 768,
        metadata: null
      })
      .returning()
      .execute();

    // Create annotation result
    const annotationResult = await db.insert(annotationResultsTable)
      .values({
        image_id: imageResult[0].id,
        status: 'annotated',
        confidence_score: 0.85,
        confidence_level: 'high',
        decision_reason: 'Clear object detection',
        annotations: { objects: ['cat', 'dog'] },
        processing_time_ms: 1500
      })
      .returning()
      .execute();

    const result = await getImagesWithAnnotations();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(imageResult[0].id);
    expect(result[0].filename).toEqual('annotated.jpg');
    expect(result[0].annotation_result).not.toBeNull();
    expect(result[0].annotation_result?.id).toEqual(annotationResult[0].id);
    expect(result[0].annotation_result?.status).toEqual('annotated');
    expect(result[0].annotation_result?.confidence_score).toEqual(0.85);
    expect(result[0].annotation_result?.confidence_level).toEqual('high');
    expect(result[0].annotation_result?.decision_reason).toEqual('Clear object detection');
    expect(result[0].annotation_result?.annotations).toEqual({ objects: ['cat', 'dog'] });
    expect(result[0].annotation_result?.processing_time_ms).toEqual(1500);
    expect(result[0].annotation_result?.processed_at).toBeInstanceOf(Date);
    expect(result[0].annotation_result?.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple images with mixed annotation states', async () => {
    // Create first image without annotation
    const image1 = await db.insert(imagesTable)
      .values({
        filename: 'image1.jpg',
        file_path: '/uploads/image1.jpg',
        file_size: 1024,
        width: 800,
        height: 600,
        metadata: null
      })
      .returning()
      .execute();

    // Create second image with annotation
    const image2 = await db.insert(imagesTable)
      .values({
        filename: 'image2.jpg',
        file_path: '/uploads/image2.jpg',
        file_size: 2048,
        width: 1024,
        height: 768,
        metadata: { source: 'camera' }
      })
      .returning()
      .execute();

    // Add annotation to second image
    await db.insert(annotationResultsTable)
      .values({
        image_id: image2[0].id,
        status: 'skipped',
        confidence_score: 0.3,
        confidence_level: 'low',
        decision_reason: 'Blurry image',
        annotations: null,
        processing_time_ms: 500
      })
      .execute();

    const result = await getImagesWithAnnotations();

    expect(result).toHaveLength(2);
    
    // Find results by filename
    const result1 = result.find(r => r.filename === 'image1.jpg');
    const result2 = result.find(r => r.filename === 'image2.jpg');

    expect(result1).toBeDefined();
    expect(result1?.annotation_result).toBeNull();

    expect(result2).toBeDefined();
    expect(result2?.annotation_result).not.toBeNull();
    expect(result2?.annotation_result?.status).toEqual('skipped');
    expect(result2?.annotation_result?.confidence_level).toEqual('low');
    expect(result2?.metadata).toEqual({ source: 'camera' });
  });
});
