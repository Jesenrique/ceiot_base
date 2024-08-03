#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_wifi.h"
#include "nvs_flash.h"

#define EXAMPLE_WIFI_SSID "Jerez Jerez" // Cambia esto por el SSID de la red que quieres conectar
#define EXAMPLE_WIFI_PASS "2312Ijerez" // Cambia esto por la contraseña de la red que quieres conectar

static const char *TAG = "wifi_example";

void wifi_scan_task(void *pvParameters) {
    uint16_t num_ap = 0;
    wifi_ap_record_t ap_info[20];

    ESP_ERROR_CHECK(esp_wifi_scan_start(NULL, true));

    ESP_ERROR_CHECK(esp_wifi_scan_get_ap_records(&num_ap, ap_info));
    ESP_LOGI(TAG, "Total APs scanned = %u", num_ap);

    for (int i = 0; i < num_ap; i++) {
        ESP_LOGI(TAG, "SSID \t\t%s", ap_info[i].ssid);
        ESP_LOGI(TAG, "RSSI \t\t%d", ap_info[i].rssi);
        ESP_LOGI(TAG, "-----------------------------------");
    }

    // Ejemplo de cómo seleccionar la red manualmente (aquí se usa el SSID directo, puedes adaptar esto)
    ESP_ERROR_CHECK(esp_wifi_disconnect());
    wifi_config_t wifi_config = {
        .sta = {
            .ssid = EXAMPLE_WIFI_SSID,
            .password = EXAMPLE_WIFI_PASS,
        },
    };
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_connect());

    ESP_LOGI(TAG, "Connecting to %s...", EXAMPLE_WIFI_SSID);

    while (true) {
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}

void app_main(void) {
    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));

    xTaskCreate(&wifi_scan_task, "wifi_scan_task", 4096, NULL, 5, NULL);
}
