const ALLOWED_TEST_DATABASES = new Set(["journally_test", "journally_ci"]);

export const assertTestDatabase = (): void => {
    const databaseUrl = process.env.DATABASE_URL;

    if (process.env.NODE_ENV !== "test" || !databaseUrl) {
        throw new Error(
            "La limpieza solo está permitida en una base de tests."
        );
    }

    const databaseName = new URL(databaseUrl).pathname.slice(1);

    if (!ALLOWED_TEST_DATABASES.has(databaseName)) {
        throw new Error(
            `La base "${databaseName}" no está autorizada para tests.`
        );
    }
};
