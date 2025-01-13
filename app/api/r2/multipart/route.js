import { NextResponse } from "next/server";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const verifyHeader = async (request, userId) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  // Extract ID token and verify Firebase Authentication
  const idToken = authHeader.split("Bearer ")[1];

  const decodedToken = await firebaseAuth.verifyIdToken(idToken);
  if (userId !== decodedToken.uid) return false;

  return true;
};

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");
  const userid = formData.get("userid");
  const filename = `tmp/uploads/${userid}/${file.name}`;

  try {
    const isAuthorized = await verifyHeader(req, userid);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error verifying header:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Initialize multipart upload
    const createMultipartUpload = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: filename,
        ContentType: file.type,
        Metadata: {
          originalname: file.name,
        },
      })
    );

    const uploadId = createMultipartUpload.UploadId;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const parts = [];

    // Split file into chunks and upload
    for (let i = 0; i < fileBuffer.length; i += CHUNK_SIZE) {
      const chunk = fileBuffer.subarray(i, i + CHUNK_SIZE);
      const partNumber = Math.floor(i / CHUNK_SIZE) + 1;

      const uploadPartResult = await s3Client.send(
        new UploadPartCommand({
          Bucket: R2_BUCKET,
          Key: filename,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: chunk,
        })
      );

      parts.push({
        PartNumber: partNumber,
        ETag: uploadPartResult.ETag,
      });
    }

    // Complete multipart upload
    await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: filename,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      })
    );

    const url = `https://${R2_PUBLIC_URL}/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);

    // Abort multipart upload if it exists
    if (uploadId) {
      try {
        await s3Client.send(
          new AbortMultipartUploadCommand({
            Bucket: R2_BUCKET,
            Key: filename,
            UploadId: uploadId,
          })
        );
      } catch (abortError) {
        console.error("Error aborting multipart upload:", abortError);
      }
    }

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
