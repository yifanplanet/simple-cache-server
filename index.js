const express = require("express");
const objectRoute = require("./routes/object");
const app = express();

app.use(express.json())
app.use("/object", objectRoute)

app.listen(5000, () => {
    console.log("Cache server is running");
});