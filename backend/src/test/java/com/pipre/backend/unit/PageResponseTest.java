package com.pipre.backend.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.*;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class PageResponseTest {
    final ObjectMapper json=new ObjectMapper();
    @Test void retainsEveryExistingPagedJsonField() {
        var page=new PageImpl<>(List.of("a","b"),PageRequest.of(2,2,Sort.by("name")),10);
        assertEquals(json.valueToTree(page),json.valueToTree(PageResponse.from(page)));
    }
    @Test void representsEmptyLastAndUnsortedPages() {
        var page=new PageImpl<String>(List.of(),PageRequest.of(3,10),25);
        var dto=PageResponse.from(page);assertTrue(dto.last());assertTrue(dto.empty());assertFalse(dto.first());
        assertEquals(25,dto.totalElements());assertEquals(3,dto.number());assertTrue(dto.sort().unsorted());
    }
    @Test void supportsUnpagedApplicationCallersWithoutOffsetExceptions() {
        var dto=PageResponse.from(new PageImpl<>(List.of("a")));assertTrue(dto.pageable().unpaged());assertEquals(0,dto.pageable().offset());
    }
}
