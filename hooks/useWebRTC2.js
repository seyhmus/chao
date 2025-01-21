import { useState, useEffect, useRef } from "react";

const useWebRTC = ({
  onIceCandidate,
  onMessage,
  onOffer,
  onAnswer,
  onStateChange,
}) => {
  const peerConnections = useRef({});
  const dataChannels = useRef({});
  const pendingOffers = useRef(new Map());
  const incomingOffers = useRef(new Map());
  const earlyIceCandidates = useRef(new Map());
  const stateChangeTimeouts = useRef(new Map());
  const reconnectAttempts = useRef(new Map());

  const OFFER_TIMEOUT = 5000;
  const MAX_RECONNECT_ATTEMPTS = 3;
  const STATE_CHANGE_TIMEOUT = 10000;

  const logError = (context, error, peerId = null) => {
    console.error(
      `[WebRTC Error${peerId ? ` - Peer ${peerId}` : ""}] ${context}:`,
      error
    );
    onStateChange?.({ type: "error", context, error, peerId });
  };

  const cleanupPendingOffer = async (peerId) => {
    console.log(`[WebRTC] Cleaning up pending offer for peer ${peerId}`);
    pendingOffers.current.delete(peerId);

    const pc = peerConnections.current[peerId];
    if (pc && pc.signalingState === "have-local-offer") {
      try {
        console.log(
          `[WebRTC] Rolling back local description for peer ${peerId}`
        );
        await pc.setLocalDescription({ type: "rollback" });
      } catch (err) {
        logError("Failed to rollback local description", err, peerId);
      }
    }

    // Process queued offer if available
    if (incomingOffers.current.has(peerId)) {
      console.log(`[WebRTC] Processing queued offer for peer ${peerId}`);
      const { offer } = incomingOffers.current.get(peerId);
      incomingOffers.current.delete(peerId);
      return await handleOffer(peerId, offer);
    }
  };

  const initPeerConnection = (peerId) => {
    console.log(`[WebRTC] Initializing peer connection for peer ${peerId}`);
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
        iceCandidatePoolSize: 10,
      });

      pc.onconnectionstatechange = () => {
        console.log(
          `[WebRTC] Connection state changed for peer ${peerId}: ${pc.connectionState}`
        );
        clearTimeout(stateChangeTimeouts.current.get(peerId));

        const timeout = setTimeout(() => {
          if (
            pc.connectionState === "connecting" ||
            pc.connectionState === "checking"
          ) {
            console.log(`[WebRTC] Connection timeout for peer ${peerId}`);
            handleConnectionTimeout(peerId);
          }
        }, STATE_CHANGE_TIMEOUT);

        stateChangeTimeouts.current.set(peerId, timeout);

        onStateChange?.({
          type: "connectionState",
          state: pc.connectionState,
          peerId,
        });
      };

      pc.oniceconnectionstatechange = () => {
        console.log(
          `[WebRTC] ICE connection state changed for peer ${peerId}: ${pc.iceConnectionState}`
        );
        if (pc.iceConnectionState === "failed") {
          handleIceFailure(peerId);
        }
        onStateChange?.({
          type: "iceConnectionState",
          state: pc.iceConnectionState,
          peerId,
        });
      };

      const dataChannel = pc.createDataChannel("messageChannel", {
        ordered: true,
        maxRetransmits: 3,
      });

      setupDataChannel(dataChannel, peerId);

      pc.ondatachannel = (event) => {
        console.log(`[WebRTC] Data channel received from peer ${peerId}`);
        setupDataChannel(event.channel, peerId);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`[WebRTC] ICE candidate generated for peer ${peerId}`);
          onIceCandidate?.(peerId, event.candidate);
        }
      };

      peerConnections.current[peerId] = pc;

      return pc;
    } catch (err) {
      logError("Failed to initialize peer connection", err, peerId);
      throw err;
    }
  };

  const setupDataChannel = (channel, peerId) => {
    console.log(`[WebRTC] Setting up data channel for peer ${peerId}`);
    const handleMessage = (event) => {
      try {
        console.log(`[WebRTC] Message received from peer ${peerId}`);
        onMessage?.(peerId, event.data);
      } catch (err) {
        logError("Failed to parse message", err, peerId);
      }
    };

    channel.onmessage = handleMessage;

    channel.onopen = () => {
      console.log(`[WebRTC] Data channel opened for peer ${peerId}`);
      reconnectAttempts.current.delete(peerId);
      onStateChange?.({
        type: "dataChannel",
        state: "open",
        peerId,
      });
    };

    channel.onclose = () => {
      console.log(`[WebRTC] Data channel closed for peer ${peerId}`);
      onStateChange?.({
        type: "dataChannel",
        state: "closed",
        peerId,
      });
    };

    channel.onerror = (error) => {
      logError("Data channel error", error, peerId);
    };

    dataChannels.current[peerId] = channel;
  };

  const handleConnectionTimeout = async (peerId) => {
    console.log(`[WebRTC] Handling connection timeout for peer ${peerId}`);
    const attempts = reconnectAttempts.current.get(peerId) || 0;

    if (attempts < MAX_RECONNECT_ATTEMPTS) {
      console.log(
        `[WebRTC] Attempting reconnection for peer ${peerId} (attempt ${
          attempts + 1
        }/${MAX_RECONNECT_ATTEMPTS})`
      );
      reconnectAttempts.current.set(peerId, attempts + 1);
      await cleanupPeerConnection(peerId);
      await createOffer(peerId);
    } else {
      logError(
        "Max reconnection attempts reached",
        new Error("Connection timeout"),
        peerId
      );
      cleanupPeerConnection(peerId);
    }
  };

  const handleIceFailure = async (peerId) => {
    console.log(`[WebRTC] Handling ICE failure for peer ${peerId}`);
    const pc = peerConnections.current[peerId];
    if (!pc) return;

    try {
      console.log(`[WebRTC] Attempting ICE restart for peer ${peerId}`);
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      onOffer?.(peerId, offer);
    } catch (err) {
      logError("ICE restart failed", err, peerId);
      handleConnectionTimeout(peerId);
    }
  };

  const cleanupPeerConnection = async (peerId) => {
    console.log(`[WebRTC] Cleaning up peer connection for peer ${peerId}`);
    clearTimeout(stateChangeTimeouts.current.get(peerId));
    stateChangeTimeouts.current.delete(peerId);

    if (peerConnections.current[peerId]) {
      if (dataChannels.current[peerId]) {
        console.log(`[WebRTC] Closing data channel for peer ${peerId}`);
        dataChannels.current[peerId].close();
      }
      console.log(`[WebRTC] Closing peer connection for peer ${peerId}`);
      peerConnections.current[peerId].close();

      delete peerConnections.current[peerId];
      delete dataChannels.current[peerId];
    }

    pendingOffers.current.delete(peerId);
    incomingOffers.current.delete(peerId);
    earlyIceCandidates.current.delete(peerId);
  };

  const createOffer = async (peerId) => {
    console.log(`[WebRTC] Creating offer for peer ${peerId}`);
    try {
      const pc = peerConnections.current[peerId] || initPeerConnection(peerId);

      if (
        pc.connectionState === "connected" &&
        dataChannels.current[peerId]?.readyState === "open"
      ) {
        console.log(
          `[WebRTC] Connection already established for peer ${peerId}, skipping offer creation`
        );
        return;
      }

      if (pendingOffers.current.has(peerId)) {
        const { timestamp } = pendingOffers.current.get(peerId);
        if (Date.now() - timestamp > OFFER_TIMEOUT) {
          console.log(
            `[WebRTC] Cleaning up expired pending offer for peer ${peerId}`
          );
          await cleanupPendingOffer(peerId);
        } else {
          console.log(
            `[WebRTC] Pending offer exists for peer ${peerId}, skipping offer creation`
          );
          return;
        }
      }

      console.log(`[WebRTC] Creating WebRTC offer for peer ${peerId}`);
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      console.log(`[WebRTC] Setting local description for peer ${peerId}`);
      await pc.setLocalDescription(offer);

      pendingOffers.current.set(peerId, {
        offer,
        timestamp: Date.now(),
      });

      console.log(`[WebRTC] Sending offer to peer ${peerId}`);
      onOffer?.(peerId, offer);
      return offer;
    } catch (err) {
      logError("Failed to create offer", err, peerId);
      await cleanupPendingOffer(peerId);
      throw err;
    }
  };

  const handleOffer = async (peerId, offer) => {
    console.log(`[WebRTC] Handling offer from peer ${peerId}`);
    try {
      if (!offer?.type || !offer?.sdp) {
        throw new Error("Invalid offer format");
      }

      const pc = peerConnections.current[peerId] || initPeerConnection(peerId);

      if (pc.signalingState !== "stable") {
        console.log(
          `[WebRTC] Connection not stable for peer ${peerId}, queueing offer`
        );
        incomingOffers.current.set(peerId, {
          offer,
          timestamp: Date.now(),
        });

        return new Promise((resolve) => {
          const checkState = () => {
            if (pc.signalingState === "stable") {
              console.log(
                `[WebRTC] Connection now stable for peer ${peerId}, handling queued offer`
              );
              resolve(handleOffer(peerId, offer));
            } else {
              setTimeout(checkState, 100);
            }
          };
          setTimeout(checkState, 100);
        });
      }

      console.log(`[WebRTC] Setting remote description for peer ${peerId}`);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      console.log(`[WebRTC] Creating answer for peer ${peerId}`);
      const answer = await pc.createAnswer();

      console.log(`[WebRTC] Setting local description for peer ${peerId}`);
      await pc.setLocalDescription(answer);

      console.log(`[WebRTC] Sending answer to peer ${peerId}`);
      onAnswer?.(peerId, answer);

      return answer;
    } catch (err) {
      logError("Failed to handle offer", err, peerId);
      await cleanupPendingOffer(peerId);
      throw err;
    }
  };

  const handleAnswer = async (peerId, answer) => {
    console.log(`[WebRTC] Handling answer from peer ${peerId}`);
    try {
      const pc = peerConnections.current[peerId];
      if (!pc) throw new Error("No peer connection exists");

      if (pc.signalingState === "have-local-offer") {
        console.log(`[WebRTC] Setting remote description for peer ${peerId}`);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        if (earlyIceCandidates.current.has(peerId)) {
          console.log(
            `[WebRTC] Adding stored ICE candidates for peer ${peerId}`
          );
          const candidates = earlyIceCandidates.current.get(peerId);
          earlyIceCandidates.current.delete(peerId);

          for (const candidate of candidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              logError("Failed to add stored ICE candidate", err, peerId);
            }
          }
        }
      }

      await cleanupPendingOffer(peerId);
    } catch (err) {
      logError("Failed to handle answer", err, peerId);
      await cleanupPendingOffer(peerId);
      throw err;
    }
  };

  const handleIceCandidate = async (peerId, candidate) => {
    console.log(`[WebRTC] Handling ICE candidate for peer ${peerId}`);
    try {
      const pc = peerConnections.current[peerId];
      if (!pc) throw new Error("No peer connection exists");

      if (!pc.remoteDescription?.type) {
        console.log(
          `[WebRTC] Remote description not set for peer ${peerId}, storing ICE candidate`
        );
        if (!earlyIceCandidates.current.has(peerId)) {
          earlyIceCandidates.current.set(peerId, []);
        }
        earlyIceCandidates.current.get(peerId).push(candidate);
        return;
      }

      console.log(`[WebRTC] Adding ICE candidate for peer ${peerId}`);
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      logError("Failed to handle ICE candidate", err, peerId);
    }
  };

  const sendMessage = (peerId, data) => {
    console.log(`[WebRTC] Sending message to peer ${peerId}`);
    const channel = dataChannels.current[peerId];
    const pc = peerConnections.current[peerId];

    if (!channel || !pc) throw new Error("No connection exists");

    if (channel.readyState !== "open")
      throw new Error(
        `Data channel not open (state: ${channel.readyState}, connection state: ${pc.connectionState})`
      );

    if (pc.connectionState !== "connected")
      throw new Error(
        `Connection not established (state: ${pc.connectionState})`
      );

    try {
      channel.send(JSON.stringify(data));
      console.log(`[WebRTC] Message sent to peer ${peerId}`);
    } catch (err) {
      logError("Failed to send message", err, peerId);
      throw err;
    }
  };

  useEffect(() => {
    console.log("[WebRTC] Setting up cleanup interval");
    const cleanup = setInterval(() => {
      const now = Date.now();

      // Cleanup expired offers
      for (const [peerId, { timestamp }] of pendingOffers.current.entries()) {
        if (now - timestamp > OFFER_TIMEOUT) {
          console.log(
            `[WebRTC] Cleaning up expired pending offer for peer ${peerId}`
          );
          cleanupPendingOffer(peerId);
        }
      }

      // Cleanup expired queued offers
      for (const [peerId, { timestamp }] of incomingOffers.current.entries()) {
        if (now - timestamp > OFFER_TIMEOUT) {
          console.log(
            `[WebRTC] Cleaning up expired queued offer for peer ${peerId}`
          );
          incomingOffers.current.delete(peerId);
        }
      }

      // Check for stale connections
      for (const [peerId, pc] of Object.entries(peerConnections.current)) {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          console.log(`[WebRTC] Detected stale connection for peer ${peerId}`);
          handleConnectionTimeout(peerId);
        }
      }
    }, OFFER_TIMEOUT);

    return () => {
      console.log("[WebRTC] Cleaning up WebRTC connections");
      clearInterval(cleanup);
      for (const peerId of Object.keys(peerConnections.current)) {
        cleanupPeerConnection(peerId);
      }
      stateChangeTimeouts.current.forEach(clearTimeout);
      stateChangeTimeouts.current.clear();
    };
  }, []);

  return {
    createOffer,
    handleAnswer,
    handleOffer,
    handleIceCandidate,
    sendMessage,
    getConnectionState: (peerId) =>
      peerConnections.current[peerId]?.connectionState,
    getDataChannelState: (peerId) => dataChannels.current[peerId]?.readyState,
  };
};

export default useWebRTC;
