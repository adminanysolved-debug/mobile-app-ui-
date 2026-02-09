import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload a file buffer to Firebase Storage
 * @param fileBuffer - The file buffer to upload
 * @param filename - Original filename
 * @param mimetype - File MIME type
 * @returns Public URL of the uploaded file
 */
export async function uploadToFirebaseStorage(
  fileBuffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  try {
    const bucket = getStorage().bucket();
    const uniqueFilename = `profile-photos/${uuidv4()}-${filename}`;
    const file = bucket.file(uniqueFilename);

    await file.save(fileBuffer, {
      metadata: {
        contentType: mimetype,
      },
      public: true,
    });

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFilename}`;
    return publicUrl;
  } catch (error) {
    console.error("Error uploading to Firebase Storage:", error);
    throw new Error("Failed to upload file");
  }
}

/**
 * Delete a file from Firebase Storage
 * @param fileUrl - Public URL of the file to delete
 */
export async function deleteFromFirebaseStorage(fileUrl: string): Promise<void> {
  try {
    const bucket = getStorage().bucket();
    const filename = fileUrl.split(`${bucket.name}/`)[1];
    if (filename) {
      await bucket.file(filename).delete();
    }
  } catch (error) {
    console.error("Error deleting from Firebase Storage:", error);
    // Don't throw error - if delete fails, it's not critical
  }
}
