import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/apiResponse.js";
import ApiError from "../util/apiError.js";
import { STATUS } from "../constants/statusCodes.js";
import { prisma } from "../util/prismaClient.js";

const createGroup = asyncHandler(async (req, res) => {
    const { groupName } = req.body;

    if (!groupName) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.NOT_ACCEPTABLE,
            "Group name is required."
        );
    }


    const group = await prisma.group.create({
        data: {
            name: groupName,
            created_by: req.user.id
        }
    });
    const groupId = group.id;
    const groupMembers = await prisma.groupMembers.create({
        data: {
            groupId: groupId,
            userId: req.user.id,
            status: "Accepted"
        }
    });

    return res
        .status(STATUS.SUCCESS.CREATED)
        .json(
            new ApiResponse(
                group,
                "Group created successfully"
            )
        );
});

const invite = asyncHandler(async (req, res) => {
    const { userId, groupId, email } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });

    if (!userExists) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "User with this email does not exists."
        );
    }

    const reqUserId = req.user.id;
    const owner = await prisma.group.findFirst(
        {
            where: {
                id: groupId,
                created_by: reqUserId
            }
        }
    );

    if (!owner) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "Only owner of this group can send invitation."
        );
    }

    const groupMembers = await prisma.groupMembers.create({
        data: {
            groupId: groupId,
            userId: userId,
            status: "Pending"
        }
    });

    return res
        .status(STATUS.SUCCESS.OK)
        .json(
            new ApiResponse(
                groupMembers,
                "Invitation sent."
            )
        );

});

const joinGroup = asyncHandler()

export { createGroup, invite }