class customError extends Error {

    statusCode: number;
    success: boolean;
    isOperation: boolean;

    constructor(statusCode: number, message: string,) {
        super(message)

        this.statusCode = statusCode
        this.success = false
        this.isOperation = true

        Error.captureStackTrace(this, customError)
    }
}
export default customError
