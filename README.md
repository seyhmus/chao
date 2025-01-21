# Secure Chat Application with Mancala Game

This project is a secure chat application that includes end-to-end encryption and a multiplayer Mancala game feature.

The application provides a robust platform for secure communication between users, with additional entertainment through the integrated Mancala game. It leverages modern web technologies and cryptographic methods to ensure user privacy and data security.

## Application Flow

The application's data flow revolves around secure messaging and game state management:

1. User Authentication: Users authenticate using Firebase Authentication.
2. Key Exchange: Upon adding a friend, users exchange public keys for end-to-end encryption.
3. Message Encryption: Messages are encrypted using the shared secret derived from the exchanged keys.
4. Message Transmission: Encrypted messages are sent via Pusher real-time channels.
5. Message Reception: Received messages are decrypted using the shared secret.
6. Game State: Mancala game moves are transmitted through Pusher channels and updated in real-time.

```
[User A] <---> [Firebase Auth] <---> [User B]
    |                                   |
    v                                   v
[Encryption]                       [Encryption]
    |                                   |
    v                                   v
[Pusher Channels] <----- TLS ----> [Pusher Channels]
    |                                   |
    v                                   v
[Decryption]                       [Decryption]
    |                                   |
    v                                   v
[UI Update]                         [UI Update]
```

### Lobby

The Lobby is a central feature of the application, serving as a public space where users can find and interact with each other. Unlike the peer-to-peer conversations, messages and images sent in the Lobby are not end-to-end encrypted. However, they are still secure as all communication is protected by TLS (Transport Layer Security).

Key features of the Lobby:

1. Public Chat: Users can send and receive messages visible to all users in the Lobby.
2. User Discovery: The Lobby allows users to find and connect with other users of the application.
3. Friend Requests: Users can send friend requests directly by responding to messages in the Lobby.
4. Game Invitations: Users can invite others to play Mancala by sending game requests through the Lobby.
5. Real-time Updates: The Lobby uses Pusher for real-time message delivery and updates.
6. Presence Channel: The Lobby utilizes Pusher's presence channel, which provides real-time information about user presence and is used to determine online status.
7. Private Channels: For direct communication, each user is authorized to listen only to their own Pusher private channels. However, any friend can send messages to these private channels, enabling secure peer-to-peer communication.

The Lobby is implemented using the ChatPanel component, which provides a user-friendly interface for sending messages, images, and handling various user interactions. While the Lobby doesn't provide the same level of privacy as the encrypted peer-to-peer conversations, it serves as an essential hub for user interaction and connection initiation within the application.

The combination of presence and private channels allows for a dynamic and responsive user experience, with real-time updates on user status and secure direct messaging capabilities.

### Sending Friend Requests

There are two methods to send friend requests in the Secure Chat Application:

1. From the Lobby:

   - Users can send friend requests directly by responding to messages in the Lobby.
   - This method allows for discovering new users through public interactions.

2. From the Main Page:
   - Users can send friend requests by entering the email address of the person they want to add.
   - This method is useful when you already know the email address of the person you want to connect with.

Important notes about friend requests:

- Friend requests are not stored or queued on the server.
- Pusher is used for signaling purposes, ensuring real-time delivery of friend request notifications.
- If the recipient is offline when a friend request is sent, they will **not** receive the request when they come back online.
- Users should be online simultaneously for the friend request process to complete successfully.

## Encryption and Key Exchange

The Secure Chat Application implements robust security measures to ensure the privacy and integrity of user communications:

1. Encryption Methods:

   - End-to-end encryption using Elliptic Curve Diffie-Hellman (ECDH) for key exchange
   - AES-GCM (Advanced Encryption Standard in Galois/Counter Mode) for message and file encryption

2. Key Exchange Process:

   - When a user sends a friend request, a new ECDH key pair is generated
   - The public key is sent along with the friend request
   - Upon acceptance, the recipient generates their own key pair and sends their public key
   - Both users derive a shared secret using their private key and the other's public key

3. Shared Secret Derivation:

   - The shared secret is derived using the ECDH algorithm
   - This shared secret is used as the encryption key for all future communications between the two users

4. Message Encryption:

   - Before transmission, each message is encrypted using the shared secret
   - Pusher is used for data transmission - which is further secured using TLS (Transport Layer Security) for all data in transit

5. File Handling:

   - Files are compressed (if applicable) and encrypted on the client-side before upload
   - Encrypted files are uploaded to Cloudflare R2 storage
   - The file's location (URL) is sent as a (unencrypted) message to the recipient

6. File Storage and Deletion:

   - Files are stored in the Cloudflare R2 storage
   - R2 can be configured to automatically delete files after a set period, enhancing privacy and managing storage

7. Message and File Reception:

   - Received encrypted messages are decrypted using the shared secret
   - For files, the recipient downloads the encrypted file from R2 storage
   - The file is then decrypted and decompressed (if necessary) on the client-side

8. Local Storage:
   - Conversations and encryption keys are stored locally using IndexedDB (via Dexie.js)
   - This allows for offline access and reduces the need for server-side storage of sensitive information

By implementing these security measures, the application ensures that messages and files can only be read by the intended recipients, providing a high level of privacy and security for user communications.

## WebRTC Integration

The Secure Chat Application leverages WebRTC (Web Real-Time Communication) technology to enable peer-to-peer communication between users. This integration enhances the application's performance and security by allowing direct communication between clients without the need for server intermediation for message exchange.

Key aspects of the WebRTC integration:

1. Purpose:

   - Enables real-time, peer-to-peer data communication
   - Reduces server load by offloading direct communication to clients
   - Enhances privacy by establishing direct, encrypted connections between users

2. Implementation:

   - The application uses a custom `useWebRTC` hook (located in `hooks/useWebRTC.js`)
   - This hook manages WebRTC peer connections and data channels for each peer
   - It handles the creation of offers, processing of answers, and management of ICE candidates

3. Signaling:

   - While WebRTC enables peer-to-peer communication, initial connection setup requires a signaling mechanism
   - The application uses Pusher for signaling, exchanging necessary information to establish WebRTC connections
   - This includes exchanging offers, answers, and ICE candidates between peers

4. Integration with Messaging:

   - The WebRTC functionality is integrated with the existing messaging system
   - When a WebRTC connection is established, messages are sent directly through the WebRTC data channel
   - If WebRTC is not available or fails, the application falls back to using Pusher for message delivery

5. Benefits:
   - Lower latency for real-time communication
   - Reduced server bandwidth usage for message exchange
   - Enhanced privacy through direct, encrypted peer-to-peer connections
   - Improved reliability with automatic fallback to server-based communication if peer-to-peer connection fails

By integrating WebRTC, the Secure Chat Application provides a more efficient, secure, and responsive user experience for real-time communication between users.

## Repository Structure

```
.
├── __tests__/
├── app/
│   ├── api/
│   ├── lobby/
│   ├── peer/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── mancala/
│   └── ...
├── contexts/
├── lib/
├── services/
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.js
├── tsconfig.json
└── vitest.config.js
```

Key Files:

- `app/layout.js`: Main layout component for the Next.js application
- `app/page.js`: Main page component
- `contexts/MessageContext.js`: React context for managing messaging functionality
- `components/mancala/MangalaGame.jsx`: Main component for the Mancala game
- `lib/crypto.js`: Utility functions for cryptographic operations
- `services/message.js`: Service for handling various types of messages and events
- `vitest.config.js`: Configuration for Vitest testing framework

## Usage Instructions

### Installation

Prerequisites:

- Node.js (v13 or later)
- npm (v6 or later)

Steps:

1. Clone the repository
2. Navigate to the project directory
3. Run `npm install` to install dependencies

### Getting Started

1. Set up environment variables:

   - Create a `.env.local` file in the root directory (see example .\_env file)
   - Add necessary environment variables (e.g., Firebase config, Pusher credentials)

2. Start the development server:

   ```
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser

### Configuration

- Firebase: Create firebase account and complete authentication settings, set Firebase public credentials in environment variables (these are public credentials - we are not using database or firestore so access rules are not needed).
- [Firebase Admin](https://firebase.google.com/docs/admin/setup): Add an admin/service account to Firebase and set firebase admin credentials in environment variables.
- R2/S3: Create cloudflare account and sign up for R2, set R2 credentials in environment variables. Alternatively, use AWS S3 client storage. (I did not use Firebase storage since R2 offers a lot more generous quota).
- Pusher: Create Pusher account, set Pusher credentials in environment variables.
