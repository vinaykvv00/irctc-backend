const { BadRequestError, UnauthorizedError } = require("../utils/error");
const asyncHandler = require("../utils/asyncHandler");
const { config } = require("../config");
const authService = require("../service/auth.service");
const getDeviceFingerprint = require("../utils/deviceFingerprint");

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = (maxAge) => ({
     httpOnly: true,
     secure: isProd,
     sameSite: isProd ? 'strict' : 'lax',
     maxAge,
});

exports.sendOTP = asyncHandler(async (req, res) => {
     const { firstName, lastName, email, password, confirmPassword } = req.body;
     if (!firstName || !lastName || !email || !password || !confirmPassword) {
          throw new BadRequestError("All fields are mandatory");
     }

     if (password !== confirmPassword) {
          throw new BadRequestError("Password mismatch");
     }

     const { otpSessionId, devOtp } = await authService.sendOTP(firstName, lastName, email, password);
     res.cookie("otp_session", otpSessionId, cookieOptions(config.OTP_TTL * 1000)).status(200).json({
          success: true,
          message: "OTP generated successfully",
          data: devOtp ? { otpSessionId, otp: devOtp } : { otpSessionId }
     })
});

exports.verifyOTP = asyncHandler(async (req, res) => {
     const { otp, otpSessionId: bodyOtpSessionId } = req.body;
     const otpSessionId = bodyOtpSessionId || req.cookies?.otp_session;

     if (!otp || !otpSessionId) {
          throw new BadRequestError("OTP or otpSessionId is missing. Pass otpSessionId from send-otp response or keep the cookie.")
     }

     const user = await authService.verifyOTP({ otp, otpSessionId });
     res.clearCookie("otp_session");
     return res.status(201).json({
          success: true,
          message: "User Account created successfully",
          data: user
     })
})

exports.login = asyncHandler(async (req, res) => {
     const { email, password } = req.body;
     if (!email || !password) {
          throw new BadRequestError("Email and password are required");
     }
     const deviceId = getDeviceFingerprint(req);

     //our next task incoming http request correct business logic ko send 
     const { accessToken, refreshToken, loggedInUser } = await authService.login(email, password, deviceId);

     res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: config.ACCESS_TOKEN_EXP_SEC * 1000
     })
     res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: config.REFRESH_TOKEN_EXP_SEC * 1000
     });
     res.status(200).json({
          success: true,
          message: "Login successful",
          data: { loggedInUser }
     })
})

exports.rotateRefreshToken = asyncHandler(async (req, res) => {
     const refreshToken = req.cookies.refreshToken;
     if (!refreshToken) {
          throw new UnauthorizedError("Refresh token is missing");
     }
     const deviceId = getDeviceFingerprint(req);
     const { newAccessToken, newRefreshToken } = await authService.rotateRefreshToken(refreshToken, deviceId);
     res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: config.ACCESS_TOKEN_EXP_SEC * 1000
     })
     res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: config.REFRESH_TOKEN_EXP_SEC * 1000
     });
     res.status(200).json({
          success: true,
          message: "Refresh token rotated successfully, access n refresh token reissued",
     })

});
;