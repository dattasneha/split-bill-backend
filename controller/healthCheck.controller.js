import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/apiResponse.js";
import os from "os";
import ApiError from "../util/apiError.js";
import { STATUS } from "../constants/statusCodes.js"

const serverHealthCheck = asyncHandler(async (req, res) => {
    let systemInfo;

    try {
        systemInfo = {
            platform: os.platform(),
            cpuArch: os.arch(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            uptime: os.uptime()
        };
    } catch (error) {
        throw new ApiError(
            STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR,
            error.message
        );
    }

    return res
        .status(STATUS.SUCCESS.OK)
        .json(new ApiResponse(systemInfo, "Status Ok."));
});

export { serverHealthCheck };