// Local development (localhost)
export const API_URL_LOCAL = "http://localhost:5000";

// Local network IP (192.168.1.102)
export const API_URL_NETWORK = "http://192.168.1.102:5000";

// ngrok forwarding (production/remote testing)
export const API_URL_NGROK = "https://eastwardly-retreatal-kerstin.ngrok-free.dev";

// Active API URL - change this to switch between local and remote
export const API_URL = API_URL_NETWORK;

// Alternative configurations:
// export const API_URL = API_URL_LOCAL;      // Use localhost
// export const API_URL = API_URL_NGROK;       // Use ngrok forwarding
