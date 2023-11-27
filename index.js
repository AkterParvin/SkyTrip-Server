const express = require("express");
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

// use Middleware 
app.use(cors());
app.use(express.json());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.prs1keb.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        const usersCollection = client.db('skyTripDB').collection('users');
        const toursCollection = client.db('skyTripDB').collection('tours');
        const wishlistCollection = client.db('skyTripDB').collection('wishlist');
        const bookingCollection = client.db('skyTripDB').collection('bookings');



        // tours related api 
        app.get("/tours", async (req, res) => {
            const result = await toursCollection.find().toArray();
            res.send(result);
        });
        app.get("/tours/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toursCollection.findOne(query);
            res.send(result);
        })

        // users related api 
        app.get("/users", async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            // if (email !== req.decoded.email) {
            //     return res.status(403).send({ message: "forbidden access" });
            // }
            const query = { email: email };
            // after token use above commented codes 
            const user = await usersCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === "admin";
            }
            res.send({ admin });

        })



        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return console.log({ message: "user already exist in the DB", insertedId: null })
            };
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.patch("/users/admin/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: "admin"
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        app.patch("/users/guide/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: "guide"
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);

        });

        // wishlist Collection 
        app.get('/wishlist', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await wishlistCollection.find(query).toArray();
            res.send(result);
        });
        app.get("/wishlist", async (req, res) => {
            const result = await wishlistCollection.find().toArray();
            res.send(result);
        })
        app.post("/wishlist", async (req, res) => {
            const wishlist = req.body;
            const result = await wishlistCollection.insertOne(wishlist);
            res.send(result);
        });
        app.delete("/wishlist/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await wishlistCollection.deleteOne(query);
            res.send(result);
        })

        // booking related api 
        app.get('/bookings', async (req, res) => {
            // console.log("Token owner info:", req.user);
            // if (req.user.email !== req.query.email) {
            //     return res.status(403).send({ message: 'unauthorized access' })
            // }
            const result = await bookingCollection.find().toArray();
            res.send(result);
        });
        app.get('/mybookings', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);

        })

        // app.get('/pendingservices', async (req, res) => {
        //     console.log("Token owner info:", req.user);
        //     let query = {};
        //     if (req.query.provider_email) {
        //         query = { provider_email: req.query.provider_email }
        //     }
        //     const result = await bookingCollection.find(query).toArray();
        //     res.send(result);
        // })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        // app.delete('/bookings/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) };
        //     const result = await bookingCollection.deleteOne(query);
        //     res.send(result);
        // });

        // app.patch('/bookings/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) }
        //     const updateBooking = req.body;
        //     const updateDoc = {
        //         $set: {
        //             status: updateBooking.status
        //         },
        //     }
        //     console.log(updateBooking);
        //     const result = await bookingCollection.updateOne(filter, updateDoc);
        //     res.send(result);
        // })





        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);









// Root API to check activiy 
app.get("/", (req, res) => {
    res.send("SkyTrip Server is Running on PORT!!!");
});

app.listen(port, () => {
    console.log(`SkyTrip Server is running on port ${port}`);
});