
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type CreateImageInput } from '../schema';
import { createImage } from '../handlers/create_image';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateImageInput = {
  filename: 'test-image.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 1024000,
  width: 1920,
  height: 1080,
  metadata: { camera: 'Canon EOS R5', iso: 100 }
};

describe('createImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an image', async () => {
    const result = await createImage(testInput);

    // Basic field validation
    expect(result.filename).toEqual('test-image.jpg');
    expect(result.file_path).toEqual('/uploads/test-image.jpg');
    expect(result.file_size).toEqual(1024000);
    expect(result.width).toEqual(1920);
    expect(result.height).toEqual(1080);
    expect(result.metadata).toEqual({ camera: 'Canon EOS R5', iso: 100 });
    expect(result.id).toBeDefined();
    expect(result.upload_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save image to database', async () => {
    const result = await createImage(testInput);

    // Query using proper drizzle syntax
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, result.id))
      .execute();

    expect(images).toHaveLength(1);
    expect(images[0].filename).toEqual('test-image.jpg');
    expect(images[0].file_path).toEqual('/uploads/test-image.jpg');
    expect(images[0].file_size).toEqual(1024000);
    expect(images[0].width).toEqual(1920);
    expect(images[0].height).toEqual(1080);
    expect(images[0].metadata).toEqual({ camera: 'Canon EOS R5', iso: 100 });
    expect(images[0].upload_date).toBeInstanceOf(Date);
    expect(images[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null metadata', async () => {
    const inputWithoutMetadata: CreateImageInput = {
      filename: 'simple-image.png',
      file_path: '/uploads/simple-image.png',
      file_size: 512000,
      width: 800,
      height: 600
    };

    const result = await createImage(inputWithoutMetadata);

    expect(result.filename).toEqual('simple-image.png');
    expect(result.metadata).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle explicit null metadata', async () => {
    const inputWithNullMetadata: CreateImageInput = {
      filename: 'null-metadata.gif',
      file_path: '/uploads/null-metadata.gif',
      file_size: 256000,
      width: 400,
      height: 300,
      metadata: null
    };

    const result = await createImage(inputWithNullMetadata);

    expect(result.filename).toEqual('null-metadata.gif');
    expect(result.metadata).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
