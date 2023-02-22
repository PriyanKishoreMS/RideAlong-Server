const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Ride = require("../../models/Ride");
const InactiveRide = require("../../models/InactiveRide");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const cron = require("node-cron");
require("dotenv").config();

// @route   POST api/ride/
// @desc    Create or update user ride
// @access  Private
router.post("/", auth, async (req, res) => {
	const RideFields = {};
	RideFields.user = req.user.id;

	const standardFields = [
		"source",
		"destination",
		"distance",
		"travelTime",
		"sourceLat",
		"sourceLng",
		"destinationLat",
		"destinationLng",
		"timestamp",
		"seats",
		"price",
		"vehicleType",
		"vehicleNumber",
		"vehicleModel",
	];

	standardFields.forEach(field => {
		if (req.body[field]) RideFields[field] = req.body[field];
	});

	try {
		let ride = await Ride.findOne({ user: req.user.id });
		ride = new Ride(RideFields);
		await ride.save();

		await User.findOneAndUpdate(
			{ _id: req.user.id },
			{ $push: { ridesCreated: ride._id } },
			{ new: true }
		);
		res.json(ride);

		// fcm (firebase cloud messaging) token retrieved for push notifications
		const followerTokens = await User.find({
			following: req.user.id,
		}).select("fcmtoken");
		console.log(followerTokens);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/ride/
// @desc    Get all rides
// @access  Public
router.get("/", async (req, res) => {
	try {
		const page = parseInt(req.query.page) - 1 || 0;
		const limit = parseInt(req.query.limit) || 5;
		const search = req.query.search || "";

		const rides = await Ride.find({
			$or: [
				{ source: { $regex: search, $options: "i" } },
				{ destination: { $regex: search, $options: "i" } },
			],
		})
			.select(
				"vehicleType price seats source destination distance travelTime timestamp user"
			)
			.sort({ timestamp: 1 })
			.skip(page * limit)
			.limit(limit)
			.populate("user", ["name", "photoURL"]);

		const total = await Ride.countDocuments({
			$or: [
				{ source: { $regex: search, $options: "i" } },
				{ destination: { $regex: search, $options: "i" } },
			],
		});
		const totalPages = Math.ceil(total / limit);
		res.json({ rides, totalPages });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/ride/me
// @desc    Get all rides of a user (created and joined)
// @access  Private
router.get("/me", auth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) - 1 || 0;
		const limit = parseInt(req.query.limit) || 5;
		const user = await User.findById(req.user.id);

		const ridesCreatedArray = [];
		const ridesJoinedArray = [];

		user.ridesCreated.map(ride => {
			mongoose.Types.ObjectId(ride);
			ridesCreatedArray.push(ride);
		});

		user.ridesJoined.map(ride => {
			mongoose.Types.ObjectId(ride);
			ridesJoinedArray.push(ride);
		});

		const rides = await Ride.find({
			$or: [
				{ _id: { $in: ridesCreatedArray } },
				{ _id: { $in: ridesJoinedArray } },
			],
		})
			.select(
				"vehicleType price seats source destination distance travelTime timestamp user"
			)
			.sort({ timestamp: 1 })
			.populate("user", ["name", "photoURL"])
			.skip(Math.abs(page) * limit)
			.limit(limit);

		const total = await Ride.countDocuments({
			$or: [
				{ _id: { $in: ridesCreatedArray } },
				{ _id: { $in: ridesJoinedArray } },
			],
		});
		const totalPages = Math.ceil(total / limit);

		res.json({ rides, totalPages });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/ride/me/inactive
// @desc    Get all inactive rides of a user (created and joined)
// @access  Private
router.get("/me/inactive", auth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) - 1 || 0;
		const limit = parseInt(req.query.limit) || 5;

		const user = await User.findById(req.user.id);

		const ridesCreatedArray = [];
		const ridesJoinedArray = [];

		user.ridesCreatedInactive.map(ride => {
			mongoose.Types.ObjectId(ride);
			ridesCreatedArray.push(ride);
		});

		user.ridesJoinedInactive.map(ride => {
			mongoose.Types.ObjectId(ride);
			ridesJoinedArray.push(ride);
		});

		const rides = await InactiveRide.find({
			$or: [
				{ _id: { $in: ridesCreatedArray } },
				{ _id: { $in: ridesJoinedArray } },
			],
		})
			.select(
				"vehicleType price seats source destination distance travelTime timestamp user"
			)
			.sort({ timestamp: -1 })
			.populate("user", ["name", "photoURL"])
			.skip(page * limit)
			.limit(limit);

		const total = await InactiveRide.countDocuments({
			$or: [
				{ _id: { $in: ridesCreatedArray } },
				{ _id: { $in: ridesJoinedArray } },
			],
		});
		const totalPages = Math.ceil(total / limit);

		res.json({ rides, totalPages });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/ride/following
// @desc    Get rides of users that the current user is following
// @access  Private
router.get("/following", auth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) - 1 || 0;
		const limit = parseInt(req.query.limit) || 10;

		const user = await User.findById(req.user.id);
		const following = user.following;
		const rides = await Ride.find({ user: { $in: following } })
			.sort({ date: 1 })
			.populate("user", ["name", "photoURL"])
			.skip(page * limit)
			.limit(limit);

		const total = await Ride.countDocuments({ user: { $in: following } });
		const totalPages = Math.ceil(total / limit);
		res.json({ rides, totalPages });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @desc   Cron job checks for rides that are completed and moves them to inactive rides collection and removes them from user's ridesCreated and ridesJoined arrays and updates the user's ridesCreatedInactive and ridesJoinedInactive arrays every 12 hours
cron.schedule("0 */12 * * *", async () => {
	try {
		const rides = await Ride.find({ timestamp: { $lt: Date.now() } });
		rides.forEach(async ride => {
			const inactiveride = new InactiveRide(ride);
			inactiveride.isNew = true;
			await inactiveride.save();
			ride.passengers.forEach(async passenger => {
				await User.findByIdAndUpdate(passenger.user, {
					$pull: { ridesJoined: ride._id },
					$push: { ridesJoinedInactive: ride._id },
				});
			});
			await User.findByIdAndUpdate(ride.user, {
				$pull: { ridesCreated: ride._id },
				$push: { ridesCreatedInactive: ride._id },
			});
			await Ride.findByIdAndRemove(ride._id);
		});
		console.log("Rides updated");
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/ride/:id
// @desc    Get ride by ID
// @access  Public
router.get("/:id", async (req, res) => {
	try {
		const ride = await Ride.findById(req.params.id).populate("user", [
			"name",
			"photoURL",
		]);
		if (!ride) {
			return res.status(404).json({ msg: "Ride not found" });
		}

		const passengers = ride.passengers;
		const passengerDetails = [];
		const requests = [];
		for (let i = 0; i < passengers.length; i++) {
			if (passengers[i].status === 2) {
				const passenger = await User.findById(passengers[i].user);
				passengerDetails.push({
					user: passenger._id,
					name: passenger.name,
					photoURL: passenger.photoURL,
				});
			} else if (passengers[i].status === 1) {
				const passenger = await User.findById(passengers[i].user);
				requests.push({
					user: passenger._id,
					name: passenger.name,
					photoURL: passenger.photoURL,
				});
			}
		}

		res.json({ ride, passengerDetails, requests });
	} catch (err) {
		console.error(err.message);
		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: "Ride not found" });
		}
		res.status(500).send("Server Error");
	}
});

// @route   PATCH api/ride/passenger/:id
// @desc    Request to join ride
// @access  Private
router.patch("/passenger/:id", auth, async (req, res) => {
	try {
		const ride = await Ride.findById(req.params.id);

		if (ride.user.toString() === req.user.id) {
			return res.status(400).json({ msg: "You cannot join your own ride" });
		}

		if (
			ride.passengers.filter(
				passenger => passenger.user.toString() === req.user.id
			).length > 0
		) {
			return res.status(400).json({
				msg: "User already requested to join ride",
			});
		}
		ride.passengers.push({ user: req.user.id, status: 1 });
		await ride.save();
		res.json(ride);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   PATCH api/ride/passenger/:id/:passengerId/accept
// @desc    Accept request to join ride
// @access  Private
router.patch("/passenger/:id/:passengerId/accept", auth, async (req, res) => {
	try {
		const ride = await Ride.findById(req.params.id);
		const user = await User.findById(req.params.passengerId);

		if (ride.seats === 0) {
			return res.status(400).json({
				msg: "No seats available",
			});
		}

		if (
			ride.passengers.filter(
				passenger => passenger.user.toString() === req.params.passengerId
			).length === 0
		) {
			return res.status(400).json({
				msg: "Request does not exist",
			});
		}

		const passengerIndex = ride.passengers
			.map(passenger => passenger.user.toString())
			.indexOf(req.params.passengerId);

		if (ride.passengers[passengerIndex].status === 2) {
			return res.status(400).json({
				msg: "Request already accepted",
			});
		}

		if (ride.passengers[passengerIndex].status === 1) {
			ride.passengers[passengerIndex].status = 2;
			ride.seats -= 1;
		}
		user.ridesJoined.push(ride._id);
		await ride.save();
		await user.save();
		res.json(ride);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   PATCH api/ride/passenger/:id/:passengerId/reject
// @desc    Reject request to join ride
// @access  Private
router.patch("/passenger/:id/:passengerId/reject", auth, async (req, res) => {
	try {
		const ride = await Ride.findById(req.params.id);
		const user = await User.findById(req.params.passengerId);
		const passengerIndex = ride.passengers
			.map(passenger => passenger.user.toString())
			.indexOf(req.params.passengerId);

		if (
			ride.passengers.filter(
				passenger => passenger.user.toString() === req.params.passengerId
			).length === 0
		) {
			return res.status(400).json({
				msg: "Request does not exist",
			});
		}

		if (ride.passengers[passengerIndex].status === 2) {
			ride.seats += 1;
		}
		ride.passengers.splice(passengerIndex, 1);
		user.ridesJoined.splice(user.ridesJoined.indexOf(ride._id), 1);
		await ride.save();
		await user.save();
		res.json(ride);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   DELETE api/ride/:id
// @desc    Delete ride
// @access  Private
router.delete("/:id", auth, async (req, res) => {
	try {
		const ride = await Ride.findById(req.params.id);
		if (!ride) {
			return res.status(404).json({ msg: "Ride not found" });
		}
		// check user
		if (ride.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User not authorized" });
		}
		ride.passengers.forEach(async passenger => {
			const user = await User.findById(passenger.user);
			user.ridesJoined.splice(user.ridesJoined.indexOf(ride._id), 1);
			await user.save();
		});
		const host = await User.findById(ride.user);
		host.ridesCreated.splice(host.ridesCreated.indexOf(ride._id), 1);
		await host.save();
		await ride.remove();
		res.json({ msg: "Ride removed" });
	} catch (err) {
		console.error(err.message);
		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: "Ride not found" });
		}
		res.status(500).send("Server Error");
	}
});

module.exports = router;
