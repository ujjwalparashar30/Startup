class ExpressError extends Error {
    constructor(message, status){
        super(message);
        this.statusCode = status;
        this.message = message;
        }
}
module.exports = ExpressError;