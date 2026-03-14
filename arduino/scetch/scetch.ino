#include <NanitLib.h>  // Підключаємо бібліотеку NanitLib.

const int PIN_R = P4_4;
const int PIN_G = P4_3;
const int PIN_B = P4_2;

void setup() {
  Nanit_Base_Start();
  Serial.begin(9600);
  pinMode(PIN_R, OUTPUT);
  pinMode(PIN_G, OUTPUT);
  pinMode(PIN_B, OUTPUT);
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    handleCommand(cmd);
    Serial.println("OK");
  }
}

void handleCommand(String cmd) {
  if (cmd == "OFF") {
    analogWrite(PIN_R, 0);
    analogWrite(PIN_G, 0);
    analogWrite(PIN_B, 0);
    return;
  }

  // Формат команди: "RGB 255 0 128"
  if (cmd.startsWith("RGB ")) {
    int r, g, b;
    sscanf(cmd.c_str(), "RGB %d %d %d", &r, &g, &b);
    analogWrite(PIN_R, r);
    analogWrite(PIN_G, g);
    analogWrite(PIN_B, b);
  }
}