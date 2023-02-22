const express = require("express");
const router = express.Router();
const Profile = require("../../models/Profile");
const Ride = require("../../models/Ride");
const User = require("../../models/User");
const auth = require("../../middleware/auth");

// @route   POST api/profile/
// @desc    Create or update user profile
// @access  Private

router.post("/", auth, async (req, res) => {
	const ProfileFields = {};
	ProfileFields.user = req.user.id;

	const standardFields = [
		"name",
		"dob",
		"location",
		"mobile",
		"college",
		"vehicleType",
		"vehicleNumber",
		"vehicleModel",
	];

	standardFields.forEach(field => {
		if (req.body[field]) ProfileFields[field] = req.body[field];
	});

	try {
		let profile = await Profile.findOne({ user: req.user.id });

		if (profile) {
			profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: ProfileFields },
				{ new: true }
			);

			return res.json(profile);
		}

		profile = new Profile(ProfileFields);

		await profile.save();
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/profile/check
// @desc    Check if profile exists
// @access  Private

router.get("/check", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id,
		});

		if (profile) {
			res.status(200).json({ msg: "Profile exists" });
		} else {
			res.status(404).json({ msg: "Profile not found" });
		}
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private

router.get("/me", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id,
		})
			.populate("user", ["name", "photoURL"])
			.select("vehicleType vehicleNumber vehicleModel");
		console.log(profile, "profile from profile/me");

		if (!profile) {
			return res.status(400).json({ msg: "Profile not found" });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/profile/:id
// @desc    Get profile by user ID
// @access  Public

router.get("/:id", async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.id,
		})
			.select("college location mobile")
			.populate("user", ["name", "photoURL", "email"]);

		const followers = await User.findById(req.params.id).select("followers");
		const following = await User.findById(req.params.id).select("following");

		const followingCount = following.following.length;
		const followersCount = followers.followers.length;

		const rides = await Ride.find({ user: req.params.id }).sort({ date: 1 });

		if (!profile) {
			return res.status(400).json({ msg: "Profile not found" });
		}

		const response = {
			profile,
			rides,
			followers,
			followingCount,
			followersCount,
		};

		res.json(response);
	} catch (err) {
		console.error(err.message);
		if (err.kind == "ObjectId") {
			return res.status(400).json({ msg: "Profile not found" });
		}
		res.status(500).send("Server Error");
	}
});

module.exports = router;
