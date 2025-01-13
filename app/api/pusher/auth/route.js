import { NextResponse } from "next/server";

import { getPusherServer } from "@/lib/pusherServer";
import { firebaseAuth } from "@/lib/firebaseAdmin";

export async function POST(request) {
  const pusherServer = getPusherServer();

  const data = await request.text();
  const params = new URLSearchParams(data);

  const socket_id = params.get("socket_id");
  const channel_name = params.get("channel_name");
  const userId = params.get("userId");
  const displayName = params.get("displayName");
  const userEmail = params.get("userEmail");
  const userPhotoURL = params.get("userPhotoURL");

  // Extract Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return NextResponse.json(
      { error: "Missing or invalid authorization token" },
      { status: 401 }
    );

  // Extract ID token and verify Firebase Authentication
  const idToken = authHeader.split("Bearer ")[1];

  // Verify the Firebase ID token
  const decodedToken = await firebaseAuth.verifyIdToken(idToken);
  if (!decodedToken || !decodedToken.uid) {
    return NextResponse.json(
      { error: "Missing or invalid authorization token" },
      { status: 401 }
    );
  }

  // Check if the user ID in the token matches the user ID in the request
  if (userId !== decodedToken.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const presenceData = {
    user_id: userId,
    user_info: {
      userId: userId,
      displayName: displayName,
      email: userEmail,
      photoURL: userPhotoURL,
    },
  };

  if (!isUserAuthorizedForChannel(channel_name, userId)) {
    return NextResponse.json(
      { error: "Unauthorized to access this channel" },
      { status: 403 }
    );
  }

  const auth = pusherServer.authorizeChannel(
    socket_id,
    channel_name,
    presenceData
  );

  return new Response(JSON.stringify(auth));
}

function isUserAuthorizedForChannel(channel_name, userId) {
  if (channel_name === "presence-lobby") return true;

  if (channel_name.startsWith("private-user-")) {
    const channelUserId = channel_name.split("-")[2];
    return channelUserId === userId;
  }

  if (channel_name.startsWith("presence-game-")) {
    const gameId = channel_name.split("presence-game-")[1];
    return gameId.split("-").includes(userId);
  }

  return false; // Deny unauthorized channels
}
