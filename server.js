const express = require("express");
const connectMongoDB = require("./config/mongodb");
const port = 8080 || process.env.PORT;
var admin = require("firebase-admin");
var serviceAccount = require("./config/serviceAccountKey.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});
connectMongoDB();

const app = express();

app.use(express.json());

app.use("/api/users", require("./routes/api/users"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/ride", require("./routes/api/ride"));
app.use("/api/suggest", require("./routes/api/suggestUser"));

app.get("/", res => {
	res.send("RideAlong API");
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
