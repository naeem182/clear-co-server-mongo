const express = require('express')
const cors = require('cors')
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.port || 5000;

//parser booking
app.use(express.json())


app.get('/', (req, res) => {
    res.send('clean co server is running')
})

// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.il0t7ji.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true, ObjectId
    }
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('CleanCo').collection('services');
        const bookingCollection = client.db('CleanCo').collection('bookings');


        //get jsondata
        app.get('/api/v1/services', async (req, res) => {
            const cursor = serviceCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        //create bookings
        app.post('/api/v1/user/createbookings', async (req, res) => {

            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);

            res.send(result)
        })
        //delete bookings
        app.delete('/api/v1/user/cancelbookings/:bookingid', async (req, res) => {

            const id = req.params.bookingid;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);

            res.send(result)
        })







        // auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log('user for token', user);

            // const token = jwt.sign(user, 'secret', { expiresIn: '1h' });

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });
            // res.send(token);
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`clean co server listening on port ${port}`)
})