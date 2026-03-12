import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import express from 'express';
import { createServer } from 'http';
import multer from 'multer';
import { WebSocketServer } from './ws/WebSocketServer.js';
import { LiveKitManager } from './voice/LiveKitManager.js';
import { VoiceProfileStore } from './voice/VoiceProfileStore.js';
import { LeviathanPipeline } from './voice/LeviathanPipeline.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(express.json());

// Serve client static files in production
const clientDist = resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const livekitManager = new LiveKitManager();
const voiceProfileStore = new VoiceProfileStore();
const leviathanPipeline = new LeviathanPipeline(livekitManager, voiceProfileStore);

// LiveKit token endpoint
app.get('/api/livekit-token', async (req, res) => {
  const { roomId, playerId } = req.query;
  if (!roomId || !playerId) {
    res.status(400).json({ error: 'roomId and playerId required' });
    return;
  }
  const token = await livekitManager.generateToken(roomId as string, playerId as string);
  res.json({ token, url: process.env.LIVEKIT_URL || 'ws://localhost:7880' });
});

// Voice calibration upload endpoint
app.post('/api/voice-calibration', upload.single('audio'), async (req, res) => {
  const playerId = req.body.playerId;
  if (!playerId || !req.file) {
    res.status(400).json({ error: 'playerId and audio file required' });
    return;
  }

  try {
    const voiceId = await leviathanPipeline.cloneVoice(req.file.buffer);
    voiceProfileStore.set(playerId, voiceId);
    console.log(`[Server] Voice cloned for ${playerId}: ${voiceId}`);
    res.json({ success: true, voiceId });
  } catch (err) {
    console.error('[Server] Voice cloning failed:', err);
    res.status(500).json({ error: 'Voice cloning failed' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// SPA fallback — serve index.html for non-API routes
app.get('*', (_req, res) => {
  res.sendFile(resolve(clientDist, 'index.html'));
});

const server = createServer(app);
const wsServer = new WebSocketServer(server, leviathanPipeline, voiceProfileStore);

server.listen(PORT, () => {
  console.log(`[Server] HTTP + WS listening on :${PORT}`);
});
