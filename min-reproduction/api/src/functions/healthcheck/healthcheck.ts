import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono();

export const ParamsSchema = z.object({
  text: z
    .string()

    .openapi({
      param: {
        name: "text",
        in: "query",
      },
      example: "world",
    }),
});

export const ResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    text: z.string().openapi({
      example: "world",
    }),
  }),
});
// .openapi("healthcheck200");

export const InputValidationZchema = z
  .object({
    success: z.boolean().openapi({ example: false }),

    error: z.object({
      issues: z.array(
        z.object({
          code: z.string().openapi({ example: "invalid_type" }),
          expected: z.string().openapi({ example: "string" }),
          received: z.string().openapi({ example: "undefined" }),
          path: z.array(z.string().openapi({ example: "text" })),
          message: z.string().openapi({ example: "Required" }),
        })
      ),
      name: z.string().openapi({ example: "ZodError" }),
    }),
  })
  .optional()
  .openapi("InputValidationError");

const route = createRoute({
  method: "get",
  path: "/",
  tags: ["Platform"],
  request: {
    query: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Return some JSON.",
    },
    400: {
      content: {
        "application/json": {
          schema: InputValidationZchema,
        },
      },
      description: "Return some JSON about the validation error.",
    },
  },
});

app.openapi(route, (c:any) => {
  const text = c.req.query("text") || "world";
  return c.json({
    success: true,
    data: { text: text },
  });
});

export default app;
