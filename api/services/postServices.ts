class PostServices {
    static async getAllPost() {
        try {
            return { error: false, data: "Hola" };
        } catch (error: any) {
            return { error: true, data: error.message };
        }
    }
}

export default PostServices;
