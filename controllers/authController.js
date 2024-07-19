const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  console.log("new user => ", req.body);
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "You already have an account." });
    }

    const user = await User.create({
      name,
      email,
      password,
      expireDate1: Date.now(),
      expireDate2: Date.now(),
      expireDate3: Date.now(),
      expireDate4: Date.now(),
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Your email or password is incorrect" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.authUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("login user => ", req.body);
  try {
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        expireDate1: user.expireDate1,
        expireDate2: user.expireDate2,
        expireDate3: user.expireDate3,
        expireDate4: user.expireDate4,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Your email or password is incorrect." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(404).json({ message: "User not found." });
  }
};

// @desc    Update expire date
// @route   POST /api/auth/payment
// @access  Private
exports.updateExpireDate = async (req, res) => {
  const { token, matchType, authUser } = req.body;
  const expireDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  let updateItem;

  switch (matchType) {
    case "MLB":
      updateItem = "expireDate1";
      break;
    case "NFL":
      updateItem = "expireDate2";
      break;
    case "NHL":
      updateItem = "expireDate3";
      break;
    case "NBA":
      updateItem = "expireDate4";
      break;
    default:
      return res
        .status(400)
        .json({ success: false, error: "Invalid match type." });
  }

  try {
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: 2000, // Amount in cents ($20)
    //   currency: "usd",
    //   payment_method: token,
    //   confirmation_method: "manual",
    //   confirm: true,
    // });

    // if (
    //   paymentIntent.status === "requires_action" &&
    //   paymentIntent.next_action.type === "use_stripe_sdk"
    // ) {
    //   return res.status(200).json({
    //     requires_action: true,
    //     payment_intent_client_secret: paymentIntent.client_secret,
    //   });
    // }

    // if (paymentIntent.status === "succeeded") {
    const user = await User.findById(authUser._id);
    user[updateItem] = expireDate;
    await user.save();

    return res.status(200).json({ success: true, updateUser: user });
    // } else {
    //   return res
    //     .status(500)
    //     .json({ success: false, error: "Payment not successful." });
    // }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Error processing payment." });
  }
};
