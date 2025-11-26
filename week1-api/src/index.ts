import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'week1-api'
  });
});

// Hello world endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello World from Week 1 MindX API!',
    timestamp: new Date().toISOString()
  });
});

// Hello endpoint with optional name parameter
app.get('/hello/:name?', (req: Request, res: Response) => {
  const name = req.params.name || 'World';
  res.json({
    message: `Hello ${name} from Week 1 MindX API!`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Week 1 API server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👋 Hello world: http://localhost:${PORT}/`);
});