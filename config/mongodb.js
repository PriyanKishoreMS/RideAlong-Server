const mongoose = require("mongoose");
require("dotenv").config();
const db = process.env.MONGO_URI;

const connectMongoDB = async () => {
	try {
		await mongoose.connect(db, {
			useNewUrlParser: true,
		});
		console.log("MongoDB Connected...");
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
};

module.exports = connectMongoDB;
