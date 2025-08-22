import express, { type Request, Response, NextFunction } from "express";
import { registerVite } from "./vite";
import { setupRoutes } from "./routes";

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers['content-type']
  });
  next();
});

// Setup API routes
setupRoutes(app);

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Express error handler:', error);

  // Ensure we always return JSON for API routes
  if (req.path.startsWith('/api/')) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'Terjadi kesalahan pada server'
    });
  } else {
    next(error);
  }
});

// Important: this comes after API routes but before error handling
registerVite(app);

const port = parseInt(process.env.PORT || "5000");
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});