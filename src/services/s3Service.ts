import s3Client from "@/lib/s3Client";
import {
  DeleteObjectsCommand,
  type DeleteObjectsCommandInput,
  type ObjectCannedACL,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

/**
 * Uploads data to AWS S3 using the Upload class for handling streams.
 *
 * @param data - The data to upload (Buffer, ReadableStream, Blob, etc.).
 * @param folder - The folder/path within the S3 bucket (e.g., 'avatars/', 'videos/').
 * @param fileName - The name of the file (e.g., 'image.png', 'video.mp4').
 * @param contentType - The MIME type of the file (e.g., 'image/png', 'video/mp4').
 * @param acl - Access control list setting (default: 'public-read').
 * @returns The URL of the uploaded file.
 */
export async function uploadToS3(
  data: Buffer | ReadableStream | Blob,
  folder: string,
  fileName: string,
  contentType: string,
  acl: ObjectCannedACL = "public-read"
): Promise<{ url: string; key: string }> {
  const bucketName = process.env.AWS_BUCKET_NAME!;
  const key = `${folder}${Date.now()}-${fileName}`;

  const uploadParams: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
    Body: data,
    ACL: acl,
    ContentType: contentType,
  };

  try {
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: uploadParams,
      // You can adjust concurrency and part size as needed
      queueSize: 4, // concurrency
      partSize: 5 * 1024 * 1024, // 5 MB
    });

    parallelUploads3.on("httpUploadProgress", (progress) => {
      console.log(`Uploaded ${progress.loaded} of ${progress.total}`);
    });

    await parallelUploads3.done();

    return {
      url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      key: key,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}

export async function deleteS3Objects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const deleteParams: DeleteObjectsCommandInput = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
      Quiet: false,
    },
  };

  try {
    const command = new DeleteObjectsCommand(deleteParams);
    const response = await s3Client.send(command);
    console.info("Deleted S3 objects:", response.Deleted);

    if (response.Errors && response.Errors.length > 0) {
      console.error("Errors deleting S3 objects:", response.Errors);
      throw new Error("Some S3 objects could not be deleted");
    }
  } catch (error) {
    console.error("Error deleting S3 objects:", error);
    throw error;
  }
}
