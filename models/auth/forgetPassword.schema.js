import { z } from "zod";

const forgetPasswordSchema = z
    .object({
        email: z
            .string({ required_error: "Email is required." })
            .email("Invalid email address."),
    });

export { forgetPasswordSchema };
