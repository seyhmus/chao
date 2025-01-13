import { NextResponse } from "next/server";
import { firebaseAuth } from "@/lib/firebaseAdmin";

export async function GET(request) {
  // Extract Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization token" },
      { status: 401 }
    );
  }

  // Extract ID token and verify Firebase Authentication
  // We are not verifying the user id against the token
  const idToken = authHeader.split("Bearer ")[1];
  try {
    await firebaseAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return NextResponse.json(
      { error: "Unauthorized: Invalid or expired token" },
      { status: 401 }
    );
  }

  try {
    let user;

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const uid = searchParams.get("uid");

    // Validate email
    if (email && !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (email) user = await firebaseAuth.getUserByEmail(email);

    if (uid) user = await firebaseAuth.getUser(uid);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ...user });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
