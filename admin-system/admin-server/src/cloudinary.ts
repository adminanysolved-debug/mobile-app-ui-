import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary using the environment variable or individual keys
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

/**
 * Upload a file buffer to Cloudinary (auto detects image/video)
 * @param fileBuffer - The file buffer to upload
 * @param filename - Original filename
 * @returns Public URL of the uploaded asset
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'promotions', // Store promotional content here
          public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
          resource_type: 'auto', // Automatically detect image vs video
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error('Failed to upload asset to Cloudinary'));
          } else if (result) {
            resolve(result.secure_url); // Always returns HTTPS
          } else {
            reject(new Error('Upload failed - undefined result'));
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const stream = Readable.from(fileBuffer);
      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('Error in uploadToCloudinary:', error);
    throw new Error('Failed to upload asset');
  }
}
