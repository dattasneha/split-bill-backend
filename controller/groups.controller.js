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

// [POST] /group/:groupId/invite
// Body: { userId, email }
const invite = asyncHandler(async (req, res) => {
    const { userId, email } = req.body;
    const { groupId } = req.params;

    const userExists = await prisma.user.findUnique({ where: { email } });

    if (!userExists) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.NOT_FOUND,
            "User with this email does not exist."
        );
    }

    const owner = await prisma.group.findFirst({
        where: {
            id: groupId,
            created_by: req.user.id
        }
    });

    if (!owner) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "Only the group owner can send invitations."
        );
    }

    const groupMembers = await prisma.groupMembers.create({
        data: {
            groupId,
            userId,
            status: "Pending"
        }
    });

    return res.status(STATUS.SUCCESS.CREATED).json(
        new ApiResponse(groupMembers, "Invitation sent.")
    );
});


// [PUT] /group/:groupId/join
const joinGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const userInvited = await prisma.groupMembers.findFirst({
        where: {
            groupId,
            userId: req.user.id
        }
    });

    if (!userInvited) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "User is not authorized to join the group."
        );
    }

    if (userInvited.status === "Accepted") {
        throw new ApiError(
            STATUS.CLIENT_ERROR.NOT_ACCEPTABLE,
            "User is already in the group."
        );
    }

    const groupMembers = await prisma.groupMembers.update({
        where: {
            groupId_userId: {
                groupId,
                userId: req.user.id
            }
        },
        data: {
            status: "Accepted"
        }
    });

    return res.status(STATUS.SUCCESS.OK).json(
        new ApiResponse(groupMembers, "User successfully joined the group.")
    );
});

// [DELETE] /group/:groupId/reject
const reject = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    await prisma.groupMembers.delete({
        where: {
            groupId_userId: {
                groupId,
                userId: req.user.id
            }
        }
    });

    return res.status(STATUS.SUCCESS.OK).json(
        new ApiResponse(null, "User invitation rejected successfully.")
    );
});


// [DELETE] /group/:groupId/member/:userId
const removeMember = asyncHandler(async (req, res) => {
    const { groupId, userId } = req.params;

    const isOwner = await prisma.group.findFirst({
        where: {
            id: groupId,
            created_by: req.user.id
        }
    });

    if (!isOwner) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "Only the group owner can remove a member."
        );
    }

    await prisma.groupMembers.delete({
        where: {
            groupId_userId: {
                groupId,
                userId
            }
        }
    });

    return res.status(STATUS.SUCCESS.OK).json(
        new ApiResponse(null, "User successfully removed from the group.")
    );
});


// [DELETE] /group/:groupId
const deleteGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const isOwner = await prisma.group.findFirst({
        where: {
            id: groupId,
            created_by: req.user.id
        }
    });

    if (!isOwner) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "Only the group owner can delete the group."
        );
    }

    await prisma.groupMembers.deleteMany({ where: { groupId } });
    await prisma.group.delete({ where: { id: groupId } });

    return res.status(STATUS.SUCCESS.OK).json(
        new ApiResponse(null, "Group deleted successfully.")
    );
});


export { createGroup, invite, joinGroup, reject, removeMember, deleteGroup }