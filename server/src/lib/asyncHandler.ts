import { NextFunction, Request, RequestHandler, Response } from "express"

type asyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction) => Promise<any>

const asyncHandler = (fn: asyncHandler): RequestHandler => {

    return (req: Request, res: Response, next: NextFunction) => {

        fn(req, res, next).catch(next)
    }

}

export default asyncHandler;