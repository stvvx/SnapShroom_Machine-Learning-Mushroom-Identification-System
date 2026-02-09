// Get configuration from environment variables
const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP || "192.168.1.102";
const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || "5000";
const NGROK_URL = process.env.EXPO_PUBLIC_NGROK_URL || "https://eastwardly-retreatal-kerstin.ngrok-free.dev";

// Local development (localhost)
export const API_URL_LOCAL = "http://localhost:5000";

// Local network IP (from .env)
export const API_URL_NETWORK = `http://${BACKEND_IP}:${BACKEND_PORT}`;

// ngrok forwarding (from .env)
export const API_URL_NGROK = NGROK_URL;

// Active API URL - change this to switch between local and remote
export const API_URL = API_URL_NETWORK;

// Alternative configurations:
// export const API_URL = API_URL_LOCAL;      // Use localhost
// export const API_URL = API_URL_NGROK;       // Use ngrok forwarding
