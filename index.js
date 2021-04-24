require("dotenv").config();

var bodyParser = require("body-parser");
var dotenv = require('dotenv').config();
const express = require("express");
const app = express();

app.use(express.json());
const auth = require("./routes/Auth");
const transaction = require("./routes/Transactions");

app.use("/auth", auth)
app.use("/purchase", transaction)

app.set("port", process.env.PORT || 5000);
const server = app.listen(app.get("port"), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
