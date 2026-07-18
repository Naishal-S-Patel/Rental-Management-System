package com.hackathon.starter.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Logs every request/response (method, path, status, duration) and stamps a correlation id
 * into MDC so every log line touched while handling a request - including ones from the
 * JWT filter, service layer (see LoggingAspect), and GlobalExceptionHandler - can be tied
 * together and echoed back to the caller for support/debugging. Not a @Component: it's
 * registered explicitly (see LoggingFilterConfig) so it can run before the Spring Security
 * filter chain instead of at Boot's default (lower) auto-registration order.
 */
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger("com.hackathon.starter.http");
    private static final String CORRELATION_ID_HEADER = "X-Request-Id";
    private static final String MDC_KEY = "requestId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        MDC.put(MDC_KEY, correlationId);
        response.setHeader(CORRELATION_ID_HEADER, correlationId);

        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            log.info("{} {} -> {} ({}ms)", request.getMethod(), request.getRequestURI(), response.getStatus(), durationMs);
            MDC.remove(MDC_KEY);
        }
    }
}
