const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const PORT = 3000;
const SERIAL_PATH = "COM7"; // змінити на свій порт
const BAUD_RATE = 9600;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const serial = new SerialPort({ path: SERIAL_PATH, baudRate: BAUD_RATE });
const parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

serial.on("open", () => console.log(`Serial відкрито: ${SERIAL_PATH}`));
serial.on("error", (err) => console.error("Serial помилка:", err.message));

parser.on("data", (line) => {
  const trimmed = line.trim();
  console.log("Arduino →", trimmed);
  io.emit("arduino-data", trimmed);
});

function sendToArduino(cmd) {
  serial.write(cmd + "\n", (err) => {
    if (err) console.error("Помилка запису:", err.message);
  });
}

io.on("connection", (socket) => {
  console.log("Браузер підключився");

  socket.on("command", (cmd) => {
    console.log("← Команда:", cmd);
    sendToArduino(cmd);
  });

  socket.on("disconnect", () => console.log("Браузер відключився"));
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
