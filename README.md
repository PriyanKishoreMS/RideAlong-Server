# RideAlong

A Community focused car-pooling application - Connect with people, create and join rides within your community/Institute!

![RideAlong Poster](https://user-images.githubusercontent.com/80768547/221419985-1fa00c05-8b2d-447c-99af-d28bfa1307ba.png)

`Note: The app is not deployed yet`

## Code Structure

The code is structured as follows:

- `config`: Configuration files for connecting to the MongoDB and Neo4j databases.
- `middleware`: Middleware functions used by the server for authentication.
- `models`: Mongoose models for the MongoDB database.
- `routes/api`: API routes for the server.

### Database Integration

The Ridealong application features a follow system that enables users to connect with each other within the app. At first, this system was implemented using MongoDB, but as I continued to develop the application, I realized that it needed to scale and become more efficient. As a result, I decided to shift the feature to a Neo4j graph database.

To showcase both scenarios, I created two different files in the `models` and `routes/api` directories. The `users.js` file uses MongoDB to implement the follow feature, while the `usersneo.js` file uses Neo4j. Additionally, the models directory has two different schema files, `User.js` and `Userneo.js`, for MongoDB and Neo4j, respectively.

## Tech Stack

**Client:** React Native, Redux, TailwindCSS

**Server:** Node, Express, JWT

**Database:** MongoDB, Neo4j

**Integrations:** Google Maps APIs, Firebase Auth, FCM (Push-notifications)

## Contributing

Contributions are always welcome!
