"use client";

import { compressImage } from "@/lib/imageUtil";
import { compress, slice } from "@/lib/fileUtil";
import { nanoid } from "nanoid";
import api from "@/lib/api";

export class MessageService {
  constructor(metadata) {
    this.metadata = metadata;
  }

  async postEvent(event) {
    return api.post("/api/pusher/event", {
      ...event,
      ...this.metadata,
      timestamp: Date.now(),
      method: "pusher",
    });
  }

  async postSignal(signal) {
    return this.postEvent({
      ...signal,
      eventType: "signal",
    });
  }

  async postImage(file, addPreview, clearPreview) {
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Invalid file type. Only images are allowed.");
    }

    try {
      const blob = await compressImage(file);
      const previewUrl = URL.createObjectURL(blob);
      const previewId = nanoid();
      addPreview?.(previewId, previewUrl);

      const { url } = await this.uploadFile(blob, file.name);

      await this.postEvent({
        url,
        eventType: "message",
      });

      clearPreview?.(previewId, previewUrl);
      return url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  postFileToPusher = async (file) => {
    const { chunks, hash } = await slice(file);
    const metadata = {
      hash,
      totalChunks: chunks.length,
      method: "pusher",
    };

    for (let index = 0; index < chunks.length; index++) {
      await this.postEvent({
        ...metadata,
        chunk: chunks[index],
        index,
        eventType: "file-chunk",
      });
    }

    return metadata;
  };

  postFriendRequest = async (to, publicKey) => {
    return this.postEvent({
      receiverId: to,
      eventType: "request",
      type: "Friend",
      method: "pusher",
      publicKey,
    });
  };

  postFriendAccept = async (peerId, publicKey) => {
    return this.postEvent({
      receiverId: peerId,
      eventType: "accept",
      type: "Friend",
      method: "pusher",
      publicKey,
    });
  };

  postGameRequest = async (to) => {
    return this.postEvent({
      receiverId: to,
      eventType: "request",
      type: "Game",
      method: "pusher",
    });
  };

  postGameAccept = async (gameId, gameRequester) => {
    return this.postEvent({
      receiverId: gameRequester,
      gameId,
      eventType: "accept",
      type: "Game",
      method: "pusher",
    });
  };

  postGameMove = async (gameId, gameState) => {
    return this.postEvent({
      gameId,
      gameState,
      eventType: "game-move",
      method: "pusher",
    });
  };

  uploadFile = async (blob, fileName) => {
    fileName = fileName || blob.name;

    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("userid", this.metadata.senderId);

    const response = await api.postForm("/api/r2/upload", formData);
    return { url: response.url };
  };

  async multiPartUpload(blob, fileName) {
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("userid", this.metadata.senderId);

    const response = await api.postForm("/api/r2/multipart", formData);
    return response.url;
  }
}
