const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname,  './build')));

// Store active polls, students, and chat messages
const activePolls = new Map();
const students = new Map();
const chatMessages = [];
const pollHistory = [];

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle teacher joining
  socket.on('teacher-join', () => {
    socket.join('teachers');
    socket.emit('teacher-joined');
    console.log('Teacher joined');
  });

  // Handle student joining
  socket.on('student-join', (studentName) => {
    const studentId = uuidv4();
    const student = {
      id: studentId,
      name: studentName,
      socketId: socket.id,
      hasAnswered: false
    };
    
    students.set(socket.id, student);
    socket.studentId = studentId;
    socket.join('students');
    
    socket.emit('student-joined', { studentId, studentName });
    io.to('teachers').emit('student-list-updated', Array.from(students.values()));
    
    console.log(`Student ${studentName} joined with ID: ${studentId}`);
  });

  // Handle poll creation
  socket.on('create-poll', (pollData) => {
    const currentPoll = activePolls.get('current');
    if (currentPoll && !currentPoll.isComplete) {
      socket.emit('poll-error', 'Cannot create new poll while current poll is active');
      return;
    }

    const poll = {
      id: uuidv4(),
      question: pollData.question,
      options: pollData.options,
      maxTime: pollData.maxTime || 60,
      createdAt: new Date(),
      isComplete: false,
      answers: {},
      results: {}
    };

    // Initialize results
    pollData.options.forEach(option => {
      poll.results[option] = 0;
    });

    activePolls.set('current', poll);
    
    // Broadcast to all clients
    io.emit('poll-created', poll);
    
    // Start timer
    setTimeout(() => {
      const currentPoll = activePolls.get('current');
      if (currentPoll && currentPoll.id === poll.id) {
        currentPoll.isComplete = true;
        activePolls.set('current', currentPoll);
        io.emit('poll-ended', currentPoll);
        
        // Save to history
        pollHistory.push({
          ...currentPoll,
          totalResponses: Object.keys(currentPoll.answers).length
        });
      }
    }, poll.maxTime * 1000);

    console.log('Poll created:', poll.question);
  });

  // Handle student answer submission
  socket.on('submit-answer', (data) => {
    const student = students.get(socket.id);
    if (!student) {
      socket.emit('error', 'Student not found');
      return;
    }

    const currentPoll = activePolls.get('current');
    if (!currentPoll || currentPoll.isComplete) {
      socket.emit('error', 'No active poll');
      return;
    }

    if (student.hasAnswered) {
      socket.emit('error', 'You have already answered this poll');
      return;
    }

    // Record answer
    currentPoll.answers[student.id] = data.answer;
    currentPoll.results[data.answer]++;
    student.hasAnswered = true;
    students.set(socket.id, student);

    socket.emit('answer-submitted');
    io.emit('poll-results-updated', currentPoll);

    // Check if all students have answered
    const allStudentsAnswered = Array.from(students.values()).every(s => s.hasAnswered);
    if (allStudentsAnswered) {
      currentPoll.isComplete = true;
      activePolls.set('current', currentPoll);
      io.emit('poll-ended', currentPoll);
      
      // Save to history
      pollHistory.push({
        ...currentPoll,
        totalResponses: Object.keys(currentPoll.answers).length
      });
    }

    console.log(`Student ${student.name} answered: ${data.answer}`);
  });

  // Handle chat messages
  socket.on('send-message', (messageData) => {
    const student = students.get(socket.id);
    const message = {
      id: uuidv4(),
      sender: student ? student.name : 'Teacher',
      message: messageData.message,
      timestamp: new Date(),
      senderType: student ? 'student' : 'teacher'
    };

    chatMessages.push(message);
    io.emit('new-message', message);
  });

  // Handle kicking student
  socket.on('kick-student', (studentId) => {
    const student = Array.from(students.values()).find(s => s.id === studentId);
    if (student) {
      const studentSocket = io.sockets.sockets.get(student.socketId);
      if (studentSocket) {
        studentSocket.emit('kicked');
        studentSocket.disconnect();
      }
      students.delete(student.socketId);
      io.to('teachers').emit('student-list-updated', Array.from(students.values()));
    }
  });

  // Handle requests for current data
  socket.on('get-current-poll', () => {
    const currentPoll = activePolls.get('current');
    if (currentPoll) {
      socket.emit('current-poll', currentPoll);
    }
  });

  socket.on('get-poll-history', () => {
    socket.emit('poll-history', pollHistory);
  });

  socket.on('get-chat-messages', () => {
    socket.emit('chat-messages', chatMessages);
  });

  socket.on('get-students', () => {
    socket.emit('student-list', Array.from(students.values()));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected now:', socket.id);
    
    if (students.has(socket.id)) {
      students.delete(socket.id);
      io.to('teachers').emit('student-list-updated', Array.from(students.values()));
    }
  });
});

// API endpoints
app.get('/api/polls/history', (req, res) => {
  res.json(pollHistory);
});

app.get('/api/students', (req, res) => {
  res.json(Array.from(students.values()));
});

app.get('/api/chat', (req, res) => {
  res.json(chatMessages);
});
  

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './build/index.html'));
  
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 