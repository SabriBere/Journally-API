import { RequestHandler } from "express"; //permite cumplir los estandares de middleware en express

const notFound: RequestHandler = (req, res) => {
    res.status(404).json({
        error: `Route ${req.method} ${req.originalUrl} Not Found`,
    });
};

export default notFound;
