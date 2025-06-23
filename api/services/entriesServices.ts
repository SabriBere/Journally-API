class EntriesServices {
    static async getAll() {
        try {
            return { error: false, data: "Hola" };
        } catch (error: any) {
            return { error: true, data: error.message };
        }
    }
}

export default EntriesServices;
