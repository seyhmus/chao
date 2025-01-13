# Secure Chat Application with Mancala Game

This project is a secure chat application that includes end-to-end encryption and a multiplayer Mancala game feature.

The application provides a robust platform for secure communication between users, with additional entertainment through the integrated Mancala game. It leverages modern web technologies and cryptographic methods to ensure user privacy and data security.

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

- Node.js (v14 or later)
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

### Testing

Run unit tests:

```
npm test
```

### Troubleshooting

Common issues:

1. Authentication errors:

   - Ensure Firebase configuration is correct
   - Check if the user is properly authenticated

2. Message encryption/decryption issues:

   - Verify that both users have exchanged public keys correctly
   - Check if the shared secret is properly derived and stored

3. Mancala game not updating:
   - Ensure that the Pusher connection is established
   - Verify that game moves are being sent and received correctly

Debugging:

- Enable debug mode by setting `DEBUG=true` in your environment variables
- Check the browser console for detailed error messages and logs

## Data Flow

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
[Pusher Channels] <---------------> [Pusher Channels]
    |                                   |
    v                                   v
[Decryption]                       [Decryption]
    |                                   |
    v                                   v
[UI Update]                         [UI Update]
```

Notes:

- Ensure proper key management and storage for maintaining end-to-end encryption.
- Game state updates should be validated on both client and server sides to prevent cheating.
