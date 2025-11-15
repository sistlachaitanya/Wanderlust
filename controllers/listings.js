const Listing = require("../models/listing.js");
const nodemailer = require("nodemailer");
const { Client } = require("@googlemaps/google-maps-services-js");

const mapsClient = new Client({});

// ======================= INDEX =======================
module.exports.index = async (req, res) => {
  const allListings = await Listing.find();
  res.render("listings/index.ejs", { allListings });
};

// ======================= NEW LISTING FORM =======================
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ======================= SHOW LISTING =======================
module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// ======================= CREATE LISTING =======================
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
        "Address not found. Please check the location details."
      );
      return res.redirect("/listings/new");
    }
  } catch (e) {
    console.error(e);
    req.flash("error", "Could not verify address. Try again later.");
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
};

// ======================= EDIT LISTING FORM =======================
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested to edit doesn't exist!");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing });
};

// ======================= UPDATE LISTING =======================
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

  // Geocode only if address changed
  if (originalAddress !== newAddress) {
    try {
      const geoResponse = await mapsClient.geocode({
        params: { address: newAddress, key: process.env.MAP_TOKEN },
      });

      if (!geoResponse.data.results.length) {
        req.flash("error", "Updated address not found.");
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
      console.error(e);
      req.flash("error", "Could not verify updated address.");
      return res.redirect(`/listings/${id}/edit`);
    }
  }

  // If image updated
  if (req.file) {
    listing.image = { url: req.file.path, filename: req.file.filename };
  }

  await listing.save();
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

// ======================= DELETE LISTING =======================
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;

  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

// ======================= BOOK LISTING (EMAIL OWNER) =======================
module.exports.bookListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id).populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  // Prevent owners booking their own listing
  if (listing.owner._id.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing!");
    return res.redirect(`/listings/${id}`);
  }

  const ownerEmail = listing.owner.email;
  const userEmail = req.user.email;
  const listingTitle = listing.title;

  // Email service
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email to Owner
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: ownerEmail,
    subject: "New Booking Request on Wanderlust!",
    text: `
Hello ${listing.owner.username},

You have received a booking request for your listing:

🏠 Listing: ${listingTitle}
👤 Requested by: ${req.user.username}
📧 Email: ${userEmail}

Please contact the user to proceed.
    `,
  });

  // Optional — Email to User
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Your Booking Request Has Been Sent!",
    text: `
Hello ${req.user.username},

Your booking request for:

🏠 ${listingTitle}

has been sent to the owner (${listing.owner.username}).
They will contact you soon!
    `,
  });

  req.flash("success", "Booking request sent to the owner!");
  res.redirect(`/listings/${id}`);
};
