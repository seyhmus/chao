// // 1. stable - Initial state. Also the state when a connection is established.
// // No offer or answer in progress
// // Ready to start new negotiation

// // 2. have-local-offer - After calling setLocalDescription(offer)
// // Local peer has created and set an offer
// // Waiting for remote peer's answer

// // 3. have-remote-offer - After calling setRemoteDescription(offer)
// // Received and set an offer from remote peer
// // Ready to create and send an answer

// // 4. have-local-pranswer - After calling setLocalDescription(pranswer)
// // Local peer has created and set a provisional answer
// // Rarely used in most implementations

// // 5. have-remote-pranswer - After calling setRemoteDescription(pranswer)
// // Received and set a provisional answer from remote peer
// // Rarely used in most implementations

// // 6. closed - After calling close()
// // Connection is closed
// // No further negotiations possible

import { useState, useEffect, useRef } from "react";

const useWebRTC = ({ onIceCandidate, onMessage, onOffer, onAnswer }) => {
  const [peerConnections, setPeerConnections] = useState({}); // Map of peer ID to RTCPeerConnection
  const [dataChannels, setDataChannels] = useState({}); // Map of peer ID to RTCDataChannel
  const pendingOffers = useRef(new Map());
  const incomingOffers = useRef(new Map());
  const earlyIceCandidates = useRef(new Map());
  const OFFER_TIMEOUT = 5000;

  // Initialize WebRTC peer connection for a specific peer
  const initPeerConnection = (peerId) => {
    console.log("initPeerConnection", peerId);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Create data channel
    const dataChannel = pc.createDataChannel("messageChannel");

    const handleMessage = (event) => {
      onMessage?.(peerId, event.data);
    };

    dataChannel.onmessage = handleMessage;

    dataChannel.onopen = () => {
      console.log("Data channel opened");
    };

    dataChannel.onclose = () => {
      console.log("Data channel closed");
    };

    // Handle data channel from remote peer
    pc.ondatachannel = (event) => {
      const receivedChannel = event.channel;
      receivedChannel.onmessage = handleMessage;
      receivedChannel.onopen = () => {
        console.log("Received Data channel opened");
      };
      receivedChannel.onclose = () => {
        console.log("Received Data channel closed");
      };
      setDataChannels((prev) => ({
        ...prev,
        [peerId]: receivedChannel,
      }));
    };

    setDataChannels((prev) => ({
      ...prev,
      [peerId]: dataChannel,
    }));

    pc.onicecandidate = (event) => {
      if (event.candidate) onIceCandidate?.(peerId, event.candidate);
    };

    setPeerConnections((prev) => ({
      ...prev,
      [peerId]: pc,
    }));

    return pc;
  };

  // Cleanup peer connection
  const cleanupPeerConnection = (peerId) => {
    if (peerConnections[peerId]) {
      if (dataChannels[peerId]) {
        dataChannels[peerId].close();
      }
      peerConnections[peerId].close();
      setPeerConnections((prev) => {
        const newConnections = { ...prev };
        delete newConnections[peerId];
        return newConnections;
      });
      setDataChannels((prev) => {
        const newChannels = { ...prev };
        delete newChannels[peerId];
        return newChannels;
      });
    }
  };

  const isOfferExpired = (timestamp) => {
    return timestamp + OFFER_TIMEOUT < Date.now();
  };

  // Create offer for specific peer
  const createOffer = async (peerId) => {
    console.log("createOffer", peerId);
    try {
      const pc = peerConnections[peerId] || initPeerConnection(peerId);

      // Check if connection is already established
      // connectionState === 'connected' confirms that:
      //   ICE negotiation is complete
      //   DTLS is established
      //   The connection is actually working
      // dataChannels[peerId]?.readyState === "open" confirms that:
      //   The data channel is ready for sending messages
      //   The SCTP transport is established
      if (
        pc.connectionState === "connected" &&
        dataChannels[peerId]?.readyState === "open"
      ) {
        console.log("Connection already established, skipping createOffer");
        return;
      }

      // Check if we have a pending offer for this peer
      if (pendingOffers.current.has(peerId)) {
        const { timestamp } = pendingOffers.current.get(peerId);
        if (isOfferExpired(timestamp)) {
          await cleanupPendingOffer(peerId);
        } else {
          // Offer still valid, wait for it to be processed
          return;
        }
      }

      const offer = await pc.createOffer();

      try {
        await pc.setLocalDescription(offer);
      } catch (err) {
        console.error("Error setting local description:", err);
        await cleanupPendingOffer(peerId);
        return;
      }

      // Store pending offer with timestamp
      pendingOffers.current.set(peerId, {
        offer,
        timestamp: Date.now(),
      });

      onOffer?.(peerId, offer);
      console.log("offer sent", peerId, offer);

      return offer;
    } catch (err) {
      console.error("Error creating offer:", err);
      await cleanupPendingOffer(peerId);
    }
  };

  const cleanupPendingOffer = async (peerId) => {
    pendingOffers.current.delete(peerId);

    const pc = peerConnections[peerId];
    if (pc && pc.signalingState === "have-local-offer")
      await pc.setLocalDescription({ type: "rollback" });

    // Process queued offer if available
    if (incomingOffers.current.has(peerId)) {
      const offer = incomingOffers.current.get(peerId);
      incomingOffers.current.delete(peerId);
      return await handleOffer(peerId, offer);
    }
  };

  // Handle offer from specific peer
  const handleOffer = async (peerId, offer) => {
    console.log("handleOffer", peerId, offer);
    try {
      // Validate offer
      if (!offer || !offer.type || !offer.sdp) {
        console.warn("Received invalid offer:", offer);
        return;
      }

      const pc = peerConnections[peerId] || initPeerConnection(peerId);

      // If we have a pending offer, handle collision
      if (pendingOffers.current.has(peerId)) {
        console.log("pending offers", pendingOffers.current);
        const { timestamp } = pendingOffers.current.get(peerId);
        if (isOfferExpired(timestamp)) {
          console.log("Local offer expired, cleaning up");
          incomingOffers.current.set(peerId, {
            offer,
            timestamp: Date.now(),
          });
          await cleanupPendingOffer(peerId);
          return;
        }
        // else {
        //   // Offer still valid, resolve collision - higher user ID wins
        //   if (myUserId > peerId) {
        //     console.log("Queuing incoming offer - we have higher ID");
        //     // Queue this offer for later processing
        //     incomingOffers.current.set(peerId, {
        //       offer,
        //       timestamp: Date.now(),
        //     });
        //     return; // Dont proces offer now
        //   } else {
        //     // Rollback out offer and accept the incoming one
        //     console.log("Rolling back our offer - we have lower ID");
        //     try {
        //       await pc.setLocalDescription({ type: "rollback" });
        //       await cleanupPendingOffer(peerId);
        //     } catch (err) {
        //       console.error("Error rolling back offer:", err);
        //     }
        //   }
        // }
      }

      if (pc.signalingState !== "stable") {
        console.log("Peer connection not in stable state:", pc.signalingState);
        // Qeue offer for later processing if we are not stable
        incomingOffers.current.set(peerId, {
          offer,
          timestamp: Date.now(),
        });

        // Setup a one-time listener for returning to stable state
        const onStable = () => {
          if (pc.signalingState === "stable") {
            pc.removeEventListener("signalingstatechange", onStable);
            // Process any queued offers
            const queuedOffer = incomingOffers.current.get(peerId);
            if (queuedOffer && !isOfferExpired(queuedOffer.timestamp)) {
              incomingOffers.current.delete(peerId);
              handleOffer(peerId, queuedOffer.offer);
            }
          }
        };

        pc.addEventListener("signalingstatechange", onStable);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      if (pc.signalingState !== "have-remote-offer") {
        console.log(
          "Cannot create answer - incorrect state:",
          pc.signalingState
        );
        return;
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      onAnswer?.(peerId, answer);
      return answer;
    } catch (err) {
      console.error("Error handling offer:", err);
      await cleanupPendingOffer(peerId);
    }
  };

  // Handle answer from specific peer
  const handleAnswer = async (peerId, answer) => {
    console.log("handleAnswer", peerId, answer);
    try {
      const pc = peerConnections[peerId];
      if (pc) {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          if (earlyIceCandidates.current.has(peerId)) {
            const candidates = earlyIceCandidates.current.get(peerId);
            earlyIceCandidates.current.delete(peerId);
            for (const candidate of candidates) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        }
        await cleanupPendingOffer(peerId); // Will process any queued offers
      }
    } catch (err) {
      console.error("Error handling answer:", err);
      await cleanupPendingOffer(peerId);
    }
  };

  // Handle ICE candidate from specific peer
  const handleIceCandidate = async (peerId, candidate) => {
    try {
      const pc = peerConnections[peerId];
      if (pc) {
        if (!pc.remoteDescription || !pc.remoteDescription.type) {
          if (!earlyIceCandidates.current.has(peerId)) {
            earlyIceCandidates.current.set(peerId, []);
          }
          earlyIceCandidates.current.get(peerId).push(candidate); // Store candidate until remote description is set
          return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error("Error handling ICE candidate:", err);
    }
  };

  // Send data through data channel
  const sendMessage = (peerId, data) => {
    if (dataChannels[peerId] && dataChannels[peerId].readyState === "open") {
      dataChannels[peerId].send(JSON.stringify(data));
    } else {
      throw new Error(
        "Data channel not open",
        peerConnections[peerId].connectionState,
        dataChannels[peerId].readyState
      ); // Let the component handle fallback
    }
  };

  // Periodic cleanup of expired offers and processing of queued offers
  useEffect(() => {
    const cleanup = setInterval(async () => {
      for (const [peerId, offer] of pendingOffers.current.entries())
        if (isOfferExpired(offer.timestamp)) await cleanupPendingOffer(peerId);

      // Also cleanup expired queued offers
      for (const [peerId, queuedOffer] of incomingOffers.current.entries())
        if (isOfferExpired(queuedOffer.timestamp))
          incomingOffers.current.delete(peerId);
    }, OFFER_TIMEOUT);

    // cleanup on unmount
    return () => {
      clearInterval(cleanup);
      pendingOffers.current.clear();
      incomingOffers.current.clear();
      Object.keys(peerConnections).forEach(cleanupPeerConnection);
    };
  }, []);

  return {
    createOffer,
    handleAnswer,
    handleOffer,
    handleIceCandidate,
    sendMessage,
  };
};

export default useWebRTC;
