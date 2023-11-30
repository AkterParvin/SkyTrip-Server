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
        const storiesCollection = client.db('skyTripDB').collection('stories');
        const guidesCollection = client.db('skyTripDB').collection('guides');


        // jwt related api 
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "6h" });
            res.send({ token });
        })

        //verify access token in middleware
        const verifyToken = (req, res, next) => {
            console.log("access-token from verify token");
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "Unauthorized Access" });
            }
            const token = req.headers.authorization.split(" ")[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({
                        message: "Unauthorized Access"
                    });
                }
                req.decoded = decoded;
                next();
            })
            // next();
        };
        // verifyAdmin middleware
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const isAdmin = user?.role === "admin";
            if (!isAdmin) {
                return res.status(403).send({ message: "forbidden access" }); 
            };
            next();
        }




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
            // console.log(req.headers);
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // find admin or guide with id query 
        app.get("/users/role/:email",verifyToken,async (req, res) => {
            const email = req.params.email;
            // if (email !== req.decoded.email) {
            //     return res.status(403).send({ message: "forbidden access" });
            // }
            const query = { email: email }; 
            const user = await usersCollection.findOne(query);

            if (!user) {
                return res.status(404).send({ message: "User not found" });

            }
            const role = user.role
            res.send({ role });

        })

        // find admin 
        // app.get("/users/admin/:email", verifyToken, async (req, res) => {
        //     const email = req.params.email;
        //     if (email !== req.decoded.email) {
        //         return res.status(403).send({ message: "forbidden access" });
        //     }
        //     const query = { email: email };
        //     const user = await usersCollection.findOne(query);
        //     let admin = false;
        //     if (user) {
        //         admin = user?.role === "admin";
        //     }
        //     res.send({ admin });
        // });

     


        //find all guides name ,id and emails 
        app.get("/users/:role", async (req, res) => {
            const role = req.params.role.toLowerCase();
            const result = await usersCollection.find({ role }).toArray();
            res.send(result);
        })

        // post a new user 
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

        app.patch("/users/role/:id", async (req, res) => {
            const id = req.params.id;
            const role = req.body.role;
            // console.log(role);
            if (!["admin", "guide"].includes(role)) {
                return res.status(400).send({ message: "Invalid Role" });
            }
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: { role }
            }
            const result = await usersCollection.updateOne(query, updatedDoc);
            res.send(result)

        })
        // app.patch("/users/guide/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const updateDoc = {
        //         $set: {
        //             role: "guide"
        //         }
        //     };
        //     const result = await usersCollection.updateOne(filter, updateDoc);
        //     res.send(result);
        // })
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
        // app.get('/bookings', async (req, res) => {
        //     // console.log("Token owner info:", req.user);
        //     // if (req.user.email !== req.query.email) {
        //     //     return res.status(403).send({ message: 'unauthorized access' })
        //     // }
        //     const result = await bookingCollection.find().toArray();
        //     res.send(result);
        // });
        
        app.get('/bookings', async (req, res) => {
            let query = {};
            if (req.query.tourist_email) {
                query = { tourist_email: req.query.tourist_email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);

        })


        app.get("/bookings", async (req, res) => {
            const result = await bookingCollection.find().toArray();
            res.send(result);
        });
        app.get("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.findOne(query);
            res.send(result);
        })

        app.get('/assignedtours', async (req, res) => {
            console.log("Token owner info:", req.user);
            let query = {};
            if (req.query.guide_email) {
                query = { guide_email: req.query.guide_email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        });

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateBooking = req.body;
            const updatedDoc = {
                $set: {
                    status: updateBooking.status
                },
            }
            console.log(updateBooking);
            const result = await bookingCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // story related api 
        app.get("/stories", async (req, res) => {
            const result = await storiesCollection.find().toArray();
            res.send(result);
        })
        app.get("/stories", async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);

        })
        app.post("/stories", async (req, res) => {
            const stories = req.body;
            const result = await storiesCollection.insertOne(stories);
            res.send(result);
        });
        app.delete('/stories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await storiesCollection.deleteOne(query);
            res.send(result);
        });

        // guide related api 
        app.get("/guides", async (req, res) => {
            const result = await guidesCollection.find().toArray();
            res.send(result);
        });
        app.get("/guides", async (req, res) => {
            // let query = {};
            // if (req.query.guide_email) {
            //     query = { guide_email: req.query.guide_email }
            // }
            const guide_email = req.query.guide_email;
            const query = { guide_email: guide_email };
            const result = await guidesCollection.findOne(query);
            res.send(result);
        });
        app.get("/guides/:guide_email", async (req, res) => {
            const query = { guide_email: req.params.guide_email };
            const result = await guidesCollection.findOne(query);
            res.send(result);
        })


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