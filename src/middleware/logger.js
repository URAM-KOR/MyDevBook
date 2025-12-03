const logger = require('@/utils/logger');

function requestLogger(req, res, next) {
  const startTime = Date.now();

  // 응답 완료 시 로그 기록
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
  });

  next();
}

module.exports = requestLogger;

