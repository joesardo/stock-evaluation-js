#!/bin/bash

echo "📚 Installing dependencies (if needed)..."
npm install > /dev/null 2>&1
cd frontend && npm install > /dev/null 2>&1 && cd ..

echo ""
echo "🚀 Starting application..."
echo ""
echo "📊 Backend API: http://localhost:3000"
echo "🎨 Frontend UI: http://localhost:5174 (or next available port)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend and frontend in parallel
npm run server &
BACKEND_PID=$!

sleep 2

cd frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

