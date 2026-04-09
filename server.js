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

// Phân phối trang Bóc tách & AI (hỗ trợ nhiều dạng URL)
app.get('/auto-parser', (req, res) => res.sendFile(path.join(__dirname, 'auto_parser.html')));
app.get('/auto_parser', (req, res) => res.sendFile(path.join(__dirname, 'auto_parser.html')));
app.get('/auto_parser.html', (req, res) => res.sendFile(path.join(__dirname, 'auto_parser.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));

// Phân phối âm thanh
app.get('/chucmung.mp3', (req, res) => res.sendFile(path.join(__dirname, 'chucmung.mp3')));
app.get('/hetgio.mp3', (req, res) => res.sendFile(path.join(__dirname, 'hetgio.mp3')));
app.get('/tinh-gio-choi.mp3', (req, res) => res.sendFile(path.join(__dirname, 'tinh-gio-choi.mp3')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] }, maxHttpBufferSize: 1e8 });

// =======================================================
// [NÂNG CẤP TÍNH NĂNG]: KÉT SẮT "THỦ KHO" LƯU TRỮ TRÊN RAM
// =======================================================
const roomStorage = {};

io.on('connection', (socket) => {
    console.log(`[+] Thiết bị kết nối (ID: ${socket.id})`);

    // Thiết bị tham gia vào Mã Phòng
    socket.on('join_room', (roomCode) => {
        socket.join(roomCode);
        console.log(`Thiết bị ${socket.id} đã vào phòng: ${roomCode}`);

        // [NÂNG CẤP]: Trích xuất dữ liệu từ Két sắt và bơm thẳng vào Điện thoại mới quét mã
        if (roomStorage[roomCode]) {
            socket.emit('receive_sync_data', roomStorage[roomCode]);
            console.log(`📦 Đã bơm dữ liệu siêu tốc từ Thủ Kho cho thiết bị ${socket.id}`);
        }

        // Báo cho Máy chiếu biết có điện thoại vừa vào để Máy chiếu gửi dữ liệu sang (Dự phòng 2 lớp)
        socket.to(roomCode).emit('device_joined');
    });

    // Các lệnh điều khiển chỉ phát trong phạm vi Mã Phòng
    socket.on('scanned_answer', (data) => { io.to(data.room).emit('update_projector', data); });
    socket.on('teacher_command', (data) => { io.to(data.room).emit('execute_command', data); });

    // [NÂNG CẤP]: Khi Máy chiếu gửi dữ liệu lên, Server cất 1 bản copy vào Két sắt
    socket.on('sync_data_to_phone', (data) => {
        if (data && data.room) {
            roomStorage[data.room] = data; // Cất vào két sắt theo mã phòng
            // Phát tiếp cho các thiết bị (điện thoại) đang có mặt trong phòng
            io.to(data.room).emit('receive_sync_data', data);
        }
    });

    socket.on('disconnect', () => { console.log(`[-] Thiết bị ngắt kết nối`); });
});

app.get('/api/status', (req, res) => { res.json({ status: "success", message: "Trạm trung chuyển đang hoạt động!" }); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 MÁY CHỦ CHẠY TẠI PORT: ${PORT} (Đã bật Két Sắt Thủ Kho)`);
    console.log(`===========================================`);
});