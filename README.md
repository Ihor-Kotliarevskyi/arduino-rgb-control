# Arduino RGB Control

A web interface for controlling an RGB LED connected to Arduino via USB, built with Node.js, Express, Socket.IO, and a Canvas color wheel.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)
![Arduino](https://img.shields.io/badge/Arduino-Uno%2FNano-00979D?logo=arduino&logoColor=white)

## Features

- 🎨 Interactive color wheel — click or drag to pick any color
- ✏️ Manual R/G/B input fields with live update
- 🔴🟢🔵 Single-channel shortcuts — click R, G, or B label to activate that color instantly
- ⚡ Real-time communication via WebSocket (Socket.IO)
- 📟 Serial log — displays all commands sent and responses from Arduino
- 💡 Custom command field for direct Serial communication

## Hardware

### Components

| Component | Details |
|-----------|---------|
| Arduino | Uno / Nano (or compatible) |
| RGB LED | Common cathode |
| Resistors | 3× 220Ω (one per channel) |

### Wiring

```
Arduino Pin 9  → 220Ω → R (red leg)
Arduino Pin 10 → 220Ω → G (green leg)
Arduino Pin 11 → 220Ω → B (blue leg)
Arduino GND    → common cathode (longest leg)
```

> **Common anode variant:** if your LED has a common anode, connect the shared leg to 5V and invert the PWM values in the sketch: `analogWrite(PIN_R, 255 - r)`.

## Project Structure

```
arduino-rgb-control/
├── server.js          # Node.js server — Express + Socket.IO + serialport
├── package.json
├── .gitignore
├── sketch/
│   └── sketch.ino     # Arduino sketch
└── public/
    ├── index.html     # Markup
    ├── style.css      # Styles
    └── app.js         # Color wheel, WebSocket, UI logic
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Arduino IDE](https://www.arduino.cc/en/software)

### 1. Flash the Arduino

Open `sketch/sketch.ino` in Arduino IDE, select your board and port, and upload.

### 2. Install dependencies

```bash
npm install
```

### 3. Set your Serial port

Open `server.js` and update the `SERIAL_PATH` constant:

```js
const SERIAL_PATH = 'COM3'; // Windows example
// const SERIAL_PATH = '/dev/ttyUSB0'; // Linux
// const SERIAL_PATH = '/dev/cu.usbmodem1401'; // macOS
```

> ⚠️ Arduino IDE and the Node.js server cannot use the Serial port simultaneously. Close Arduino IDE before running the server.

### 4. Start the server

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Serial Protocol

The server communicates with Arduino over Serial at 9600 baud. Supported commands:

| Command | Example | Description |
|---------|---------|-------------|
| `RGB r g b` | `RGB 255 128 0` | Set LED color (values 0–255) |
| `OFF` | `OFF` | Turn off all channels |

Arduino responds with `OK` after each command.

## What I Learned

- Using the `serialport` library to bridge USB Serial and a Node.js HTTP server
- Real-time bidirectional communication with Socket.IO
- Drawing an interactive HSL color wheel with the Canvas 2D API
- Throttling rapid mouse/touch events before sending to a hardware device
- Structuring a small full-stack project with clean separation of concerns
