const neo4j = require("neo4j-driver");
require("dotenv").config();
const db = process.env.NEO4J_URI;

const driver = neo4j.driver(db, neo4j.auth.basic("neo4j", "ridealong"));
driver
	.verifyConnectivity({ database: "ridealong" })
	.then(() => {
		console.log("Neo4j connected");
	})
	.catch(err => {
		console.log("Neo4j connection failed");
		console.log(err);
	});
const session = driver.session({ database: "ridealong" });

module.exports = session;
