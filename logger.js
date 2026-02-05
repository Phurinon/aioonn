const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, errors } = format;
const DailyRotateFile = require("winston-daily-rotate-file");

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console(),

    // Log ทุกระดับ แยกไฟล์ตามวัน
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d", // เก็บไว้ 14 วัน
    }),

    // Log error อย่างเดียว แยกไฟล์ตามวัน
    new DailyRotateFile({
      level: "error",
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d", // เก็บ error ไว้นานกว่านิดหน่อย
    }),
  ],
});

module.exports = logger;