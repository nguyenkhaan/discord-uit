package com.cloudian.backend.modules.forum;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.forum.dto.CreateForumPostRequest;
import com.cloudian.backend.modules.forum.dto.ForumPostListRequest;
import com.cloudian.backend.modules.forum.dto.ForumPostPageResponse;
import com.cloudian.backend.modules.forum.dto.ForumPostResponse;
import com.cloudian.backend.modules.forum.dto.MyForumPostPageResponse;
import com.cloudian.backend.modules.forum.dto.UpdateForumPostRequest;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/forum/posts")
@RequiredArgsConstructor
public class ForumPostController {

    private final ForumPostService postService;

    /** Bài đã duyệt, tìm theo tiêu đề (q) và chủ đề (topics) */
    @GetMapping
    public ForumPostPageResponse search(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute ForumPostListRequest request) {
        return postService.search(principal.getUserId(), request);
    }

    /** Bài của tôi ở mọi trạng thái */
    @GetMapping("/mine")
    public MyForumPostPageResponse listMine(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute ForumPostListRequest request) {
        return postService.listMine(principal.getUserId(), request);
    }

    @GetMapping("/{postId}")
    public ForumPostResponse get(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("postId") UUID postId) {
        return postService.get(postId, principal.getUserId());
    }

    /** Đăng bài, bài chờ duyệt */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ForumPostResponse create(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateForumPostRequest request) {
        return postService.create(principal.getUserId(), request);
    }

    /** Sửa bài, bài quay lại chờ duyệt */
    @PutMapping("/{postId}")
    public ForumPostResponse update(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("postId") UUID postId,
            @Valid @RequestBody UpdateForumPostRequest request) {
        return postService.update(postId, principal.getUserId(), request);
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("postId") UUID postId) {
        postService.delete(postId, principal.getUserId());
    }
}
