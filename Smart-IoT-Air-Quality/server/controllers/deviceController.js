const Device = require("../models/Device");

// Get All Devices
const getDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });

    res.json(devices);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Add Device
const addDevice = async (req, res) => {
  try {
    const device = await Device.create(req.body);

    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const updateHeartbeat = async (req, res) => {

    try {

        const { deviceId } = req.body;

        const device = await Device.findOneAndUpdate(

            { deviceId },

            {
                status: "Online",
                lastSeen: new Date()
            },

            { new: true }

        );

        res.json(device);

    }

    catch(error){

        res.status(500).json({
            message:error.message
        });

    }

};
module.exports = {
  getDevices,
  addDevice,
   updateHeartbeat,
};