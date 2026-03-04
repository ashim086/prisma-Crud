import { NextFunction, Request, Response } from "express";

const globalError = (err: any, req: Request, res: Response, next: NextFunction) => {


    let statusCode = err.statusCode || 500

    const msg = {
        message: err.message || "internal server error",
        status: err.status || "fail",
        statusCode,
        success: err.success || false
    }


    res.status(statusCode).json(msg);

}


export default globalError;