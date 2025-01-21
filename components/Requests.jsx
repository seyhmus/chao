import { useRouter } from "next/navigation";
import useMessagingContext from "@/context/MessageContext";

export default function RequestNotifications({}) {
  const router = useRouter();

  const { requests, setRequests, messageService, acceptFriendship } =
    useMessagingContext();

  const handleAccept = async (request) => {
    try {
      switch (request.type.toLowerCase()) {
        case "game":
          const gameId = request.senderId + "-" + request.receiverId;
          localStorage.setItem(`${gameId}:id`, 0);
          await messageService.postGameAccept(gameId, request.senderId);
          router.push(`/lobby/${gameId}`);
          break;
        case "friend":
          await acceptFriendship(request);
          router.push(`/peer/${request.senderId}`);
          break;
        default:
          console.error("Unknown request type");
          return;
      }

      // Remove this request
      setRequests((prev) =>
        prev.filter((req) => req.timestamp !== request.timestamp)
      );
    } catch (error) {
      console.error(`Error accepting ${request.type}:`, error);
    }
  };

  if (requests.length === 0) {
    return <></>;
  }

  return (
    <div className="fixed top-24 right-4 z-50">
      {requests.map((request, index) => (
        <div
          key={index}
          className="bg-white text-black p-4 rounded-lg shadow-lg mb-2 animate-bounce"
        >
          <p className="font-bold">
            {request.type} Request from {request.senderName}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={() => handleAccept(request)}
            >
              Accept
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={() => {
                // Remove this request
                setRequests((prev) => prev.filter((_, i) => i !== index));
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
