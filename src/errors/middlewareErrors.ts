import AppError from "./AppError";

const knownBodyParserStatuses = new Map<string, number>([
    ["entity.parse.failed", 400],
    ["request.aborted", 400],
    ["request.size.invalid", 400],
    ["entity.verify.failed", 403],
    ["entity.too.large", 413],
    ["encoding.unsupported", 415],
    ["charset.unsupported", 415],
]);

export function mapKnownMiddlewareError(error: unknown): AppError | undefined {
    if (!(error instanceof Error)) return undefined;

    const candidate = error as Error & {
        type?: unknown;
        status?: unknown;
    };

    if (typeof candidate.type !== "string") return undefined;

    const expectedStatus = knownBodyParserStatuses.get(candidate.type);

    if (expectedStatus === undefined || candidate.status !== expectedStatus) {
        return undefined;
    }

    if (candidate.type === "entity.parse.failed") {
        return new AppError(
            400,
            "INVALID_JSON",
            "El cuerpo de la solicitud contiene JSON inválido"
        );
    }

    if (candidate.type === "entity.too.large") {
        return new AppError(
            413,
            "PAYLOAD_TOO_LARGE",
            "El cuerpo de la solicitud supera el tamaño permitido"
        );
    }

    return new AppError(
        expectedStatus,
        "INVALID_REQUEST_BODY",
        "No se pudo procesar el cuerpo de la solicitud"
    );
}
