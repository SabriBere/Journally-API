import prisma from "../db/db";

class UserService {
    static async createUser(body: {
        email: string;
        password: string;
        user_name?: string;
    }) {
        const { email, password, user_name } = body;

        try {
            const user = await prisma.user.create({
                data: {
                    email: email,
                    password: password, //encriptar
                    user_name: email.split("@")[0], // ejemplo: username a partir del email
                },
            });
            return { status: 201, error: false, data: user };
        } catch (error: any) {
            return { status: 500, error: true, data: error.message };
        }
    }

    static async getUser(body: { email: string; password: string }) {
        try {
            const userFinded = await prisma.user.findFirst({
                where: {
                    email: body.email,
                    password: body.password,
                },
            });
            
            //validación de la contraseña
            if (!userFinded) {
                return {
                    status: 401,
                    error: true,
                    data: "Usuario no valido o registrado",
                };
            }
            

            return {
                status: 201,
                error: false,
                data: {
                    user: userFinded.email,
                    userName: userFinded.user_name,
                },
            };
        } catch (error: any) {
            return {
                status: 500,
                error: true,
                data: error.message,
            };
        }
    }
}

export default UserService;
