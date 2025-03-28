import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import { emailRegex, phoneRegex } from "../utilities/regexUtils.js";

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;
    //validations
    if (!name) {
      return res.send({ error: "Name is Required" });
    }

    if (!email) {
      return res.send({ message: "Email is Required" });
    } else if (!emailRegex.test(email)) {
      return res.send({
        message: "Invalid Email Format (hint: example@gmail.com)",
      });
    }

    if (!password) {
      return res.send({ message: "Password is Required" });
    } else if (password.length < 6) {
      return res.send({ message: "Password must be at least 6 characters" });
    }

    if (!phone) {
      return res.send({ message: "Phone no is Required" });
    } else if (!phoneRegex.test(phone)) {
      return res.send({
        message:
          "Oops! Please enter a valid phone number in the format: +[country code] [8–12 digits]",
      });
    }

    if (!address) {
      return res.send({ message: "Address is Required" });
    }

    if (!answer) {
      return res.send({ message: "Answer is Required" });
    }

    //check user
    const exisitingUser = await userModel.findOne({ email });

    //exisiting user
    if (exisitingUser) {
      return res.status(200).send({
        success: false,
        message:
          "Unable to register. If you already have an account, please log in",
      });
    }
    //register user
    const hashedPassword = await hashPassword(password);
    //save
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
    }).save();

    res.status(201).send({
      success: true,
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error registering. Please try again later",
      error,
    });
  }
};

//POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation
    if (!email || !password) {
      return res.status(200).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    //check user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    //token
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "Login successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error logging in. Please try again later",
      error,
    });
  }
};

//forgotPasswordController
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      return res.status(200).send({ message: "Email is required" });
    }
    if (!answer) {
      return res.status(200).send({ message: "Answer is required" });
    }
    if (!newPassword) {
      return res.status(200).send({ message: "New Password is required" });
    } else if (newPassword.length < 6) {
      return res
        .status(200)
        .send({ message: "New Password must be at least 6 characters" });
    }

    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "Invalid Email Or Answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(201).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error resetting password. Please try again later",
      error,
    });
  }
};

//test controller
export const testController = (req, res) => {
  res.send("Protected Routes");
};

//update profile
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, newPassword, address, phone } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(200).json({
        error: "Unauthorized to update. Invalid Email or Password",
      });
    }

    // Verify User before updating
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(200).json({
        error: "Unauthorized to update. Invalid Email or Password",
      });
    }

    if (newPassword && newPassword.length < 6) {
      return res.status(200).json({
        error: "Password should be at least 6 character long",
      });
    }

    if (phone && !phoneRegex.test(phone)) {
      return res.status(200).json({
        error:
          "Oops! Please enter a valid phone number in the format: +[country code] [8–12 digits]",
      });
    }

    const hashedNewPassword = newPassword
      ? await hashPassword(newPassword)
      : undefined;

    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      {
        name: name || user.name,
        password: hashedNewPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(201).send({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while updating profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while updating order",
      error,
    });
  }
};
