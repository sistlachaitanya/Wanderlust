const mongoose = require("mongoose");
const initData = require("./data");
const Listings = require("../models/listing");

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

main()
    .then(() => {
        console.log("Database Connection Successful");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDb = async () => {
    await Listings.deleteMany({});
    await Listings.insertMany(initData.data);
    console.log("Data was Initialized");
}

initDb();