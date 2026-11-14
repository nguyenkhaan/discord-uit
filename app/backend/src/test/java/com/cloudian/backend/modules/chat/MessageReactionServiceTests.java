
package com.cloudian.backend.modules.chat;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.chat.dto.MessageReactionListResponse;
import com.cloudian.backend.repositories.ChatMessageRepository;
import com.cloudian.backend.repositories.MessageReactionRepository;
import com.cloudian.backend.repositories.ReactIconRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.MessageReactionRepository.ReactionAggregate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MessageReactionServiceTests {

    private static final UUID SERVER_ID = UUID.fromString("0f8fad5b-d9cb-469f-a165-70867728950e");

    private static final UUID MESSAGE_ID = UUID.fromString("11111111-1111-4111-8111-111111111111");

    private static final UUID USER_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    private static final UUID LIKE_ICON_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    private static final UUID LOVE_ICON_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

    @Mock
    private ChatMessageRepository messageRepository;

    @Mock
    private ServerMembershipRepository membershipRepository;

    @Mock
    private ReactIconRepository reactIconRepository;

    @Mock
    private MessageReactionRepository reactionRepository;

    @InjectMocks
    private MessageReactionService service;

    private ChatMessage message;

    @BeforeEach
    void setUp() {
        Server server = new Server();
        server.setId(SERVER_ID);

        UserAccount sender = new UserAccount();
        sender.setId(USER_ID);

        message = new ChatMessage();
        message.setId(MESSAGE_ID);
        message.setServer(server);
        message.setSender(sender);
        message.setContentText("Hello");
        message.setClientRequestId(UUID.randomUUID());
        message.setCreatedAt(Instant.now());
    }

    private void mockActiveMember() {
        when(membershipRepository.findActiveRole(SERVER_ID, USER_ID))
                .thenReturn(Optional.of(ServerMemberRole.MEMBER));
    }

    private void mockExistingMessage() {
        when(messageRepository.findByIdAndServerIdForUpdate(SERVER_ID, MESSAGE_ID))
                .thenReturn(Optional.of(message));
    }

    /**
     * Tạo projection giả mà không dùng Mockito mock().
     * Tránh lỗi UnfinishedStubbingException khi tạo aggregate
     * bên trong when().thenReturn().
     */
    private ReactionAggregate aggregate(
            UUID iconId,
            String iconImage,
            String name,
            long count,
            long currentUserCount) {

        return new ReactionAggregate() {
            @Override
            public UUID getIconId() {
                return iconId;
            }

            @Override
            public String getIconImage() {
                return iconImage;
            }

            @Override
            public String getName() {
                return name;
            }

            @Override
            public Long getReactionCount() {
                return count;
            }

            @Override
            public Long getCurrentUserReactionCount() {
                return currentUserCount;
            }
        };
    }

    @Test
    void addReactionSuccessfully() {
        mockActiveMember();
        mockExistingMessage();

        when(reactIconRepository.existsById(LIKE_ICON_ID))
                .thenReturn(true);

        when(reactionRepository.upsertReaction(
                MESSAGE_ID, USER_ID, LIKE_ICON_ID))
                .thenReturn(1);

        ReactionAggregate like = aggregate(
                LIKE_ICON_ID, "like.png", "Like", 1L, 1L);

        when(reactionRepository.findAggregatesByMessageIdAndUserId(
                MESSAGE_ID, USER_ID))
                .thenReturn(List.of(like));

        MessageReactionListResponse response = service.addReaction(
                SERVER_ID, MESSAGE_ID, USER_ID, LIKE_ICON_ID);

        assertThat(response.messageId()).isEqualTo(MESSAGE_ID);
        assertThat(response.reactions()).hasSize(1);

        assertThat(response.reactions().get(0).iconId())
                .isEqualTo(LIKE_ICON_ID);

        assertThat(response.reactions().get(0).count())
                .isEqualTo(1L);

        assertThat(response.reactions().get(0).reactedByMe())
                .isTrue();

        verify(reactionRepository).upsertReaction(
                MESSAGE_ID, USER_ID, LIKE_ICON_ID);
    }

    @Test
    void selectingAnotherIconReplacesPreviousReaction() {
        mockActiveMember();
        mockExistingMessage();

        when(reactIconRepository.existsById(LOVE_ICON_ID))
                .thenReturn(true);

        when(reactionRepository.upsertReaction(
                MESSAGE_ID, USER_ID, LOVE_ICON_ID))
                .thenReturn(1);

        ReactionAggregate love = aggregate(
                LOVE_ICON_ID, "love.png", "Love", 1L, 1L);

        when(reactionRepository.findAggregatesByMessageIdAndUserId(
                MESSAGE_ID, USER_ID))
                .thenReturn(List.of(love));

        MessageReactionListResponse response = service.addReaction(
                SERVER_ID, MESSAGE_ID, USER_ID, LOVE_ICON_ID);

        assertThat(response.reactions()).hasSize(1);

        assertThat(response.reactions().get(0).iconId())
                .isEqualTo(LOVE_ICON_ID);

        assertThat(response.reactions().get(0).reactedByMe())
                .isTrue();

        verify(reactionRepository).upsertReaction(
                MESSAGE_ID, USER_ID, LOVE_ICON_ID);
    }

    @Test
    void selectingSameIconDoesNotCreateAnotherReaction() {
        mockActiveMember();
        mockExistingMessage();

        when(reactIconRepository.existsById(LIKE_ICON_ID))
                .thenReturn(true);

        // Upsert trả về 0 nếu icon đã là reaction hiện tại.
        when(reactionRepository.upsertReaction(
                MESSAGE_ID, USER_ID, LIKE_ICON_ID))
                .thenReturn(0);

        ReactionAggregate like = aggregate(
                LIKE_ICON_ID, "like.png", "Like", 1L, 1L);

        when(reactionRepository.findAggregatesByMessageIdAndUserId(
                MESSAGE_ID, USER_ID))
                .thenReturn(List.of(like));

        MessageReactionListResponse response = service.addReaction(
                SERVER_ID, MESSAGE_ID, USER_ID, LIKE_ICON_ID);

        assertThat(response.reactions()).hasSize(1);
        assertThat(response.reactions().get(0).count()).isEqualTo(1L);
        assertThat(response.reactions().get(0).reactedByMe()).isTrue();

        verify(reactionRepository).upsertReaction(
                MESSAGE_ID, USER_ID, LIKE_ICON_ID);
    }

    @Test
    void removeReactionSuccessfully() {
        mockActiveMember();
        mockExistingMessage();

        when(reactionRepository.deleteReaction(MESSAGE_ID, USER_ID))
                .thenReturn(1);

        when(reactionRepository.findAggregatesByMessageIdAndUserId(
                MESSAGE_ID, USER_ID))
                .thenReturn(List.of());

        MessageReactionListResponse response = service.removeReaction(SERVER_ID, MESSAGE_ID, USER_ID);

        assertThat(response.messageId()).isEqualTo(MESSAGE_ID);
        assertThat(response.reactions()).isEmpty();

        verify(reactionRepository).deleteReaction(MESSAGE_ID, USER_ID);
    }

    @Test
    void getReactionsSuccessfully() {
        mockActiveMember();

        when(messageRepository.findByIdAndServer_Id(MESSAGE_ID, SERVER_ID))
                .thenReturn(Optional.of(message));

        ReactionAggregate like = aggregate(
                LIKE_ICON_ID, "like.png", "Like", 3L, 1L);

        ReactionAggregate love = aggregate(
                LOVE_ICON_ID, "love.png", "Love", 2L, 0L);

        when(reactionRepository.findAggregatesByMessageIdAndUserId(
                MESSAGE_ID, USER_ID))
                .thenReturn(List.of(like, love));

        MessageReactionListResponse response = service.getReactions(SERVER_ID, MESSAGE_ID, USER_ID);

        assertThat(response.messageId()).isEqualTo(MESSAGE_ID);
        assertThat(response.reactions()).hasSize(2);

        assertThat(response.reactions())
                .anySatisfy(reaction -> {
                    assertThat(reaction.iconId()).isEqualTo(LIKE_ICON_ID);
                    assertThat(reaction.count()).isEqualTo(3L);
                    assertThat(reaction.reactedByMe()).isTrue();
                });

        assertThat(response.reactions())
                .anySatisfy(reaction -> {
                    assertThat(reaction.iconId()).isEqualTo(LOVE_ICON_ID);
                    assertThat(reaction.count()).isEqualTo(2L);
                    assertThat(reaction.reactedByMe()).isFalse();
                });
    }

    @Test
    void cannotReactWhenUserIsNotActiveMember() {
        when(membershipRepository.findActiveRole(SERVER_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addReaction(
                SERVER_ID, MESSAGE_ID, USER_ID, LIKE_ICON_ID))
                .isInstanceOf(ApiException.class);

        verifyNoInteractions(reactionRepository);
    }

    @Test
    void cannotReactToNonExistingMessage() {
        mockActiveMember();

        when(messageRepository.findByIdAndServerIdForUpdate(
                SERVER_ID, MESSAGE_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addReaction(
                SERVER_ID, MESSAGE_ID, USER_ID, LIKE_ICON_ID))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus())
                                .isEqualTo(HttpStatus.NOT_FOUND));

        verifyNoInteractions(reactionRepository);
    }

    @Test
    void cannotReactWithNonExistingIcon() {
        mockActiveMember();
        mockExistingMessage();

        when(reactIconRepository.existsById(LIKE_ICON_ID))
                .thenReturn(false);

        assertThatThrownBy(() -> service.addReaction(
                SERVER_ID, MESSAGE_ID, USER_ID, LIKE_ICON_ID))
                .isInstanceOf(ApiException.class);

        verify(reactionRepository, never())
                .upsertReaction(any(), any(), any());
    }

    @Test
    void cannotReactToDeletedMessage() {
        mockActiveMember();

        message.setDeletedAt(Instant.now());
        mockExistingMessage();

        assertThatThrownBy(() -> service.addReaction(
                SERVER_ID, MESSAGE_ID, USER_ID, LIKE_ICON_ID))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus())
                                .isEqualTo(HttpStatus.CONFLICT));

        verifyNoInteractions(reactionRepository);
    }
}
