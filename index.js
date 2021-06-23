const stress = require("./main");
require('dotenv').config();
stress.start(
    process.env.BBB_URL,
    process.env.BBB_TEST_DURATION,
    parseInt(process.env.BBB_CLIENTS_WEBCAM),
    parseInt(process.env.BBB_CLIENTS_MIC),
    parseInt(process.env.BBB_CLIENTS_LISTEN_ONLY),
)