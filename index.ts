import fastify from "fastify";
import { processCsvFromUrl } from "./lib/csv";
import { PORT } from "./lib/runtime";

const server = fastify();

type CSVRouteParams = {
  url: string;
} & Record<string, string>;

server.get("/healthcheck", async (_, reply) => {
  reply.send({ status: "ok" });
});
server.get("/help", async (_, reply) => {
  reply.redirect("https://github.com/SirajChokshi/csv-api");
});

server.route({
  method: "GET",
  url: "/csv",
  schema: {
    querystring: {
      type: "object",
      properties: {
        url: { type: "string" },
      },
      required: ["url"],
    },
  },
  handler: async function (request, reply) {
    const params = request.query as CSVRouteParams;
    const paramKeys = Object.keys(params);

    if (paramKeys.length > 2) {
      reply.status(400).send({
        message: "Only include the url and one unique field to search",
      });
    }

    let fieldKey: string | undefined;

    if (paramKeys.length === 2) {
      fieldKey = paramKeys[paramKeys.findIndex((key) => key !== "url")];
    }

    const result = await processCsvFromUrl({
      url: params.url,
      query: fieldKey
        ? {
            field: fieldKey,
            value: params[fieldKey],
          }
        : undefined,
    });

    if (result.type === "internal-error") {
      reply.code(500).send({
        error: {
          code: result.code,
          message: result.message,
        },
      });
      return;
    }

    if (result.type === "external-error") {
      reply.code(result.status).send({
        message: result.message,
      });
      return;
    }

    reply.code(result.status).send(result.data);
  },
});

server.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
