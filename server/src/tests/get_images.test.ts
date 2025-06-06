
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type CreateImageInput } from '../schema';
import { getImages } from '../handlers/get_images';

// Test data
const testImage1: CreateImageInput = {
  filename: 'test1.jpg',
  file_path: '/uploads/test1.jpg',
  file_size: 1024,
  width: 800,
  height: 600,
  metadata: { camera: 'Canon', iso: 100 }
};

const testImage2: CreateImageInput = {
  filename: 'test2.png',
  file_path: '/uploads/test2.png',
  file_size: 2048,
  width: 1920,
  height: 1080,
  metadata: null
};

describe('getImages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no images exist', async () => {
    const result = await getImages();
    expect(result).toEqual([]);
  });

  it('should return all images', async () => {
    // Create test images
    await db.insert(imagesTable)
      .values([testImage1, testImage2])
      .execute();

    const result = await getImages();

    expect(result).toHaveLength(2);
    expect(result[0].filename).toEqual('test1.jpg');
    expect(result[0].file_path).toEqual('/uploads/test1.jpg');
    expect(result[0].file_size).toEqual(1024);
    expect(result[0].width).toEqual(800);
    expect(result[0].height).toEqual(600);
    expect(result[0].metadata).toEqual({ camera: 'Canon', iso: 100 });
    expect(result[0].upload_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    expect(result[1].filename).toEqual('test2.png');
    expect(result[1].file_path).toEqual('/uploads/test2.png');
    expect(result[1].file_size).toEqual(2048);
    expect(result[1].width).toEqual(1920);
    expect(result[1].height).toEqual(1080);
    expect(result[1].metadata).toBeNull();
    expect(result[1].upload_date).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].id).toBeDefined();
  });

  it('should return images with correct field types', async () => {
    await db.insert(imagesTable)
      .values(testImage1)
      .execute();

    const result = await getImages();

    expect(result).toHaveLength(1);
    const image = result[0];
    
    expect(typeof image.id).toBe('number');
    expect(typeof image.filename).toBe('string');
    expect(typeof image.file_path).toBe('string');
    expect(image.upload_date).toBeInstanceOf(Date);
    expect(typeof image.file_size).toBe('number');
    expect(typeof image.width).toBe('number');
    expect(typeof image.height).toBe('number');
    expect(typeof image.metadata).toBe('object');
    expect(image.created_at).toBeInstanceOf(Date);
  });
});
