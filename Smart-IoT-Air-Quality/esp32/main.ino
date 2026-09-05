/*
 * ============================================================
 * AIRGUARD AI - SMART IoT AIR QUALITY MONITORING SYSTEM
 * ESP32-S3 Firmware - Phase 2
 * ============================================================
 *
 * Hardware:
 *   ESP32-S3 Dev Module
 *
 *   DHT11
 *     DATA -> GPIO 7
 *
 *   MQ-135
 *     AO -> GPIO 4
 *
 *   MQ-7
 *     AO -> 1k/1k voltage divider -> GPIO 5
 *
 *   OLED SH1106 128x64
 *     SDA -> GPIO 8
 *     SCL -> GPIO 9
 *
 * Features:
 *   - DHT11 temperature/humidity
 *   - Stable MQ-135 ADC sampling
 *   - Stable MQ-7 ADC sampling
 *   - MQ-7 divider voltage reconstruction
 *   - 30-second startup warm-up
 *   - WiFi reconnect
 *   - Backend HTTP POST
 *   - OLED status
 *
 * NOTE:
 * MQ-135 is powered by 5V and its AO voltage has not been
 * physically measured with a multimeter.
 *
 * Therefore direct MQ-135 AO -> ESP32 GPIO4 remains electrically
 * UNVERIFIED. Do not assume it is safe if the module can output
 * above the ESP32 ADC input limit.
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <U8g2lib.h>
#include <DHT.h>
#include <math.h>


// ============================================================
// WIFI
// ============================================================

const char* WIFI_SSID = "LAPTOP-QPDHVGDQ 3607";
const char* WIFI_PASSWORD = "3+b8298F";


// ============================================================
// BACKEND SERVER
// ============================================================

const char* SERVER_URL =
    "http://192.168.137.1:5001/api/sensors";


// ============================================================
// DEVICE INFORMATION
// ============================================================

const char* DEVICE_ID = "ESP32-001";
const char* LOCATION = "Lucknow";


// ============================================================
// PIN CONFIGURATION
// ============================================================

#define DHT_PIN 7
#define DHT_TYPE DHT11

#define MQ135_PIN 4
#define MQ7_PIN 5

#define OLED_SDA 8
#define OLED_SCL 9


// ============================================================
// TIMING
// ============================================================

const unsigned long SEND_INTERVAL_MS = 5000;

// Give gas sensors time to stabilize after startup.
const unsigned long STARTUP_WARMUP_MS = 30000;


// ============================================================
// MQ-7 VOLTAGE DIVIDER
// ============================================================
//
// Your existing circuit:
//
// MQ7 AO
//    |
//   1k
//    |
//    +------ GPIO5
//    |
//   1k
//    |
//   GND
//
// GPIO sees approximately half of the original AO voltage.
//
// Therefore:
//
// Actual AO = measured GPIO voltage * 2
//

const float MQ7_DIVIDER_RATIO = 2.0;


// ============================================================
// OLED
// ============================================================

U8G2_SH1106_128X64_NONAME_F_HW_I2C oled(
    U8G2_R0,
    U8X8_PIN_NONE
);


// ============================================================
// DHT
// ============================================================

DHT dht(DHT_PIN, DHT_TYPE);


// ============================================================
// GLOBAL VARIABLES
// ============================================================

unsigned long bootTime = 0;
unsigned long lastSend = 0;


// ============================================================
// READ STABLE ADC VALUE
// ============================================================
//
// Takes multiple samples and returns the median.
//
// Median filtering helps remove occasional ADC spikes.
//

int readStableRaw(int pin, int samples = 15)
{
    const int MAX_SAMPLES = 25;

    if (samples > MAX_SAMPLES)
    {
        samples = MAX_SAMPLES;
    }

    int values[MAX_SAMPLES];


    // --------------------------------------------------------
    // Take samples
    // --------------------------------------------------------

    for (int i = 0; i < samples; i++)
    {
        values[i] = analogRead(pin);

        delay(4);
    }


    // --------------------------------------------------------
    // Sort values
    // --------------------------------------------------------

    for (int i = 1; i < samples; i++)
    {
        int key = values[i];

        int j = i - 1;


        while (j >= 0 && values[j] > key)
        {
            values[j + 1] = values[j];

            j--;
        }


        values[j + 1] = key;
    }


    // --------------------------------------------------------
    // Return median
    // --------------------------------------------------------

    return values[samples / 2];
}


// ============================================================
// READ STABLE MILLIVOLTS
// ============================================================

uint32_t readStableMilliVolts(
    int pin,
    int samples = 7
)
{
    uint64_t total = 0;


    for (int i = 0; i < samples; i++)
    {
        total += analogReadMilliVolts(pin);

        delay(4);
    }


    return (uint32_t)(total / samples);
}


// ============================================================
// LOCAL STATUS
// ============================================================
//
// IMPORTANT:
// This is NOT official AQI.
//
// It is only a simple local gas-response indicator for OLED.
//

String localStatus(
    int mq135,
    int mq7
)
{
    float mq135Level =
        (float)mq135 / 4095.0;

    float mq7Level =
        (float)mq7 / 4095.0;


    float gasIndex =
        max(mq135Level, mq7Level);


    if (gasIndex < 0.25)
    {
        return "GOOD";
    }


    if (gasIndex < 0.50)
    {
        return "MODERATE";
    }


    if (gasIndex < 0.75)
    {
        return "HIGH";
    }


    return "DANGER";
}


// ============================================================
// OLED DISPLAY
// ============================================================

void drawOLED(
    float temperature,
    float humidity,
    int mq135Raw,
    int mq7Raw,
    float mq7AO,
    bool online,
    bool warming
)
{
    oled.clearBuffer();


    oled.setFont(
        u8g2_font_6x10_tf
    );


    // --------------------------------------------------------
    // Header
    // --------------------------------------------------------

    oled.drawStr(
        0,
        9,
        "AIRGUARD AI"
    );


    if (warming)
    {
        // ----------------------------------------------------
        // Warm-up screen
        // ----------------------------------------------------

        oled.drawStr(
            0,
            21,
            "Sensor warm-up"
        );


        unsigned long elapsed =
            millis() - bootTime;


        unsigned long remaining = 0;


        if (elapsed < STARTUP_WARMUP_MS)
        {
            remaining =
                (STARTUP_WARMUP_MS - elapsed) / 1000;
        }


        char line[32];


        snprintf(
            line,
            sizeof(line),
            "Wait: %lus",
            remaining
        );


        oled.drawStr(
            0,
            34,
            line
        );
    }
    else
    {
        // ----------------------------------------------------
        // Temperature / humidity
        // ----------------------------------------------------

        char line[32];


        snprintf(
            line,
            sizeof(line),
            "T: %.1f C H: %.1f%%",
            temperature,
            humidity
        );


        oled.drawStr(
            0,
            20,
            line
        );


        // ----------------------------------------------------
        // MQ135
        // ----------------------------------------------------

        snprintf(
            line,
            sizeof(line),
            "MQ135: %d",
            mq135Raw
        );


        oled.drawStr(
            0,
            31,
            line
        );


        // ----------------------------------------------------
        // MQ7
        // ----------------------------------------------------

        snprintf(
            line,
            sizeof(line),
            "MQ7:%d %.2fV",
            mq7Raw,
            mq7AO
        );


        oled.drawStr(
            0,
            42,
            line
        );


        // ----------------------------------------------------
        // Status
        // ----------------------------------------------------

        String status =
            localStatus(
                mq135Raw,
                mq7Raw
            );


        oled.drawStr(
            0,
            54,
            status.c_str()
        );
    }


    // --------------------------------------------------------
    // Network status
    // --------------------------------------------------------

    if (online)
    {
        oled.drawStr(
            80,
            9,
            "ONLINE"
        );
    }
    else
    {
        oled.drawStr(
            80,
            9,
            "OFF"
        );
    }


    oled.sendBuffer();
}


// ============================================================
// SEND DATA TO NODE BACKEND
// ============================================================

bool postSensorData(
    float temperature,
    float humidity,
    int mq135Raw,
    int mq135Mv,
    int mq7Raw,
    int mq7Mv,
    float mq7AO
)
{
    // --------------------------------------------------------
    // Check WiFi
    // --------------------------------------------------------

    if (WiFi.status() != WL_CONNECTED)
    {
        return false;
    }


    HTTPClient http;


    http.setConnectTimeout(2500);

    http.setTimeout(4000);


    // --------------------------------------------------------
    // Connect backend
    // --------------------------------------------------------

    if (!http.begin(SERVER_URL))
    {
        Serial.println(
            "HTTP begin failed"
        );

        return false;
    }


    http.addHeader(
        "Content-Type",
        "application/json"
    );


    // --------------------------------------------------------
    // Create JSON
    // --------------------------------------------------------

    String payload = "{";


    payload +=
        "\"deviceId\":\"" +
        String(DEVICE_ID) +
        "\",";


    payload +=
        "\"location\":\"" +
        String(LOCATION) +
        "\",";


    payload +=
        "\"temperature\":" +
        String(temperature, 2) +
        ",";


    payload +=
        "\"humidity\":" +
        String(humidity, 2) +
        ",";


    payload +=
        "\"mq135\":" +
        String(mq135Raw) +
        ",";


    payload +=
        "\"mq135VoltageMv\":" +
        String(mq135Mv) +
        ",";


    payload +=
        "\"co\":" +
        String(mq7Raw) +
        ",";


    payload +=
        "\"mq7VoltageMv\":" +
        String(mq7Mv) +
        ",";


    payload +=
        "\"mq7AO\":" +
        String(mq7AO, 3);


    payload += "}";


    // --------------------------------------------------------
    // Serial debugging
    // --------------------------------------------------------

    Serial.println();

    Serial.println(
        "================================"
    );

    Serial.println(
        "      AIRGUARD AI SENSOR"
    );

    Serial.println(
        "================================"
    );


    Serial.printf(
        "Temperature : %.2f C\n",
        temperature
    );


    Serial.printf(
        "Humidity    : %.2f %%\n",
        humidity
    );


    Serial.printf(
        "MQ135 raw   : %d\n",
        mq135Raw
    );


    Serial.printf(
        "MQ135 mV    : %d\n",
        mq135Mv
    );


    Serial.printf(
        "MQ7 raw     : %d\n",
        mq7Raw
    );


    Serial.printf(
        "MQ7 mV      : %d\n",
        mq7Mv
    );


    Serial.printf(
        "MQ7 AO      : %.3f V\n",
        mq7AO
    );


    Serial.println(
        "--------------------------------"
    );


    Serial.println(
        "JSON:"
    );


    Serial.println(
        payload
    );


    // --------------------------------------------------------
    // POST
    // --------------------------------------------------------

    int httpCode =
        http.POST(payload);


    Serial.printf(
        "HTTP Code   : %d\n",
        httpCode
    );


    // --------------------------------------------------------
    // Backend response
    // --------------------------------------------------------

    if (httpCode > 0)
    {
        String response =
            http.getString();


        Serial.println(
            "Backend:"
        );


        Serial.println(
            response
        );
    }
    else
    {
        Serial.println(
            "HTTP request failed"
        );
    }


    http.end();


    // --------------------------------------------------------
    // Success
    // --------------------------------------------------------

    return (
        httpCode >= 200 &&
        httpCode < 300
    );
}


// ============================================================
// CONNECT WIFI
// ============================================================

void connectWiFi()
{
    WiFi.mode(
        WIFI_STA
    );


    // Keep connection responsive.
    WiFi.setSleep(false);


    WiFi.begin(
        WIFI_SSID,
        WIFI_PASSWORD
    );


    Serial.print(
        "Connecting WiFi"
    );


    unsigned long start =
        millis();


    while (
        WiFi.status() != WL_CONNECTED &&
        millis() - start < 15000
    )
    {
        delay(500);

        Serial.print(".");
    }


    Serial.println();


    // --------------------------------------------------------
    // Connected
    // --------------------------------------------------------

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println(
            "WiFi connected!"
        );


        Serial.print(
            "ESP32 IP: "
        );


        Serial.println(
            WiFi.localIP()
        );


        Serial.print(
            "RSSI: "
        );


        Serial.println(
            WiFi.RSSI()
        );
    }
    else
    {
        Serial.println(
            "WiFi connection failed."
        );
    }
}


// ============================================================
// SETUP
// ============================================================

void setup()
{
    Serial.begin(
        115200
    );


    delay(1000);


    bootTime =
        millis();


    // --------------------------------------------------------
    // ESP32-S3 ADC
    // --------------------------------------------------------

    analogReadResolution(
        12
    );


    analogSetPinAttenuation(
        MQ135_PIN,
        ADC_11db
    );


    analogSetPinAttenuation(
        MQ7_PIN,
        ADC_11db
    );


    // --------------------------------------------------------
    // OLED
    // --------------------------------------------------------

    Wire.begin(
        OLED_SDA,
        OLED_SCL
    );


    oled.begin();


    oled.clearBuffer();


    oled.setFont(
        u8g2_font_6x10_tf
    );


    oled.drawStr(
        0,
        12,
        "AIRGUARD AI"
    );


    oled.drawStr(
        0,
        28,
        "Starting..."
    );


    oled.drawStr(
        0,
        44,
        "Sensor warm-up"
    );


    oled.drawStr(
        0,
        58,
        "Please wait 30s"
    );


    oled.sendBuffer();


    // --------------------------------------------------------
    // DHT
    // --------------------------------------------------------

    dht.begin();


    // --------------------------------------------------------
    // WiFi
    // --------------------------------------------------------

    connectWiFi();


    // --------------------------------------------------------
    // Serial information
    // --------------------------------------------------------

    Serial.println();


    Serial.println(
        "========================================"
    );


    Serial.println(
        " AIRGUARD AI - PHASE 2"
    );


    Serial.println(
        " ESP32 SENSOR SYSTEM"
    );


    Serial.println(
        "========================================"
    );


    Serial.println(
        "DHT11      -> GPIO7"
    );


    Serial.println(
        "MQ135 AO   -> GPIO4"
    );


    Serial.println(
        "MQ7 AO     -> GPIO5"
    );


    Serial.println(
        "OLED SDA   -> GPIO8"
    );


    Serial.println(
        "OLED SCL   -> GPIO9"
    );


    Serial.println();


    Serial.println(
        "WARNING:"
    );


    Serial.println(
        "MQ135 AO voltage has not been"
    );


    Serial.println(
        "verified with a multimeter."
    );
}


// ============================================================
// LOOP
// ============================================================

void loop()
{
    // --------------------------------------------------------
    // Sensor warm-up
    // --------------------------------------------------------

    bool warming =
        (
            millis() - bootTime
            <
            STARTUP_WARMUP_MS
        );


    if (warming)
    {
        drawOLED(
            0,
            0,
            0,
            0,
            0,
            WiFi.status() == WL_CONNECTED,
            true
        );


        delay(1000);


        return;
    }


    // --------------------------------------------------------
    // Send every 5 seconds
    // --------------------------------------------------------

    if (
        millis() - lastSend
        <
        SEND_INTERVAL_MS
    )
    {
        delay(50);

        return;
    }


    lastSend =
        millis();


    // --------------------------------------------------------
    // Reconnect WiFi if needed
    // --------------------------------------------------------

    if (
        WiFi.status() != WL_CONNECTED
    )
    {
        Serial.println(
            "WiFi disconnected."
        );


        connectWiFi();
    }


    // --------------------------------------------------------
    // Read DHT11
    // --------------------------------------------------------

    float temperature =
        dht.readTemperature();


    float humidity =
        dht.readHumidity();


    if (
        isnan(temperature) ||
        isnan(humidity)
    )
    {
        Serial.println(
            "DHT11 read failed."
        );


        drawOLED(
            0,
            0,
            0,
            0,
            0,
            WiFi.status() == WL_CONNECTED,
            false
        );


        return;
    }


    // --------------------------------------------------------
    // MQ-135
    // --------------------------------------------------------

    int mq135Raw =
        readStableRaw(
            MQ135_PIN,
            15
        );


    uint32_t mq135Mv =
        readStableMilliVolts(
            MQ135_PIN,
            7
        );


    // --------------------------------------------------------
    // MQ-7
    // --------------------------------------------------------

    int mq7Raw =
        readStableRaw(
            MQ7_PIN,
            15
        );


    uint32_t mq7Mv =
        readStableMilliVolts(
            MQ7_PIN,
            7
        );


    // --------------------------------------------------------
    // Reconstruct MQ-7 original AO voltage
    // --------------------------------------------------------

    float mq7DividerVoltage =
        mq7Mv / 1000.0;


    float mq7AO =
        mq7DividerVoltage *
        MQ7_DIVIDER_RATIO;


    // --------------------------------------------------------
    // Send backend
    // --------------------------------------------------------

    bool online =
        postSensorData(
            temperature,
            humidity,
            mq135Raw,
            (int)mq135Mv,
            mq7Raw,
            (int)mq7Mv,
            mq7AO
        );


    // --------------------------------------------------------
    // OLED
    // --------------------------------------------------------

    drawOLED(
        temperature,
        humidity,
        mq135Raw,
        mq7Raw,
        mq7AO,
        online,
        false
    );
}