export interface WebSocketErrorCodeToReason {
  code: number;
  reason: string;
  definition: string;
}

// https://github.com/Luka967/websocket-close-codes?tab=readme-ov-file#websocket-close-codes
export default function errorCodeToReason(code: number): WebSocketErrorCodeToReason {
  for (const [reason, err] of Object.entries(WEBSOCKET_ERROR_CODE)) {
    if (err.code === code) {
      return { code: err.code, reason, definition: err.definition };
    }
  }
  return { code, reason: "", definition: "" };
}

export const WEBSOCKET_ERROR_CODE = {
  "Normal Closure": {
    code: 1000,
    definition: "Successful operation, connection not required anymore",
  },
  "Going Away": {
    code: 1001,
    definition: "Browser tab closing, graceful server shutdown",
  },
  "Protocol error": {
    code: 1002,
    definition: "The client or server is terminating the connection because of a protocol error",
  },
  "Unsupported Data": {
    code: 1003,
    definition: "Endpoint received unsupported frame (e.g. binary-only got text frame, ping/pong frames not handled properly)",
  },
  "No Status Rcvd": {
    code: 1005,
    definition: "Got no close status but transport layer finished normally (e.g. TCP FIN but no previous CLOSE frame)",
  },
  "Abnormal closure": {
    code: 1006,
    definition: "Transport layer broke (e.g. couldn't connect, TCP RST)",
  },
  "Invalid frame payload data": {
    code: 1007,
    definition: "Data in endpoint's frame is not consistent (e.g. malformed UTF-8)",
  },
  "Policy Violation": {
    code: 1008,
    definition: "Policy violated. Generic code not applicable to any other (e.g. isn't 1003 nor 1009)",
  },
  "Message Too Big": {
    code: 1009,
    definition: "Endpoint won't process large message",
  },
  "Mandatory Ext.": {
    code: 1010,
    definition: "The client should write the extensions it expected the server to support in the payload",
  },
  "Internal Server Error": {
    code: 1011,
    definition: "Unexpected server problem while operating",
  },
  "Service Restart": {
    code: 1012,
    definition: "Server/service is restarting",
  },
  "TLS handshake": {
    code: 1015,
    definition: "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified)",
  },
  Unauthorized: {
    code: 3000,
    definition: "Endpoint must be authorized to perform application-based request. Equivalent to HTTP 401",
  },
  Forbidden: {
    code: 3003,
    definition: "Endpoint is authorized but has no permissions to perform application-based request. Equivalent to HTTP 403",
  },
};
