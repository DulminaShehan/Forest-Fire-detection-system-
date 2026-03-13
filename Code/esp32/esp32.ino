#define LED 2   // GPIO pin (built-in LED usually GPIO 2)

void setup() {
  pinMode(LED, OUTPUT);   // Set pin as output
}

void loop() {
  digitalWrite(LED, HIGH);  // Turn LED ON
  delay(1000);              // Wait 1 second

  digitalWrite(LED, LOW);   // Turn LED OFF
  delay(1000);              // Wait 1 second
}