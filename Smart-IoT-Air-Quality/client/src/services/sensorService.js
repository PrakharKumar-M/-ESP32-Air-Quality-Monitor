import API from "./api";

export const getSensorData = async (deviceId = "ESP32-001", limit = 100) => {
  try {
    const response = await API.get("/sensors", {
      params: {
        deviceId,
        limit,
      },
    });

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "Sensor API Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};