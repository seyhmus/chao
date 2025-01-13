import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { firebaseAuth } from "@/lib/firebaseAdmin";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

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

  try {
    const isAuthorized = await verifyHeader(req, userid);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error verifying header:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // if image, compress?

  const filename = `tmp/uploads/${userid}/${file.name}`;

  // Upload to R2
  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalname: file.name,
      },
    })
  );

  // If you're using Cloudflare custom domain
  const url = `https://${R2_PUBLIC_URL}/${filename}`;
  // Or if using the default R2 URL
  // const url = `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${filename}`;
  // const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${filename}`;

  return NextResponse.json({ url });
}
