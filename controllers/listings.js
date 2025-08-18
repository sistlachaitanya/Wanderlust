const Listing = require("../models/listing.js");
const { Client } = require("@googlemaps/google-maps-services-js");

const mapsClient = new Client({});

module.exports.index = async (req, res) => {
  const allListings = await Listing.find();
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

// CORRECTED createListing FUNCTION
module.exports.createListing = async (req, res, next) => {
  const addressString = `${req.body.listing.location}, ${req.body.listing.country}`;

  let geoResponse;
  try {
    geoResponse = await mapsClient.geocode({
      params: {
        address: addressString,
        key: process.env.MAP_TOKEN,
      },
    });

    if (!geoResponse.data.results.length) {
      req.flash(
        "error",
        "Address not found. Please check the location details and try again."
      );
      return res.redirect("/listings/new");
    }
  } catch (e) {
    console.error(e);
    req.flash(
      "error",
      "Could not verify address at this time. Please try again later."
    );
    return res.redirect("/listings/new");
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url: req.file.path, filename: req.file.filename };

  newListing.geometry = {
    type: "Point",
    coordinates: [
      geoResponse.data.results[0].geometry.location.lng,
      geoResponse.data.results[0].geometry.location.lat,
    ],
  };

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
}; // The duplicated block after this has been removed.

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested to edit doesn't exist!");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

// OPTIMIZED updateListing FUNCTION
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Cannot find that listing to update!");
    return res.redirect("/listings");
  }

  const originalAddress = `${listing.location}, ${listing.country}`;
  const newAddress = `${req.body.listing.location}, ${req.body.listing.country}`;

  Object.assign(listing, req.body.listing);

  // Only geocode if the address has changed
  if (originalAddress !== newAddress) {
    try {
      const geoResponse = await mapsClient.geocode({
        params: { address: newAddress, key: process.env.MAP_TOKEN },
      });

      if (!geoResponse.data.results.length) {
        req.flash(
          "error",
          "Updated address not found. Please check the location details."
        );
        return res.redirect(`/listings/${id}/edit`);
      }

      listing.geometry = {
        type: "Point",
        coordinates: [
          geoResponse.data.results[0].geometry.location.lng,
          geoResponse.data.results[0].geometry.location.lat,
        ],
      };
    } catch (e) {
      req.flash(
        "error",
        "Could not verify the new address. Please try again later."
      );
      return res.redirect(`/listings/${id}/edit`);
    }
  }

  if (req.file) {
    listing.image = { url: req.file.path, filename: req.file.filename };
  }

  await listing.save();
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
