package com.pipre.backend.adapters.in.web.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;

@RestController
@RequestMapping("/api/v1/auth")
public class CsrfController {
    public record Token(String token,String headerName) {}
    @GetMapping("/csrf")
    public ResponseEntity<Token> token(CsrfToken token) {
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(new Token(token.getToken(),token.getHeaderName()));
    }
}
