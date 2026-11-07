package com.pipre.backend.application.dto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import java.util.List;

/** Stable JSON compatible with the existing PageImpl consumers, without serializing framework internals. */
public record PageResponse<T>(List<T> content,Pagination pageable,long totalElements,int totalPages,
        boolean last,int size,int number,Ordering sort,int numberOfElements,boolean first,boolean empty) {
    public record Ordering(boolean sorted,boolean unsorted,boolean empty) {
        static Ordering from(Sort sort) {return new Ordering(sort.isSorted(),sort.isUnsorted(),sort.isEmpty());}
    }
    public record Pagination(int pageNumber,int pageSize,Ordering sort,long offset,boolean paged,boolean unpaged) {}
    public static <T> PageResponse<T> from(Page<T> page) {
        var ordering=Ordering.from(page.getSort());var request=page.getPageable();
        var pagination=new Pagination(page.getNumber(),page.getSize(),ordering,request.isPaged()?request.getOffset():0,request.isPaged(),request.isUnpaged());
        return new PageResponse<>(List.copyOf(page.getContent()),pagination,page.getTotalElements(),page.getTotalPages(),
            page.isLast(),page.getSize(),page.getNumber(),ordering,page.getNumberOfElements(),page.isFirst(),page.isEmpty());
    }
}
