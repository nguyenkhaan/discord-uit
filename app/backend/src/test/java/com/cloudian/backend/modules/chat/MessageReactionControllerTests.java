
package com.cloudian.backend.modules.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.chat.dto.AddMessageReactionRequest;
import com.cloudian.backend.modules.chat.dto.MessageReactionItemResponse;
import com.cloudian.backend.modules.chat.dto.MessageReactionListResponse;
import com.cloudian.backend.security.CustomUserDetails;

class MessageReactionControllerTests {

    private static final UUID SERVER_ID = UUID.randomUUID();
    private static final UUID MESSAGE_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID ICON_ID = UUID.randomUUID();

    private final MessageReactionService reactionService = mock(MessageReactionService.class);

    private final MessageReactionController controller = new MessageReactionController(reactionService);

    private CustomUserDetails createPrincipal() {
        UserAccount user = new UserAccount();
        user.setId(USER_ID);
        user.setEmail("test@example.com");
        user.setPasswordHash("password-hash");
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setSystemRole(SystemRole.USER);

        return new CustomUserDetails(user);
    }

    private MessageReactionListResponse sampleResponse() {
        MessageReactionItemResponse reaction = new MessageReactionItemResponse(
                ICON_ID,
                "like.png",
                "Like",
                3L,
                true);

        return new MessageReactionListResponse(
                MESSAGE_ID,
                List.of(reaction));
    }

    @Test
    void getReactionsReturnsReactionList() {
        CustomUserDetails principal = createPrincipal();

        MessageReactionListResponse expectedResponse = sampleResponse();

        when(reactionService.getReactions(
                SERVER_ID, MESSAGE_ID, USER_ID))
                .thenReturn(expectedResponse);

        MessageReactionListResponse response = controller.getReactions(
                SERVER_ID,
                MESSAGE_ID,
                principal);

        assertThat(response).isEqualTo(expectedResponse);
        assertThat(response.messageId()).isEqualTo(MESSAGE_ID);
        assertThat(response.reactions()).hasSize(1);

        verify(reactionService).getReactions(
                SERVER_ID, MESSAGE_ID, USER_ID);
    }

    @Test
    void addReactionPassesAuthenticatedUserAndIconIdToService() {
        CustomUserDetails principal = createPrincipal();

        AddMessageReactionRequest request = new AddMessageReactionRequest(ICON_ID);

        MessageReactionListResponse expectedResponse = sampleResponse();

        when(reactionService.addReaction(
                SERVER_ID, MESSAGE_ID, USER_ID, ICON_ID))
                .thenReturn(expectedResponse);

        MessageReactionListResponse response = controller.addReaction(
                SERVER_ID,
                MESSAGE_ID,
                principal,
                request);

        assertThat(response).isEqualTo(expectedResponse);

        verify(reactionService).addReaction(
                SERVER_ID, MESSAGE_ID, USER_ID, ICON_ID);
    }

    @Test
    void removeReactionPassesAuthenticatedUserToService() {
        CustomUserDetails principal = createPrincipal();

        MessageReactionListResponse expectedResponse = new MessageReactionListResponse(MESSAGE_ID, List.of());

        when(reactionService.removeReaction(
                SERVER_ID, MESSAGE_ID, USER_ID))
                .thenReturn(expectedResponse);

        MessageReactionListResponse response = controller.removeReaction(
                SERVER_ID,
                MESSAGE_ID,
                principal);

        assertThat(response).isEqualTo(expectedResponse);
        assertThat(response.reactions()).isEmpty();

        verify(reactionService).removeReaction(
                SERVER_ID, MESSAGE_ID, USER_ID);
    }
}
