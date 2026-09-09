// import request from "supertest";

// describe("security boundaries", () => {
//     beforeAll(() => {
//         process.env.JWT_SECRET =
//             "test-access-secret-with-at-least-32-characters";
//         process.env.JWT_REFRESH_SECRET =
//             "test-refresh-secret-with-at-least-32-characters";
//         process.env.NODE_ENV = "test";
//     });

//     function getApp() {
//         // require keeps environment setup ahead of modules that validate secrets at load time.
//         return require("../src/app").default;
//     }

//     it("does not expose a post without authentication", async () => {
//         const response = await request(getApp()).get(
//             "/api/post/findOne?postId=1"
//         );
//         expect(response.status).toBe(401);
//     });

//     it("does not expose a collection without authentication", async () => {
//         const response = await request(getApp()).get(
//             "/api/collections/collectionId?id=1"
//         );
//         expect(response.status).toBe(401);
//     });

//     it("rejects malformed login input before reaching the database", async () => {
//         const response = await request(getApp())
//             .post("/api/users/login")
//             .send({ email: "not-an-email", password: "" });
//         expect(response.status).toBe(400);
//     });
// });
