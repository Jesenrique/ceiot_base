#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_wifi.h"
#include "nvs_flash.h"

static const char *TAG = "wifi_scan";

void scan_task(void *pvParameter) {
    esp_err_t ret;
    wifi_ap_record_t ap_info[20];
    uint16_t ap_count = 0;

    while (1) {
        // Inicia el escaneo de redes Wi-Fi
        ret = esp_wifi_scan_start(NULL, true);
        if (ret != ESP_OK) {
            ESP_LOGE(TAG, "Failed to start Wi-Fi scan: %s", esp_err_to_name(ret));
            vTaskDelay(10000 / portTICK_PERIOD_MS);
            continue;
        }

        // Espera a que termine el escaneo
        vTaskDelay(2000 / portTICK_PERIOD_MS);

        // Obtiene la información de las redes Wi-Fi encontradas
        ret = esp_wifi_scan_get_ap_records(&ap_count, ap_info);
        if (ret != ESP_OK) {
            ESP_LOGE(TAG, "Failed to get Wi-Fi scan results: %s", esp_err_to_name(ret));
            vTaskDelay(10000 / portTICK_PERIOD_MS);
            continue;
        }

        // Imprime la información de las redes Wi-Fi encontradas
        ESP_LOGI(TAG, "Number of networks found: %d", ap_count);
        for (int i = 0; i < ap_count; i++) {
            ESP_LOGI(TAG, "SSID: %s, RSSI: %d", ap_info[i].ssid, ap_info[i].rssi);
        }

        // Espera 10 segundos antes de realizar otro escaneo
        vTaskDelay(10000 / portTICK_PERIOD_MS);
    }
}

void app_main(void) {
    esp_err_t ret;

    // Inicializa el almacenamiento no volátil
    ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Inicializa el Wi-Fi
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    // Configura el Wi-Fi en modo de escaneo
    wifi_config_t wifi_config = {
        .sta = {
            .ssid = "",
            .password = "",
        },
    };
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config));

    // Inicializa el escaneo de redes Wi-Fi
    ESP_ERROR_CHECK(esp_wifi_start());

    // Crea la tarea de escaneo
    xTaskCreate(scan_task, "scan_task", 4096, NULL, 5, NULL);
}

