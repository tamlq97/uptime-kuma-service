require('dotenv').config();
const io = require('socket.io-client');

let monitorListCache = {};
let heartbeatListCache = {};
let importantHeartbeatListCache = {};

const socket = io(process.env.KUMA_URL, {
    transports: ['websocket']
});

// Kết nối thành công
socket.on('connect', () => {
    console.log('[Kuma] Connected');

    // Login bằng token
    socket.emit('loginByToken', process.env.KUMA_TOKEN, (res) => {
        if (res.ok) {
            console.log('[Kuma] Login successful');
        } else {
            console.error('[Kuma] Login failed:', res.msg);
        }
    });
});

// Nhận danh sách monitors
socket.on('monitorList', (data) => {
    monitorListCache = data;
    console.log('[Kuma] Monitor list updated:', Object.keys(data).length, 'items');
});

// Nhận danh sách heartbeats
socket.on('heartbeatList', (data) => {
    heartbeatListCache = data;
    console.log('[Kuma] Heartbeat list updated:', Object.keys(data).length, 'monitors');
});

// Nhận danh sách important heartbeats
socket.on('importantHeartbeatList', (data) => {
    importantHeartbeatListCache = data;
    console.log('[Kuma] Important heartbeat list updated:', Object.keys(data).length, 'monitors');
});

// Nhận heartbeat mới
socket.on('heartbeat', (data) => {
    const monitorId = data.monitorID;
    if (!heartbeatListCache[monitorId]) {
        heartbeatListCache[monitorId] = [];
    }
    
    // Thêm heartbeat mới vào đầu mảng
    heartbeatListCache[monitorId].unshift(data);
    
    // Giữ tối đa 100 heartbeats cho mỗi monitor
    if (heartbeatListCache[monitorId].length > 100) {
        heartbeatListCache[monitorId] = heartbeatListCache[monitorId].slice(0, 100);
    }
    
    console.log(`[Kuma] New heartbeat for monitor ${monitorId}:`, data.status === 1 ? 'UP' : 'DOWN');
});

// Nhận cập nhật monitor
socket.on('updateMonitorIntoList', (data) => {
    monitorListCache = {
        ...monitorListCache,
        ...data
    };
    console.log('[Kuma] Monitor updated');
});

// Xóa monitor khỏi list
socket.on('deleteMonitorFromList', (id) => {
    delete monitorListCache[id];
    delete heartbeatListCache[id];
    delete importantHeartbeatListCache[id];
    console.log('[Kuma] Monitor deleted:', id);
});

function getMonitors() {
    return monitorListCache;
}

function getMonitorDetail(id, callback) {
    socket.emit('getMonitor', {
        monitorID: id
    }, (res) => {
        callback(res);
    });
}

function getMonitorDetailFromCache(id) {
    return monitorListCache[id] || null;
}

// Lấy tất cả heartbeats
function getHeartbeats() {
    return heartbeatListCache;
}

// Lấy heartbeats của một monitor cụ thể
function getHeartbeatsByMonitor(monitorId) {
    return heartbeatListCache[monitorId] || [];
}

// Lấy heartbeat mới nhất của một monitor
function getLatestHeartbeat(monitorId) {
    const heartbeats = heartbeatListCache[monitorId];
    return heartbeats && heartbeats.length > 0 ? heartbeats[0] : null;
}

// Lấy tất cả important heartbeats
function getImportantHeartbeats() {
    return importantHeartbeatListCache;
}

// Lấy important heartbeats của một monitor cụ thể
function getImportantHeartbeatsByMonitor(monitorId) {
    return importantHeartbeatListCache[monitorId] || [];
}

// Yêu cầu lấy important heartbeats từ server
function requestImportantHeartbeats(monitorId, callback) {
    socket.emit('getImportantHeartbeats', {
        monitorID: monitorId
    }, (res) => {
        if (callback) callback(res);
    });
}

module.exports = {
    getMonitors,
    getMonitorDetail,
    getMonitorDetailFromCache,
    getHeartbeats,
    getHeartbeatsByMonitor,
    getLatestHeartbeat,
    getImportantHeartbeats,
    getImportantHeartbeatsByMonitor,
    requestImportantHeartbeats
};