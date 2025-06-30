import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/apiResponse.js";
import ApiError from "../util/apiError.js";
import { STATUS } from "../constants/statusCodes.js";
import { prisma } from "../util/prismaClient.js";
import { registerSchema } from "../models/auth/register.schema.js";
import bcrypt from "bcrypt";
import { loginSchema } from "../models/auth/login.schema.js";
import { generateAccessToken, generateRefreshToken } from "../util/tokenGenerator.js";
import { cookieOptions } from "../constants/cookieOptions.js";
import jwt from "jsonwebtoken";
import { forgetPasswordSchema } from "../models/auth/forgetPassword.schema.js";
import { sendMail } from "../util/nodemailer.js";
import { totp } from "otplib";
/**
 * Handles user login by verifying credentials, generating authentication tokens,
 * and storing the refresh token in the database.
 *
 * @route POST /auth/login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {ApiError} If email is not registered or password is incorrect
 */

const login = asyncHandler(async (req, res) => {
    // Validate request body against schema
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email in the database
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "Email address is not registered."
        );
    }

    //Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "Incorrect password! Try again later"
        );
    }

    //Generate auth tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    //Save defresh token info db
    user = await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshToken }
    });

    //remove sensitive data
    const { password: _unused, ...sanitizedUser } = user;

    return res
        .status(STATUS.SUCCESS.OK)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                { ...sanitizedUser, accessToken },
                "User logged in successfully"
            )
        );
});

/**
 * Handles user registration by validating user input, encrypting the password,
 * and creating a user record in the database.
 *
 * @route POST /auth/register
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {ApiError} If the email already exists or invalid role provided
 */

const register = asyncHandler(async (req, res) => {
    // Validate request body against schema
    const { name, email, password, profileImageUrl } = registerSchema.parse(req.body);

    // Check if the user already exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.CONFLICT,
            "User with this email already exists"
        );
    }

    // Create new user with hashed password
    const user = await prisma.user.create({
        data: {
            email: email,
            name: name,
            password: await bcrypt.hash(password, 10),
            profileImageUrl: profileImageUrl
        }
    });

    // Remove sensitive fields before responding
    const { password: _unused, refreshToken: _null, ...sanitizedUser } = user;

    return res
        .status(STATUS.SUCCESS.CREATED)
        .json(
            new ApiResponse(
                sanitizedUser,
                "User registered succesfully."
            )
        );
});

/**
 * Handles user logout by clearing authentication cookies and removing refresh token.
 *
 * @route POST /auth/logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */

const logout = asyncHandler(async (req, res) => {
    await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
    });

    return res
        .status(STATUS.SUCCESS.OK)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse({}, "User logged out successfully!"))
});


/**
 * This function verifies the provided refresh token, generates a new access token,
 * and updates the refresh token in the database. The new tokens are then sent
 * back as HTTP-only cookies.
 *
 * @route POST /auth/refresh-token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Extract refresh token from cookies or request body
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.BAD_REQUEST,
            "Refresh token is required."
        );
    }

    // Verify the refresh token using JWT
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );
    const userId = decodedToken?.id;

    // Fetch user details from the database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.NOT_FOUND,
            "Unable to reinstate session.",
            "User not found."
        );
    }

    // Ensure the stored refresh token matches the provided one
    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "Unable to reinstate session.",
            "Tokens do not match."
        );
    }

    // Generate new access and refresh tokens
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token in database
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
    });

    // Set new tokens in HTTP-only cookies and return response
    return res
        .status(STATUS.SUCCESS.OK)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(
                {
                    accessToken,
                    refreshToken: newRefreshToken,
                },
                "Session successfully reinitialized."
            )
        );
});

const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(STATUS.CLIENT_ERROR.BAD_REQUEST, "Email is required");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "User with this email does not exist"
        );
    }

    // Generate OTP
    totp.options = { digits: 4 };
    const token = totp.generate(process.env.OTP_SECRET);

    const otpHash = await bcrypt.hash(token, 10);

    try {
        // Update user with hashed OTP
        await prisma.user.update({
            where: { id: user.id },
            data: { otp: otpHash }
        });

        const mailResponse = await sendMail(email, token);
        const { password: _unused, otp: _onetime, ...sanitizedUser } = user;

        return res.status(STATUS.SUCCESS.OK).json(
            new ApiResponse(
                { mailResponse, sanitizedUser },
                "OTP sent successfully"
            )
        );
    } catch (error) {
        throw new ApiError(
            STATUS.SERVER_ERROR.SERVICE_UNAVAILABLE,
            error.message
        );
    }
});


export { login, register, logout, refreshAccessToken, forgetPassword };

