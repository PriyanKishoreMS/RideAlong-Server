const express = require("express");
const router = express.Router();
const User = require("../../models/User");
require("dotenv").config();
const secret = process.env.JWT_SECRET;
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const auth = require("../../middleware/auth");

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
		let sort = req.query.sort || "date";

		req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort]);

		let sortBy = {};
		if (sort[-1]) {
			sortBy[sort[0]] = sort[-1];
		} else {
			sortBy[sort[0]] = "desc";
		}

		const user = await User.find({
			name: { $regex: search, $options: "i" },
			_id: { $ne: req.user.id },
		})
			.select("name photoURL")
			.sort(sortBy)
			.skip(page * limit)
			.limit(limit);

		const total = await User.countDocuments({
			name: { $regex: search, $options: "i" },
		});
		const totalPages = Math.ceil(total / limit);

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
		const user = await User.findById(req.user.id).select(
			" -__v -uid -email -ridesCreated -ridesJoined -date"
		);
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   POST api/users
// @desc    Create or update user
// @access  Public
router.post("/", async (req, res) => {
	const { uid, name, email, photoURL } = req.body;

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
			if (user.photoURL !== photoURL) {
				user.photoURL = photoURL;
				await user.save();
				console.log("photoURL updated");
			}
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(payload, secret, {}, (err, token) => {
				if (err) throw err;
				res.json({ token });
				console.log(payload);
			});
		} else {
			user = new User({
				uid,
				name,
				email,
				photoURL,
			});

			await user.save();
			// res.send('User registered');

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
		// const { fcmtoken } = req.body;
		// await User.findByIdAndUpdate(
		// 	req.user.id,
		// 	{
		// 		$pull: { fcmtoken: fcmtoken },
		// 	},
		// 	err => {
		// 		if (err) console.error(err);
		// 		else console.log("FCMToken removed");
		// 	}
		// );
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
		const user = await User.findById(req.user.id);

		const following = user.following;

		const followingProfiles = await User.find({
			_id: { $in: following },
		})
			.select("name photoURL")
			.skip(page * limit)
			.limit(limit);

		const total = await User.countDocuments({
			_id: { $in: following },
		});
		const totalPages = Math.ceil(total / limit);

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
		const user = await User.findById(req.user.id);

		const followers = user.followers;

		const followersProfiles = await User.find({
			_id: { $in: followers },
		})
			.select("name photoURL")
			.skip(page * limit)
			.limit(limit);

		const total = await User.countDocuments({
			_id: { $in: followers },
		});
		const totalPages = Math.ceil(total / limit);

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
		const user = await User.findById(req.params.id);
		const following = user.following;

		const followingProfiles = await User.find({
			_id: { $in: following },
		})
			.select("name photoURL")
			.skip(page * limit)
			.limit(limit);

		const total = await User.countDocuments({
			_id: { $in: following },
		});
		const totalPages = Math.ceil(total / limit);

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
		const user = await User.findById(req.params.id);
		const followers = user.followers;

		const followersProfiles = await User.find({
			_id: { $in: followers },
		})
			.select("name photoURL")
			.skip(page * limit)
			.limit(limit);

		const total = await User.countDocuments({
			_id: { $in: followers },
		});
		const totalPages = Math.ceil(total / limit);

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
router.patch("/friend/:id", auth, async (req, res) => {
	try {
		const profile = await User.findById(req.user.id);
		const friendProfile = await User.findById(req.params.id);
		const fcmToken = friendProfile.fcmtoken;

		if (profile === friendProfile) {
			return res
				.status(400)
				.json({ msg: "You cannot add yourself as a friend" });
		}

		if (!friendProfile) {
			return res.status(400).json({ msg: "There is no profile for this user" });
		}

		if (profile.following.includes(req.params.id)) {
			profile.following = profile.following.filter(
				following => following != req.params.id
			);
			friendProfile.followers = friendProfile.followers.filter(
				follower => follower != req.user.id
			);

			await profile.save();
			await friendProfile.save();
			res.json(profile.following);
		} else {
			profile.following.push(req.params.id);
			friendProfile.followers.push(req.user.id);
			await profile.save();
			await friendProfile.save();
			res.json(profile.following);

			const verifyToken = async token => {
				const message = {
					notification: {
						title: `${profile.name} has added you as a friend`,
						body: `Tap to view ${profile.name}'s profile`,
					},
					data: {
						picture: profile.photoURL,
					},
					token: token,
				};
				const response = await admin.messaging().send(message);
				return response;
			};

			for (let i = 0; i < fcmToken.length; i++) {
				try {
					await verifyToken(fcmToken[i]);
					console.log("Message sent successfully");
				} catch (err) {
					if (
						err.code === "messaging/registration-token-not-registered" ||
						err.code === "messaging/invalid-argument"
					) {
						console.log("Token is invalid");
						friendProfile.fcmtoken = friendProfile.fcmtoken.filter(
							token => token != fcmToken[i]
						);
						await friendProfile.save();
						console.log("Token removed");
					}
				}
			}
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
