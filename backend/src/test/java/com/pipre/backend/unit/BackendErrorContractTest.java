package com.pipre.backend.unit;

import com.pipre.backend.infrastructure.exceptions.GlobalExceptionHandler;
import com.pipre.backend.domain.exceptions.*;
import org.junit.jupiter.api.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;

class BackendErrorContractTest {
    MockMvc mvc;
    @BeforeEach void setup() { mvc=MockMvcBuilders.standaloneSetup(new Errors()).setControllerAdvice(new GlobalExceptionHandler()).build(); }
    @RestController static class Errors {
        @GetMapping("/errors/{kind}") String error(@PathVariable String kind) {
            switch(kind) {
                case "business" -> throw new BusinessException("Dato inválido");
                case "missing" -> throw new ResourceNotFoundException("No existe");
                case "conflict" -> throw new DataIntegrityViolationException("PRIVATE SQL account_token=secret");
                default -> throw new IllegalStateException("PRIVATE internal configuration");
            }
        }
        @GetMapping("/number") int number(@RequestParam int count) { return count; }
        @PostMapping("/body") Object body(@RequestBody java.util.Map<String,Object> body) { return body; }
    }
    @Test void preservesBusinessAndNotFoundContracts() throws Exception {
        mvc.perform(get("/errors/business")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Dato inválido"));
        mvc.perform(get("/errors/missing")).andExpect(status().isNotFound());
    }
    @Test void unexpectedErrorsAreServerErrorsWithoutInternalDetails() throws Exception {
        mvc.perform(get("/errors/runtime")).andExpect(status().isInternalServerError()).andExpect(jsonPath("$.message",not(containsString("PRIVATE"))));
    }
    @Test void databaseConflictsAreSafe409Responses() throws Exception {
        mvc.perform(get("/errors/conflict")).andExpect(status().isConflict()).andExpect(jsonPath("$.message",not(containsString("PRIVATE"))));
    }
    @Test void malformedAndMissingInputRemain400WithoutParserDetails() throws Exception {
        mvc.perform(get("/number")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").exists());
        mvc.perform(get("/number?count=word")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").exists());
        mvc.perform(post("/body").contentType(MediaType.APPLICATION_JSON).content("{PRIVATE")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message",not(containsString("PRIVATE"))));
    }
}
