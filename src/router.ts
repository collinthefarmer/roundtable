import { Server } from "bun";

import { clientScript, container } from "./index.ts";

import { User } from "./user.ts";

const ROOM_TEMPLATE = "templates/index.html";

const ROUTES: Record<string, RouteResolver> = {
    "^\\/static\\/(?<path>.+)$": {
        get: (routeMatch, request, server) => {
            const path = routeMatch.path;
            if (path === "client.js") {
                return new Response(clientScript);
            }

            return new Response(Bun.file(path));
        },
    },
    "^\\/rooms\\/(?<roomId>\\d+)$": {
        get: (routeMatch, request, server) => {
            const sessionContainer = container.createChild();

            const roomId = routeMatch.roomId;
            sessionContainer.bind(User.ROOM_ID).toConstantValue(roomId);
            sessionContainer.bind(User.REQUEST).toConstantValue(request);

            const user = sessionContainer.get(User);
            server.upgrade(request, { data: user });

            return new Response(Bun.file(ROOM_TEMPLATE));
        },
    },
};

function matchRoute(route: string, path: string): PathMatch | null {
    const patternMatches = path.match(route)?.groups;
    if (!patternMatches) return null;

    return {
        patternMatches,
        route,
    };
}

type PathMatch = { patternMatches: Record<string, string>; route: string };

const pathMatches: Record<string, PathMatch> = {};

export const fetch = async (request: Request, server: Server) => {
    const path = new URL(request.url).pathname;

    let routeMatch = pathMatches[path];
    if (routeMatch === undefined) {
        for (const route in ROUTES) {
            const match = matchRoute(route, path);

            if (match) {
                routeMatch = pathMatches[path] = match;
                break;
            }
        }
    }

    if (!routeMatch) {
        return new Response(null, { status: 404 });
    }

    const method = request.method.toLowerCase() as HTTPMethod;
    const resolver = ROUTES[routeMatch.route][method];
    if (!resolver) {
        return new Response(null, { status: 405 });
    }

    return resolver(routeMatch.patternMatches, request, server);
};

type HTTPMethod = "get" | "post" | "put" | "delete";

type RouteResolver = {
    [key in HTTPMethod]?: (
        routeMatch: Record<string, string>,
        request: Request,
        server: Server,
    ) => Response | Promise<Response>;
};
