require('dotenv').config();
const express = require('express');
const {
    getMonitors,
    getMonitorDetail,
    getMonitorDetailFromCache
} = require('./kumaClient');

const app = express();

// Endpoint lấy toàn bộ monitor
app.get('/monitors', (req, res) => {
    res.json(getMonitors());
});

// Endpoint lấy chi tiết monitor
app.get('/monitors/:id', (req, res) => {
    const id = parseInt(req.params.id);
    getMonitorDetail(id, (result) => {
        if (result.ok) {
            res.json(result.monitor);
        } else {
            console.log(result);
            res.status(400).json({
                error: result.msg
            });
        }
    });
});

// Endpoint lấy chi tiết monitor
app.get('/monitors/cache/:id', (req, res) => {
    const id = req.params.id; // Lấy id dưới dạng chuỗi, phù hợp với key trong đối tượng

    const monitor = getMonitorDetailFromCache(id);

    if (monitor) {
        res.json(monitor);
    } else {
        // Nếu không tìm thấy, trả về lỗi 404
        res.status(404).json({
            error: 'Monitor not found'
        });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`REST API server running on port ${process.env.PORT}`);
});