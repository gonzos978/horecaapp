import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`✓ Client connected: ${socket.id}`);

  socket.on('register', (data) => {
    const { userId, userRole, userName } = data;
    connectedUsers.set(socket.id, { userId, userRole, userName });
    console.log(`✓ User registered: ${userName} (${userRole})`);

    socket.emit('registered', {
      success: true,
      message: 'Successfully registered for real-time updates'
    });
  });

  socket.on('alert:new', (alert) => {
    console.log(`📢 Broadcasting new alert: ${alert.type}`);
    io.emit('alert:received', {
      ...alert,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('voiceorder:new', (order) => {
    console.log(`🎤 Broadcasting new voice order: Table ${order.tableNumber}`);

    io.emit('voiceorder:received', {
      ...order,
      timestamp: new Date().toISOString()
    });

    const cooks = Array.from(connectedUsers.entries())
      .filter(([_, user]) => user.userRole === 'COOK' || user.userRole === 'LINE_COOK')
      .map(([socketId, _]) => socketId);

    cooks.forEach(socketId => {
      io.to(socketId).emit('voiceorder:kitchen', {
        ...order,
        urgent: true,
        timestamp: new Date().toISOString()
      });
    });
  });

  socket.on('checklist:completed', (data) => {
    console.log(`✅ Checklist completed: ${data.checklistId} by ${data.workerId}`);

    io.emit('checklist:update', {
      ...data,
      timestamp: new Date().toISOString()
    });

    const managers = Array.from(connectedUsers.entries())
      .filter(([_, user]) => user.userRole === 'MANAGER' || user.userRole === 'ADMIN')
      .map(([socketId, _]) => socketId);

    managers.forEach(socketId => {
      io.to(socketId).emit('notification', {
        type: 'CHECKLIST_COMPLETED',
        title: 'Check lista završena',
        message: `${data.workerName} je završio check listu: ${data.checklistName}`,
        severity: 'LOW',
        timestamp: new Date().toISOString()
      });
    });
  });

  socket.on('inventory:gap', (data) => {
    console.log(`⚠️ Inventory gap detected: ${data.itemName}`);

    const alert = {
      type: 'INVENTORY_GAP',
      title: 'Detektovan manjak inventara',
      message: `AI detektovao razliku u artiklu: ${data.itemName}`,
      severity: 'HIGH',
      amount: data.variance,
      timestamp: new Date().toISOString()
    };

    io.emit('alert:received', alert);
  });

  socket.on('theft:detected', (data) => {
    console.log(`🚨 Theft detected: ${data.description}`);

    const alert = {
      type: 'THEFT',
      title: 'Detektovana krađa',
      message: data.description,
      severity: 'CRITICAL',
      amount: data.amount,
      timestamp: new Date().toISOString()
    };

    io.emit('alert:received', alert);

    const managers = Array.from(connectedUsers.entries())
      .filter(([_, user]) => user.userRole === 'MANAGER' || user.userRole === 'ADMIN')
      .map(([socketId, _]) => socketId);

    managers.forEach(socketId => {
      io.to(socketId).emit('notification:urgent', alert);
    });
  });

  socket.on('worker:late', (data) => {
    console.log(`⏰ Worker late: ${data.workerName}`);

    const alert = {
      type: 'LATE_ARRIVAL',
      title: 'Kasnjenje radnika',
      message: `${data.workerName} kasni ${data.minutesLate} minuta`,
      severity: 'MEDIUM',
      workerId: data.workerId,
      timestamp: new Date().toISOString()
    };

    io.emit('alert:received', alert);
  });

  socket.on('training:failed', (data) => {
    console.log(`❌ Training failed: ${data.workerName} - ${data.testName}`);

    const severity = data.score < 50 ? 'CRITICAL' : 'HIGH';

    const alert = {
      type: 'TRAINING_FAILED',
      title: 'Test nepoložen',
      message: `${data.workerName} nije položio test: ${data.testName} (Score: ${data.score}/100)`,
      severity: severity,
      workerId: data.workerId,
      timestamp: new Date().toISOString()
    };

    io.emit('alert:received', alert);
  };

  socket.on('anonymousReport:new', (report) => {
    console.log(`📝 New anonymous report: ${report.type}`);

    const managers = Array.from(connectedUsers.entries())
      .filter(([_, user]) => user.userRole === 'MANAGER' || user.userRole === 'ADMIN')
      .map(([socketId, _]) => socketId);

    managers.forEach(socketId => {
      io.to(socketId).emit('anonymousReport:received', {
        ...report,
        timestamp: new Date().toISOString()
      });
    });
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`✗ User disconnected: ${user.userName} (${user.userRole})`);
      connectedUsers.delete(socket.id);
    } else {
      console.log(`✗ Client disconnected: ${socket.id}`);
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   SMARTER HORECA AI - Socket.io Real-Time Server       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health\n`);
  console.log('Waiting for connections...\n');
});

setInterval(() => {
  const mockAlerts = [
    {
      type: 'INVENTORY_GAP',
      title: 'AI detektovao manjak',
      message: 'Pomfrit: Očekivano 15kg, stvarno 12.8kg',
      severity: 'MEDIUM',
      amount: 30.50
    },
    {
      type: 'VOICE_ORDER',
      title: 'Nova voice porudžbina',
      message: 'Sto 5: 2x Šnicla, Pomfrit',
      severity: 'LOW',
      tableNumber: 5
    }
  ];

  if (connectedUsers.size > 0) {
    const randomAlert = mockAlerts[Math.floor(Math.random() * mockAlerts.length)];
    io.emit('alert:received', {
      ...randomAlert,
      timestamp: new Date().toISOString()
    });
    console.log(`🔄 Sent mock alert: ${randomAlert.type}`);
  }
}, 60000);
