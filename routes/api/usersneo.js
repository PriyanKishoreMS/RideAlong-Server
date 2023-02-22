const express = require("express");
const router = express.Router();
const User = require("../../models/User");
require("dotenv").config();
const secret = process.env.JWT_SECRET;
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const auth = require("../../middleware/auth");
const session = require("../../config/neo4jdb.js");
const neo4j = require("neo4j-driver");

try {
	admin.app();
	console.log("Firebase Admin SDK has been initialized");
} catch (error) {
	console.log("Firebase Admin SDK has not been initialized");
}

// @route   GET api/users
// @desc    Get all users
// @access  Private
router.get("/", auth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) - 1 || 0;
		const limit = parseInt(req.query.limit) || 15;
		const search = req.query.search || "";

		const result = await session.run(
			"MATCH (u:USER) WHERE toLower(u.name) CONTAINS toLower($search) RETURN u SKIP $skip LIMIT $limit",
			{
				search: search,
				skip: neo4j.int(page * limit),
				limit: neo4j.int(limit),
			}
		);

		const total = await session.run(
			"MATCH (u:USER) WHERE toLower(u.name) CONTAINS toLower($search) RETURN count(u)",
			{
				search: search,
			}
		);

		const totalPages = Math.ceil(total.records[0]._fields[0].low / limit);

		const user = result.records.map(record => {
			return record.get(0).properties;
		});

		const response = {
			page: page + 1,
			user,
			totalPages,
		};

		res.status(200).json(response);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/users/me
// @desc    Get my user details
// @access  Private
router.get("/me", auth, async (req, res) => {
	try {
		console.log(req.user.id);
		const user = await User.findById(req.user.id).select("email");
		const following = await session.run(
			"MATCH (u:USER)-[r:FOLLOWS]->(f:USER) WHERE u.id = $id RETURN f",
			{
				id: req.user.id,
			}
		);
		const followers = await session.run(
			"MATCH (u:USER)<-[r:FOLLOWS]-(f:USER) WHERE u.id = $id RETURN f",
			{
				id: req.user.id,
			}
		);

		const followingList = following.records.map(record => {
			return record.get(0).properties.id;
		});

		const followersList = followers.records.map(record => {
			return record.get(0).properties.id;
		});

		const usernode = await session.run(
			"MATCH (u:USER) WHERE u.id = $id RETURN u",
			{
				id: req.user.id,
			}
		);

		const response = {
			// user,
			following: followingList,
			followers: followersList,
			name: usernode.records[0]._fields[0].properties.name,
			photoURL: usernode.records[0]._fields[0].properties.photoURL,
			id: usernode.records[0]._fields[0].properties.id,
		};
		res.json(response);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   POST api/users
// @desc    Create or update user
// @access  Public
router.post("/", async (req, res) => {
	const { uid, name, email, photoURL, fcmtoken } = req.body;

	// const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9._%+-]+\.hindustanuniv\.ac\.in$/i;

	// if (!emailRegex.test(email)) {
	//   return res.status(400).json({msg: 'Please use your HU email'});
	// }

	try {
		let user = await User.findOne({ email });

		if (user) {
			console.log("User already exists");
			if (user.fcmtoken.indexOf(fcmtoken) === -1) {
				user.fcmtoken.push(fcmtoken);
				await user.save();
				console.log("FCMToken added");
			}
			if (uid !== user.uid) {
				user.uid = uid;
				await user.save();
				console.log("uid updated");
			}
			// if (user.photoURL !== photoURL) {
			// 	user.photoURL = photoURL;
			// 	await user.save();
			// 	console.log("photoURL updated");
			// }
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(payload, secret, {}, (err, token) => {
				if (err) throw err;
				res.json({ token });
				console.log(payload);
				console.log(token);
			});
		} else {
			user = new User({
				uid,
				// name,
				email,
				// photoURL,
			});

			await user.save();
			session
				.run("CREATE (user:USER {id: $id, name: $name, photoURL: $photoURL})", {
					id: user.id,
					name: name,
					photoURL: photoURL,
				})
				.then(function (result) {
					if (result) {
						console.log("User created in Neo4j");
					} else console.log("User not created in Neo4j");
				});

			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(payload, secret, {}, (err, token) => {
				if (err) throw err;
				res.json({ token });
			});
		}
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

// @route  DELETE api/users/me/fcm
// @desc   Delete FCM token when user logs out
// @access Private
router.delete("/me/fcm", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		user.fcmtoken = [];
		await user.save();
		res.status(200).json({ msg: "FCMToken removed" });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/users/me/following
// @desc    Get list of users I follow
// @access  Private
router.get("/me/following", auth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) - 1 || 0;
		const limit = parseInt(req.query.limit) || 15;

		const following = await session.run(
			"MATCH (a:USER)-[:FOLLOW]->(b:USER) WHERE a.id = $id RETURN b SKIP $skip LIMIT $limit",
			{
				id: req.user.id,
				skip: neo4j.int(page * limit),
				limit: neo4j.int(limit),
			}
		);
		const followingProfiles = following.records.map(record => {
			return record.get(0).properties;
		});

		const total = await session.run(
			"MATCH (a:USER)-[:FOLLOW]->(b:USER) WHERE a.id = $id RETURN count(b)",
			{
				id: req.user.id,
			}
		);

		const totalPages = Math.ceil(total.records[0].get(0).low / limit);

		res.json({ followingProfiles, totalPages });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/users/me/followers
// @desc    Get list of users following me
// @access  Private
router.get("/me/followers", auth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) - 1 || 0;
		const limit = parseInt(req.query.limit) || 15;

		const followers = await session.run(
			"MATCH (a:USER)<-[:FOLLOW]-(b:USER) WHERE a.id = $id RETURN b SKIP $skip LIMIT $limit",
			{
				id: req.user.id,
				skip: neo4j.int(page * limit),
				limit: neo4j.int(limit),
			}
		);

		const followersProfiles = followers.records.map(record => {
			return record.get(0).properties;
		});

		const total = await session.run(
			"MATCH (a:USER)<-[:FOLLOW]-(b:USER) WHERE a.id = $id RETURN count(b)",
			{
				id: req.user.id,
			}
		);

		const totalPages = Math.ceil(total.records[0].get(0).low / limit);

		res.json({ followersProfiles, totalPages });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/users/:id/following
// @desc    Get the list of users a user follows
// @access  Private
router.get("/:id/following", auth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) - 1 || 0;
		const limit = parseInt(req.query.limit) || 15;

		const following = await session.run(
			"MATCH (a:USER)-[:FOLLOW]->(b:USER) WHERE a.id = $id RETURN b SKIP $skip LIMIT $limit",
			{
				id: req.params.id,
				skip: neo4j.int(page * limit),
				limit: neo4j.int(limit),
			}
		);

		const total = await session.run(
			"MATCH (a:USER)-[:FOLLOW]->(b:USER) WHERE a.id = $id RETURN count(b)",
			{
				id: req.params.id,
			}
		);

		const followingProfiles = following.records.map(record => {
			return record.get(0).properties;
		});

		const totalPages = Math.ceil(total.records[0].get(0).low / limit);

		res.json({ followingProfiles, totalPages });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/users/:id/followers
// @desc    Get the list of users following a user
// @access  Private
router.get("/:id/followers", auth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) - 1 || 0;
		const limit = parseInt(req.query.limit) || 15;

		const followers = await session.run(
			"MATCH (a:USER)<-[:FOLLOW]-(b:USER) WHERE a.id = $id RETURN b SKIP $skip LIMIT $limit",
			{
				id: req.params.id,
				skip: neo4j.int(page * limit),
				limit: neo4j.int(limit),
			}
		);

		const total = await session.run(
			"MATCH (a:USER)<-[:FOLLOW]-(b:USER) WHERE a.id = $id RETURN count(b)",
			{
				id: req.params.id,
			}
		);

		const followersProfiles = followers.records.map(record => {
			return record.get(0).properties;
		});

		const totalPages = Math.ceil(total.records[0].get(0).low / limit);

		res.json({ followersProfiles, totalPages });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   PUT api/users/me/home
// @desc    Add current user's home address
// @access  Private
router.put("/me/home", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		const { lat, lng, desc } = req.body;
		const home = {
			lat,
			lng,
			desc,
		};
		if (!home) {
			return res.status(400).json({ msg: "Please enter a home address" });
		}
		user.home = home;
		await user.save();
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   PUT api/users/me/work
// @desc    Add current user's work address
// @access  Private
router.put("/me/work", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		const { lat, lng, desc } = req.body;
		const work = {
			lat,
			lng,
			desc,
		};
		if (!work) {
			return res.status(400).json({ msg: "Please enter a work address" });
		}
		user.work = work;
		await user.save();
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   PATCH api/users/friend/:id
// @desc    Follow or unfollow a user
// @access  Private
router.post("/friend/:id", auth, async (req, res) => {
	try {
		const profile = await session.run("MATCH (u:USER {id: $id}) RETURN u", {
			id: req.user.id,
		});
		const friendProfile = await session.run(
			"MATCH (u:USER {id: $id}) RETURN u",
			{
				id: req.params.id,
			}
		);

		if (
			profile.records[0]._fields[0].properties.id ==
			friendProfile.records[0]._fields[0].properties.id
		) {
			return res
				.status(400)
				.json({ msg: "You cannot add yourself as a friend" });
		}

		if (!friendProfile.records[0]._fields[0].properties) {
			return res.status(400).json({ msg: "There is no profile for this user" });
		}

		const relation = await session.run(
			"MATCH (u:USER {id: $id})-[r]->(u2:USER {id: $id2}) RETURN r",
			{
				id: req.user.id,
				id2: req.params.id,
			}
		);

		if (relation.records.length > 0) {
			await session.run(
				"MATCH (u:USER {id: $id})-[r]->(u2:USER {id: $id2}) DELETE r",
				{
					id: req.user.id,
					id2: req.params.id,
				}
			);
			res.json({ msg: "Friend removed" });
		} else {
			const result = await session.run(
				"MATCH (u:USER {id: $id}), (u2:USER {id: $id2}) CREATE (u)-[:FOLLOW]->(u2) RETURN u, u2",
				{
					id: req.user.id,
					id2: req.params.id,
				}
			);
			res.json(result.records[0]._fields[1].properties);
		}
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/users/me/address
// @desc    Get current user's home and work address
// @access  Private
router.get("/me/address", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		const home = user.home;
		const work = user.work;
		const address = {
			home,
			work,
		};
		res.json(address);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

module.exports = router;
