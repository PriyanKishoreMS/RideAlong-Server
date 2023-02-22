const Graph = require("graphology");
const pagerank = require("graphology-pagerank");
const User = require("../../models/User");
const router = require("express").Router();
const auth = require("../../middleware/auth");

const graph = new Graph({ directed: true });

/* 
-> The following code was used to generate the graph and the pagerank scores.
-> This method of generating the graph is not scalable, this is just to test the algorithm
-> The app however uses the neo4j graph database to generate the graph and the pagerank scores.
*/
router.get("/", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		const following = user.following;
		const data = {};
		for (const element of following) {
			const followingUser = await User.findById(element);
			const followingUserFollowing = followingUser.following;
			data[element] = {};
			for (const followingId of followingUserFollowing) {
				data[element][followingId] = {};
			}
		}
		console.log(data);
		for (const userId in data) {
			if (!graph.hasNode(userId)) graph.addNode(userId, data[userId]);
			for (const followingId in data[userId]) {
				if (!graph.hasNode(followingId))
					graph.addNode(followingId, data[followingId]);
			}
		}

		for (const userId in data) {
			for (const followingId in data[userId]) {
				if (graph.hasNode(followingId)) {
					graph.addEdge(userId, followingId);
				}
			}
		}

		const scores = pagerank(graph, {
			alpha: 0.85, // Damping factor, default is 0.85
			maxIterations: 100, // Maximum number of iterations, default is 100
			tolerance: 1e-5, // Tolerance, default is 1e-5
		});
		console.log(scores);
		const suggestions = [];
		for (const userId in scores) {
			if (!following.includes(userId)) {
				const user = await User.findById(userId).select("name photoURL");
				suggestions.push({ user, score: scores[userId] });
			}
		}
		suggestions.sort((a, b) => b.score - a.score);
		res.json(suggestions);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

module.exports = router;
