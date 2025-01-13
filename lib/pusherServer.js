import PusherServer from "pusher";

let pusherServerInstance = null;

export const getPusherServer = () => {
  if (!pusherServerInstance) {
    console.log("Initializing Pusher server instance...");
    pusherServerInstance = new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
      secret: process.env.PUSHER_APP_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusherServerInstance;
};
