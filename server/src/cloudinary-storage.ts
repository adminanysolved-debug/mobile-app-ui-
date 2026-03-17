import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
// Calling config() with no arguments or with secure: true 
// will cause the SDK to automatically use the CLOUDINARY_URL from process.env 
// if it is present. We fallback to individual keys if not.
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
 * Upload a file buffer to Cloudinary
 * @param fileBuffer - The file buffer to upload
 * @param filename - Original filename
 * @returns Public URL of the uploaded image
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile-photos', // Organize in folders
          public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`, // Unique filename
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error('Failed to upload image'));
          } else if (result) {
            resolve(result.secure_url); // Returns HTTPS URL
          } else {
            reject(new Error('Upload failed - no result'));
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const stream = Readable.from(fileBuffer);
      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Delete an image from Cloudinary
 * @param imageUrl - The Cloudinary URL of the image to delete
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/filename.jpg
    const urlParts = imageUrl.split('/');
    const fileWithExtension = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const publicId = `${folder}/${fileWithExtension.split('.')[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw error - if delete fails, it's not critical
  }
}
