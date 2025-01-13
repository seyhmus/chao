import { getPusherServer } from "@/lib/pusherServer";
import { firebaseAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

// Allowed event types to ensure controlled triggering
const ALLOWED_EVENT_TYPES = [
  "game-move",
  "request",
  "accept",
  "file-chunk",
  "signal",
  "message",
];

export async function POST(request) {
  // Extract Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization token" },
      { status: 401 }
    );
  }

  // Extract ID token and verify Firebase Authentication
  const idToken = authHeader.split("Bearer ")[1];
  let userId;
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    userId = decodedToken.uid;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return NextResponse.json(
      { error: "Unauthorized: Invalid or expired token" },
      { status: 401 }
    );
  }

  // Parse and validate request body
  const { eventType, senderId, receiverId, gameId, ...payload } =
    await request.json();

  if (!eventType || !senderId) {
    throw new Error("Missing required parameters");
  }

  if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
    throw new Error("Invalid event type");
  }

  // Authorization check: Ensure `from` matches the authenticated user
  if (senderId !== userId) {
    return NextResponse.json(
      { error: "Unauthorized: You can not trigger events for others" },
      { status: 403 }
    );
  }

  // Determine the appropriate channel
  let channel;
  if (receiverId) {
    channel = `private-user-${receiverId}`; // Private message channel
  } else if (gameId) {
    channel = `presence-game-${gameId}`; // Game presence channel
  } else {
    channel = "presence-lobby"; // General lobby channel
  }

  // Trigger the event with the payload
  try {
    await getPusherServer().trigger(channel, eventType, {
      senderId,
      receiverId,
      gameId,
      ...payload,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error triggering Pusher event:", error);
    return NextResponse.json(
      { error: "Failed to trigger event" },
      { status: 500 }
    );
  }
}
