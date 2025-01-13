import PusherClient from "pusher-js";

let pusherClient = null;

export const getPusherClient = (params, token) => {
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: "/api/pusher/auth",
      auth: {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  return pusherClient;
};

export const disconnectPusher = () => {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
};
