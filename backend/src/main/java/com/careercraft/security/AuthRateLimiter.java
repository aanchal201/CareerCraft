package com.careercraft.security;

import com.careercraft.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Locale;

/**
 * Brute-force and spam protection for the public auth endpoints.
 *
 * Login: after N wrong passwords for the same email from the same IP
 * (default 5 in 15 minutes), further attempts get 429, even with the right
 * password, until the window passes. A successful login clears the counter.
 * The key is "IP + email", so an attacker can't lock a real user out from a
 * different network.
 *
 * A second, looser per-IP limit (default 50 failures in 15 minutes) stops one
 * machine from trying many different accounts.
 *
 * Register: at most N new accounts per IP per hour (default 20).
 */
@Component
public class AuthRateLimiter {

    private final RateLimiter loginFailuresByAccount;
    private final RateLimiter loginFailuresByIp;
    private final RateLimiter registrationsByIp;

    public AuthRateLimiter(
            @Value("${app.security.login.max-failures:5}") int maxFailuresPerAccount,
            @Value("${app.security.login.max-failures-per-ip:50}") int maxFailuresPerIp,
            @Value("${app.security.login.window-minutes:15}") int loginWindowMinutes,
            @Value("${app.security.register.max-per-hour:20}") int maxRegistrationsPerHour) {
        Duration loginWindow = Duration.ofMinutes(loginWindowMinutes);
        this.loginFailuresByAccount = new RateLimiter(maxFailuresPerAccount, loginWindow);
        this.loginFailuresByIp = new RateLimiter(maxFailuresPerIp, loginWindow);
        this.registrationsByIp = new RateLimiter(maxRegistrationsPerHour, Duration.ofHours(1));
    }

    /** Throws 429 if this IP/email may not try to log in right now. */
    public void checkLogin(String ip, String email) {
        String account = accountKey(ip, email);
        if (loginFailuresByAccount.isLimited(account)) {
            long wait = loginFailuresByAccount.secondsUntilAllowed(account);
            throw new TooManyRequestsException(
                    "Too many failed login attempts. Try again in " + describe(wait) + ".", wait);
        }
        if (loginFailuresByIp.isLimited(ip)) {
            long wait = loginFailuresByIp.secondsUntilAllowed(ip);
            throw new TooManyRequestsException(
                    "Too many failed login attempts from your network. Try again in " + describe(wait) + ".", wait);
        }
    }

    public void recordLoginFailure(String ip, String email) {
        loginFailuresByAccount.record(accountKey(ip, email));
        loginFailuresByIp.record(ip);
    }

    public void recordLoginSuccess(String ip, String email) {
        loginFailuresByAccount.reset(accountKey(ip, email));
    }

    /** Throws 429 if this IP has created too many accounts recently. */
    public void checkRegistration(String ip) {
        if (registrationsByIp.isLimited(ip)) {
            long wait = registrationsByIp.secondsUntilAllowed(ip);
            throw new TooManyRequestsException(
                    "Too many accounts were created from your network. Try again in " + describe(wait) + ".", wait);
        }
    }

    public void recordRegistration(String ip) {
        registrationsByIp.record(ip);
    }

    /** Forgets all counters. Used by tests. */
    public void clear() {
        loginFailuresByAccount.clear();
        loginFailuresByIp.clear();
        registrationsByIp.clear();
    }

    private static String accountKey(String ip, String email) {
        return ip + "|" + (email == null ? "" : email.trim().toLowerCase(Locale.ROOT));
    }

    private static String describe(long seconds) {
        if (seconds < 60) return seconds + (seconds == 1 ? " second" : " seconds");
        long minutes = (seconds + 59) / 60;
        return minutes + (minutes == 1 ? " minute" : " minutes");
    }
}
