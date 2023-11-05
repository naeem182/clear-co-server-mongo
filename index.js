const express = require('express')
const cors = require('cors')
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;



// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173', 'http://localhost:5174'

    ],
    credentials: true
}));



app.use(express.json());
app.use(cookieParser());

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

// gateman                                                                         
const logger = async (req, res, next) => {
    console.log('log: info', req.method, req.url);
    // console.log('called:', req.host, req.originalUrl)
    next();
}

//token verify
const gateman = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of the token in middlewire', token)
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        console.log('decoded', decoded)
        req.user = decoded;
        next();
    })
}





async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('CleanCo').collection('services');
        const bookingCollection = client.db('CleanCo').collection('bookings');


        //get jsondata
        // filter//sort
        // http://localhost:5000/api/v1/services situation1
        // http://localhost:5000/api/v1/services/?category=Heavy-Duty situation1
        app.get('/api/v1/services', logger, async (req, res) => {

            let queryObj = {}
            const category = req.query.category;

            if (category) {
                queryObj.category = category
            }

            const cursor = serviceCollection.find(queryObj)
            const result = await cursor.toArray()
            res.send(result)
        })


        //create bookings
        app.post('/api/v1/user/createbookings', async (req, res) => {

            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);

            res.send(result)
        })

        //user specific bookings
        app.get('/api/v1/user/bookings', logger, gateman, async (req, res) => {
            console.log(req.query.email);
            // console.log('tt token', req.cookies.token)
            console.log('user in the valid token', req.user)
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            console.log(result)
            res.send(result);
        })









        // app.post('/api/v1/user/bookings', logger, gateman, async (req, res) => {
        //     const queryemail = req.query.email;
        //     const tokenemail = req.user.email;
        //     // match user email
        //     console.log('tt token', req.cookies.token)
        //     console.log('user in the valid token', req.user)
        //     if (queryemail !== tokenemail) {
        //         return res.status(403).send({ message: 'forbidden access' })
        //     }

        //     let query = {};
        //     if (queryemail) {
        //         query = { email: queryemail }
        //     }
        //     const result = await bookingCollection.find(query).toArray();
        //     res.send(result);





        // })
        //delete bookings
        app.delete('/api/v1/user/cancelbookings/:bookingid', async (req, res) => {

            const id = req.params.bookingid;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);

            res.send(result)
        })







        // auth related api
        app.post('/api/v1/auth/access-token', logger, async (req, res) => {
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