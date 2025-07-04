# Live Polling System - Backend

A real-time polling system backend built with Express.js and Socket.IO.

## Features

- **Real-time Communication**: Powered by Socket.IO for instant updates
- **Poll Management**: Create, manage, and track polls with configurable time limits
- **Student Management**: Track connected students and their responses
- **Live Results**: Real-time poll results and statistics
- **Chat System**: Real-time messaging between teachers and students
- **Student Kicking**: Teachers can remove disruptive students
- **Poll History**: Store and retrieve past poll results

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
PORT=5000
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### REST API

- `GET /api/polls/history` - Get all poll history
- `GET /api/students` - Get current connected students
- `GET /api/chat` - Get chat messages

### Socket.IO Events

#### Teacher Events
- `teacher-join` - Teacher joins the session
- `create-poll` - Create a new poll
- `kick-student` - Kick a student from the session
- `send-message` - Send a chat message

#### Student Events
- `student-join` - Student joins with a name
- `submit-answer` - Submit answer to current poll
- `send-message` - Send a chat message

#### Data Request Events
- `get-current-poll` - Get current active poll
- `get-poll-history` - Get poll history
- `get-chat-messages` - Get chat messages
- `get-students` - Get connected students

#### Server Emitted Events
- `teacher-joined` - Confirmation of teacher joining
- `student-joined` - Confirmation of student joining with ID
- `poll-created` - New poll created
- `poll-results-updated` - Poll results updated
- `poll-ended` - Poll has ended
- `student-list-updated` - Student list updated
- `new-message` - New chat message
- `kicked` - Student has been kicked
- `answer-submitted` - Answer submission confirmed
- `poll-error` - Poll-related error
- `error` - General error

## Data Structures

### Poll Object
```javascript
{
  id: "uuid",
  question: "What is your favorite color?",
  options: ["Red", "Blue", "Green", "Yellow"],
  maxTime: 60,
  createdAt: Date,
  isComplete: false,
  answers: {},
  results: {
    "Red": 5,
    "Blue": 3,
    "Green": 2,
    "Yellow": 1
  }
}
```

### Student Object
```javascript
{
  id: "uuid",
  name: "John Doe",
  socketId: "socket_id",
  hasAnswered: false
}
```

### Chat Message Object
```javascript
{
  id: "uuid",
  sender: "John Doe",
  message: "Hello everyone!",
  timestamp: Date,
  senderType: "student" // or "teacher"
}
```

## Environment Variables

- `PORT` - Server port (default: 5000)

## Dependencies

- **express** - Web framework
- **socket.io** - Real-time communication
- **cors** - Cross-origin resource sharing
- **uuid** - Unique identifier generation
- **dotenv** - Environment variable management

## Development Dependencies

- **nodemon** - Auto-restart server during development

## Security Considerations

- CORS is enabled for development
- Input validation should be added for production
- Rate limiting should be implemented for production
- Authentication should be added for production use

## Deployment

The backend can be deployed to various platforms:

- **Heroku**: Add a `Procfile` with `web: node server.js`
- **Railway**: Connect your GitHub repository
- **Vercel**: Configure for Node.js deployment
- **DigitalOcean**: Deploy to a droplet

Make sure to set the appropriate environment variables in your deployment platform. 