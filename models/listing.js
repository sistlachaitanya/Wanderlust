const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    type: String,
    default:
      "https://media.istockphoto.com/id/1128602796/photo/relaxing-tiger-on-a-log-of-wood-after-a-hearty-meal.jpg?s=2048x2048&w=is&k=20&c=K8GmfW1_BHjRvwl21DNBTJOK7f7_Ew7i4VUVeiStkpg=",
    set: (v) =>
      v === ""
        ? "https://media.istockphoto.com/id/1128602796/photo/relaxing-tiger-on-a-log-of-wood-after-a-hearty-meal.jpg?s=2048x2048&w=is&k=20&c=K8GmfW1_BHjRvwl21DNBTJOK7f7_Ew7i4VUVeiStkpg="
        : v,
  },
  price: Number,
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

const Listing = new mongoose.model("Listing", listingSchema);

module.exports = Listing;
