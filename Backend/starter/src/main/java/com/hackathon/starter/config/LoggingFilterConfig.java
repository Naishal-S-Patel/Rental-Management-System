package com.hackathon.starter.config;

import com.hackathon.starter.logging.RequestLoggingFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class LoggingFilterConfig {

    /**
     * Registered here (not via @Component on the filter) so we control the order explicitly:
     * HIGHEST_PRECEDENCE means this runs before Spring Security's filter chain, so the
     * correlation id and request/response log line cover authentication failures too.
     */
    @Bean
    public FilterRegistrationBean<RequestLoggingFilter> requestLoggingFilterRegistration() {
        FilterRegistrationBean<RequestLoggingFilter> registration = new FilterRegistrationBean<>(new RequestLoggingFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
