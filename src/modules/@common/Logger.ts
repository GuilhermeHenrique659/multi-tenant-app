import winston from "winston";

const customFormat = winston.format.printf(({ timestamp, message }) => {
    return `[${timestamp}] ${message}`;
});

const Logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.colorize(),
                customFormat,

            )
        }),
    ]
});

export default Logger;