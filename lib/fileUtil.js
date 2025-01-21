// Implemented for streaming chunk file transfer using Pusher
export const streamSlices = async (file, processChunk, metadata = {}) => {
  const chunkSize = metadata.chunkSize || 1024 * 8;
  // Compress the file
  const arrayBuffer = await new Response(
    file.stream().pipeThrough(new CompressionStream("gzip"))
  ).arrayBuffer();

  // Encode in base64
  const base64String = arrayBufferToBase64(arrayBuffer);

  const hash = await hashKey(file);
  const totalChunks = Math.ceil(base64String.length / chunkSize);
  metadata = {
    ...metadata,
    timestamp: Date.now(),
    fileName: file.name,
    fileType: file.type,
    hash,
    totalChunks,
  };

  // Slice into chunks of chunkSize and process them
  for (let index = 0; index < totalChunks; index++) {
    const chunk = base64String.slice(
      index * chunkSize,
      (index + 1) * chunkSize
    );
    processChunk({ chunk, index, ...metadata });
  }

  return { hash, totalChunks, ...metadata };
};

// Implemented for sending chunk file transfer using Pusher
export const slice = async (file, chunkSize = 1024 * 8) => {
  const chunks = [];

  // Compress the file
  const arrayBuffer = await new Response(
    file.stream().pipeThrough(new CompressionStream("gzip"))
  ).arrayBuffer();

  // Encode in base64
  const base64String = arrayBufferToBase64(arrayBuffer);

  // Slice into chunks of chunkSize
  let start = 0;
  while (start < base64String.length) {
    const chunk = base64String.slice(start, start + chunkSize);
    chunks.push(chunk);
    start += chunkSize;
  }

  // return chunks with the hash of the input file which will be used as an identifier
  // and maybe for integrity check later
  const hash = await hashKey(file);
  return { chunks, hash };
};

export function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64String) {
  const binary = atob(base64String);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes;
}

// Implemented for receiving chunk file transfer using Pusher
export const combine = async (
  chunks,
  mimeType = "application/octet-stream"
) => {
  try {
    // Combine all base64 string chunks into one full base64 string
    const base64String = chunks.join("");

    // Decode Base64 string into a Blob
    const binary = atob(base64String);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const compressedBlob = new Blob([bytes], { type: mimeType });

    // Convert the Blob to ArrayBuffer
    const arrayBuffer = await compressedBlob.arrayBuffer();

    // Decompress the ArrayBuffer using a ReadableStream and DecompressionStream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(arrayBuffer));
        controller.close();
      },
    });

    // Return the decompressed file Blob
    return await new Response(
      stream.pipeThrough(new DecompressionStream("gzip"))
    ).blob();
  } catch (error) {
    console.error("Error during reconstruction and decompression:", error);
    throw error;
  }
};

export const compress = async (blob) => {
  return new Response(
    blob.stream().pipeThrough(new CompressionStream("gzip"))
  ).blob();
};

export const decompress = async (blob) => {
  return new Response(
    blob.stream().pipeThrough(new DecompressionStream("gzip"))
  ).blob();
};

export const hashKey = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const download = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const hash = await hashKey(blob);

    return { blob, hash };
  } catch (error) {
    console.error("Download failed:", error);
    return null;
  }
};
