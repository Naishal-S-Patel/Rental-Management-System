package com.hackathon.starter.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Satisfies the general "Spring AOP" requirement independent of Resilience4j - logs entry/exit
 * and elapsed time for every service-layer method call at DEBUG.
 */
@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    @Around("execution(* com.hackathon.starter.service..*(..))")
    public Object logServiceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        String signature = joinPoint.getSignature().toShortString();
        long start = System.currentTimeMillis();
        try {
            return joinPoint.proceed();
        } finally {
            log.debug("{} took {}ms", signature, System.currentTimeMillis() - start);
        }
    }
}
