import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { registerSocketHandlers } from "./src/lib/game/roomManager";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "localhost";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || `http://${hostname}:${port}`,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    // Detect dead clients quickly — default is 25s+20s = up to 45s, which
    // leaves the room stuck on stale host state for far too long after a tab
    // close. 5s+5s detects most disconnects within ~10s.
    pingInterval: 5000,
    pingTimeout: 5000,
  });

  registerSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> MedDraw ready on http://${hostname}:${port}`);
  });
});
