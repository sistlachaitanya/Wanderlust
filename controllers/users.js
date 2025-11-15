const User = require("../models/user.js");
const nodemailer = require("nodemailer");

// ================== RENDER SIGNUP FORM ==================
module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

// ================== SIGNUP (CREATE USER + SEND OTP) ==================
module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    // Clean input
    username = username.trim();
    email = email.trim();

    // Create user
    const newUser = new User({ username, email });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    newUser.otp = otp;
    newUser.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Register password-based user (passport-local-mongoose)
    const registeredUser = await User.register(newUser, password);

    // Nodemailer Gmail config
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Wanderlust OTP Verification Code",
      text: `Your OTP is: ${otp}\nThis OTP is valid for 10 minutes.`,
    });

    req.flash("success", "OTP sent to your email. Please verify.");
    res.redirect(`/verify/${registeredUser._id}`);
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

// ================== RENDER OTP FORM ==================
module.exports.renderOtpForm = (req, res) => {
  res.render("users/verify.ejs", { userId: req.params.id });
};

// ================== VERIFY OTP ==================
module.exports.verifyOtp = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const otpEntered = req.body.otp.trim();

    const user = await User.findById(userId);

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/signup");
    }

    // Check OTP validity
    if (user.otp !== otpEntered || Date.now() > user.otpExpires) {
      req.flash("error", "Invalid or expired OTP.");
      return res.redirect(`/verify/${userId}`);
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Auto-login after verification
    req.login(user, (err) => {
      if (err) return next(err);

      // ⭐ Redirect to the page user wanted originally
      const redirectUrl = req.session.redirectUrl || "/listings";
      delete req.session.redirectUrl;

      req.flash("success", "Email verified! Welcome to Wanderlust!");
      res.redirect(redirectUrl);
    });
  } catch (e) {
    next(e);
  }
};

// ================== LOGIN ==================
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  // Prevent login if email is not verified
  if (!req.user.isVerified) {
    req.flash("error", "Please verify your email before logging in.");
    return res.redirect("/login");
  }

  req.flash("success", "Welcome back to Wanderlust!");
  res.redirect(res.locals.redirectUrl || "/listings");
};

// ================== LOGOUT ==================
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
};
