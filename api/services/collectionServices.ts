import prisma from "../db/db";

class ColletionServices {
    static async create(body:any){
        try {
            
            return {
                status: 201,
                error: true,
                data: ""
            }
        } catch (error:any) {
            return { status: 500, error: true, data: error.message}
        }
    }
}

export default ColletionServices;
