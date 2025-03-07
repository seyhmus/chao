//  Utility functions for cryptography

export const generateKeyPair = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );
};

export const exportKey = async (key) => {
  const exported = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(exported);
};

export const importKey = async (keyData, type) => {
  const keyObj = JSON.parse(keyData);
  const usages =
    type === "private"
      ? ["deriveKey", "deriveBits"]
      : type === "public"
      ? []
      : ["encrypt", "decrypt"];

  return await window.crypto.subtle.importKey(
    "jwk",
    keyObj,
    type === "secret"
      ? { name: "AES-GCM" }
      : { name: "ECDH", namedCurve: "P-256" },
    true,
    usages
  );
};

export const deriveSharedSecret = async (privateKey, publicKey) => {
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    256
  );

  return await window.crypto.subtle.importKey(
    "raw",
    derivedBits,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
};

export const encrypt = async (message, key) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
};

export const decrypt = async (encrypted, key) => {
  const combined = new Uint8Array(
    atob(encrypted)
      .split("")
      .map((char) => char.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
};

export const encryptFile = async (file, key) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const fileBuffer = await file.arrayBuffer();

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    fileBuffer
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return combined; // returns array buffer
};

export const decryptFile = async (encryptedBlob, key) => {
  const combined = new Uint8Array(await encryptedBlob.arrayBuffer());

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  return new Blob([decrypted]);
};
