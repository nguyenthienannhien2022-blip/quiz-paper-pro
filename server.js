const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.join(__dirname, 'database.json');

function loadDatabase() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify([]));
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
}

function saveDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 4));
}

app.get('/api/questions', (req, res) => {
    try {
        const data = loadDatabase();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Lỗi đọc dữ liệu" });
    }
});

app.post('/api/questions', (req, res) => {
    try {
        const questions = req.body;
        saveDatabase(questions);
        res.json({ status: "success", message: "Đã lưu an toàn vào database.json!" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi ghi dữ liệu" });
    }
});

// Phân phối file giao diện
app.get('/scanner', (req, res) => res.sendFile(path.join(__dirname, 'scanner.html')));
app.get('/projector', (req, res) => res.sendFile(path.join(__dirname, 'projector.html')));
app.get('/marker', (req, res) => res.sendFile(path.join(__dirname, 'generate_marker.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));

// Phân phối file âm thanh
app.get('/chucmung.mp3', (req, res) => res.sendFile(path.join(__dirname, 'chucmung.mp3')));
app.get('/hetgio.mp3', (req, res) => res.sendFile(path.join(__dirname, 'hetgio.mp3')));
app.get('/tinh-gio-choi.mp3', (req, res) => res.sendFile(path.join(__dirname, 'tinh-gio-choi.mp3')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log(`[+] Một thiết bị kết nối (ID: ${socket.id})`);

    socket.on('scanned_answer', (data) => {
        io.emit('update_projector', data);
    });

    socket.on('teacher_command', (data) => {
        io.emit('execute_command', data);
    });

    socket.on('disconnect', () => {
        console.log(`[-] Thiết bị ngắt kết nối (ID: ${socket.id})`);
    });
});

app.get('/api/status', (req, res) => {
    res.json({ status: "success", message: "Hệ thống đang hoạt động tốt!" });
});

// [ĐÃ SỬA CHỖ NÀY] - Tự động nhận diện Port của máy chủ Cloud
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 MÁY CHỦ CHẠY TẠI PORT: ${PORT}`);
    console.log(`📡 Hệ thống Sẵn sàng trên môi trường Cloud!`);
    console.log(`===========================================`);
});