const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Phân phối giao diện
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/scanner', (req, res) => res.sendFile(path.join(__dirname, 'scanner.html')));
app.get('/projector', (req, res) => res.sendFile(path.join(__dirname, 'projector.html')));
app.get('/marker', (req, res) => res.sendFile(path.join(__dirname, 'generate_marker.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));

// [ĐÃ BỔ SUNG] Phân phối trang Bóc tách & AI
app.get('/auto_parser.html', (req, res) => res.sendFile(path.join(__dirname, 'auto_parser.html')));

// Phân phối âm thanh
app.get('/chucmung.mp3', (req, res) => res.sendFile(path.join(__dirname, 'chucmung.mp3')));
app.get('/hetgio.mp3', (req, res) => res.sendFile(path.join(__dirname, 'hetgio.mp3')));
app.get('/tinh-gio-choi.mp3', (req, res) => res.sendFile(path.join(__dirname, 'tinh-gio-choi.mp3')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.on('connection', (socket) => {
    console.log(`[+] Thiết bị kết nối (ID: ${socket.id})`);

    // Thiết bị tham gia vào Mã Phòng
    socket.on('join_room', (roomCode) => {
        socket.join(roomCode);
        console.log(`Thiết bị ${socket.id} đã vào phòng: ${roomCode}`);
        // Báo cho Máy chiếu biết có điện thoại vừa vào để Máy chiếu gửi dữ liệu sang
        socket.to(roomCode).emit('device_joined');
    });

    // Các lệnh điều khiển chỉ phát trong phạm vi Mã Phòng
    socket.on('scanned_answer', (data) => { io.to(data.room).emit('update_projector', data); });
    socket.on('teacher_command', (data) => { io.to(data.room).emit('execute_command', data); });
    socket.on('sync_data_to_phone', (data) => { io.to(data.room).emit('receive_sync_data', data); });

    socket.on('disconnect', () => { console.log(`[-] Thiết bị ngắt kết nối`); });
});

app.get('/api/status', (req, res) => { res.json({ status: "success", message: "Trạm trung chuyển đang hoạt động!" }); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 MÁY CHỦ CHẠY TẠI PORT: ${PORT}`);
    console.log(`===========================================`);
});