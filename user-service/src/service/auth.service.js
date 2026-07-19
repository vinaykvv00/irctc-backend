const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { config } = require("../config");
const logger = require("../config/logger");
const { ConflictError, BadRequestError, ForbiddenError } = require("../utils/error");
const { generateAndStoreOtp, verifyOtp } = require("../utils/otp");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/auth");
const jwt = require('jsonwebtoken');
const { getRedisClient } = require("../config/redis");

const sendOTP = async (firstName, lastName, email, password) => {
	const existingUser = await prisma.user.findUnique({
		where: { email }
	});

	if (existingUser) {
		throw new ConflictError("User already exists");
	}

	const hashedPassword = await bcrypt.hash(password, 12);
	const meta = { firstName, lastName, email, hashedPassword };
	const { otp, otpSessionId } = await generateAndStoreOtp(meta);
	const isDevelopment = config.NODE_ENV !== "production";

	// In local/dev mode we keep the flow self-contained and return the OTP for testing.
	logger.info(`OTP for ${email}: ${otp}`);
	logger.info(`OTP stored in Redis for ${email}`);

	return {
		otpSessionId,
		devOtp: isDevelopment ? otp : undefined
	};
};

const verifyOTP = async ({ otp, otpSessionId }) => {
	// The OTP helper owns Redis-backed OTP verification.
	const meta = await verifyOtp(otp, otpSessionId);

	if (!meta) {
		throw new BadRequestError("Invalid or expired OTP", "OTP_INVALID");
	}

	const existingUser = await prisma.user.findUnique({
		where: { email: meta.email }
	});

	if (existingUser) {
		throw new ConflictError("User already exists");
	}

	const user = await prisma.user.create({
		data: {
			firstName: meta.firstName,
			lastName: meta.lastName,
			email: meta.email,
			password: meta.hashedPassword,
			emailVerified: true
		}
	});

	return user;
};

const login = async (email, password, deviceId) => {
	const existingUser = await prisma.user.findUnique({
		where: { email }
	})
	if (!existingUser) {
		throw new BadRequestError("Invalid email or password");
	}

	const doesPasswordMatch = await bcrypt.compare(password, existingUser.password);
	if (!doesPasswordMatch) {
		throw new BadRequestError("Invalid password");
	}
	const accessToken = await generateAccessToken(existingUser.id);
	const refreshToken = await generateRefreshToken(existingUser.id);

	const redis = getRedisClient();
	const { jti } = jwt.decode(refreshToken);
	await redis.set(`refresh:${existingUser.id}:${deviceId}`, jti, 'EX', config.REFRESH_TOKEN_EXP_SEC);
	const { password: _password, ...safeUser } = existingUser;
	await redis.set(`user:${existingUser.id}`, JSON.stringify(safeUser), 'EX', config.REDIS_USER_TTL);
	return {

		accessToken,
		refreshToken,
		loggedInUser: safeUser
	};
}

const rotateRefreshToken = async (refreshToken, deviceId) => {
	const payload = verifyRefreshToken(refreshToken);
	const { id: userId, jti } = payload;
	const redis = getRedisClient();
	const storedJti = await redis.get(`refresh:${userId}:${deviceId}`);
	if (!storedJti) {
		throw new ForbiddenError("Session expired. Please login again.");
	}
	if (storedJti !== jti) {
		await redis.del(`refresh:${userId}:${deviceId}`);
		throw new ForbiddenError("Refresh token has been rotated. Please login again.");
	}
	const newAccessToken = await generateAccessToken(userId);
	const newRefreshToken = await generateRefreshToken(userId);
	const { jti: newJti } = jwt.decode(newRefreshToken);

	await redis.set(`refresh:${payload.id}:${deviceId}`, newJti, 'EX', config.REFRESH_TOKEN_EXP_SEC);

	return { newAccessToken, newRefreshToken };
}

module.exports = { sendOTP, verifyOTP, login, rotateRefreshToken };
