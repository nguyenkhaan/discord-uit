package com.cloudian.backend.modules.serverinvite;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.List;

import com.cloudian.backend.modules.serverinvite.dto.DeclineInviteResponse;
import com.cloudian.backend.modules.notification.NotificationService;
import com.cloudian.backend.modules.serverinvite.dto.AcceptInviteResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cloudian.backend.modules.serverinvite.dto.JoinServerInviteResponse;
import com.cloudian.backend.models.ServerMembership;
import com.cloudian.backend.commons.enums.ServerInviteStatus;
import com.cloudian.backend.commons.enums.ServerInviteType;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.commons.enums.ServerInviteType;
import com.cloudian.backend.modules.serverinvite.dto.InviteLinkResponse;
import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.models.ServerInvite;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.repositories.ServerInviteRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.utils.TokenHashUtil;
import com.cloudian.backend.modules.serverinvite.dto.CreateInviteLinkRequest;
import com.cloudian.backend.modules.serverinvite.dto.CreateInviteLinkResponse;
import com.cloudian.backend.modules.serverinvite.dto.InviteLinkResponse;
import com.cloudian.backend.modules.serverinvite.dto.InviteLinkDetailsResponse;
import com.cloudian.backend.modules.serverinvite.dto.CreateDirectInviteRequest;
import com.cloudian.backend.modules.serverinvite.dto.DirectInviteResponse;
import com.cloudian.backend.modules.serverinvite.dto.MyDirectInviteResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ServerInviteService {

    private final ServerInviteRepository serverInviteRepository;
    private final ServerRepository serverRepository;
    private final ServerMembershipRepository serverMembershipRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService;

    @Value("${app.server-invite-base-url}")
    private String inviteBaseUrl;

    @Transactional
    public CreateInviteLinkResponse createInviteLink(
            UUID serverId,
            UUID currentUserId,
            CreateInviteLinkRequest request) {
        // 1. Tìm server còn hoạt động
        Server server = serverRepository.findByIdAndDeletedAtIsNull(serverId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Server not found."));

        // 2. Kiểm tra quyền Owner
        boolean isOwner = serverMembershipRepository
                .existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                        serverId,
                        currentUserId,
                        com.cloudian.backend.commons.enums.ServerMemberRole.OWNER);

        if (!isOwner) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only the server owner can create invite links.");
        }

        // 3. Tìm tài khoản người tạo lời mời
        UserAccount creator = userAccountRepository.findById(currentUserId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "User account not found."));

        // 4. Tạo token và hash token
        String rawToken = TokenHashUtil.generateToken();
        String tokenHash = TokenHashUtil.sha256Hex(rawToken);

        // 5. Tạo Entity ServerInvite
        Instant now = Instant.now();

        ServerInvite invite = new ServerInvite();
        invite.setServer(server);
        invite.setCreatedBy(creator);
        invite.setTokenHash(tokenHash);
        invite.setInviteType(ServerInviteType.LINK);
        invite.setStatus(ServerInviteStatus.PENDING);
        invite.setMaxUses(request.maxUses());
        invite.setUseCount(0);
        invite.setCreatedAt(now);

        if (request.expiresInHours() != null) {
            invite.setExpiresAt(
                    now.plus(request.expiresInHours(), ChronoUnit.HOURS));
        }

        // 6. Lưu vào database
        ServerInvite savedInvite = serverInviteRepository.save(invite);

        // 7. Xây dựng URL và trả response
        String inviteUrl = inviteBaseUrl + "/" + rawToken;

        return new CreateInviteLinkResponse(
                savedInvite.getId(),
                inviteUrl,
                savedInvite.getMaxUses(),
                savedInvite.getUseCount(),
                savedInvite.getExpiresAt(),
                savedInvite.getStatus());
    }

    @Transactional
    public void revokeInviteLink(
            UUID serverId,
            UUID inviteId,
            UUID currentUserId) {
        // 1. Kiểm tra server có tồn tại và chưa bị xóa
        Server server = serverRepository.findByIdAndDeletedAtIsNull(serverId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Server not found."));

        // 2. Kiểm tra người dùng có phải OWNER không
        boolean isOwner = serverMembershipRepository
                .existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                        serverId,
                        currentUserId,
                        ServerMemberRole.OWNER);

        if (!isOwner) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only the server owner can revoke invite links.");
        }

        // 3. Tìm invite thuộc đúng server
        ServerInvite invite = serverInviteRepository
                .findByIdAndServer_Id(inviteId, serverId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Invite link not found."));

        // 4. Chỉ cho phép thu hồi link đang PENDING
        if (invite.getStatus() != ServerInviteStatus.PENDING) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending invite links can be revoked.");
        }

        // 5. Cập nhật trạng thái
        invite.setStatus(ServerInviteStatus.REVOKED);

        // 6. Lưu thay đổi
        serverInviteRepository.save(invite);
    }

    @Transactional(readOnly = true)
    public List<InviteLinkResponse> getInviteLinks(
            UUID serverId,
            UUID currentUserId) {
        // 1. Kiểm tra server tồn tại
        Server server = serverRepository.findByIdAndDeletedAtIsNull(serverId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Server not found."));

        // 2. Kiểm tra người dùng có phải OWNER không
        boolean isOwner = serverMembershipRepository
                .existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                        serverId,
                        currentUserId,
                        ServerMemberRole.OWNER);

        if (!isOwner) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only the server owner can view invite links.");
        }

        // 3. Lấy danh sách invite link thuộc server
        List<ServerInvite> invites = serverInviteRepository.findByServer_IdAndInviteType(
                serverId,
                ServerInviteType.LINK);

        // 4. Chuyển Entity thành DTO
        return invites.stream()
                .map(invite -> new InviteLinkResponse(
                        invite.getId(),
                        invite.getMaxUses(),
                        invite.getUseCount(),
                        invite.getExpiresAt(),
                        invite.getStatus()))
                .toList();
    }

    @Transactional(readOnly = true)
    public InviteLinkDetailsResponse getInviteLinkDetails(String rawToken) {

        String tokenHash = TokenHashUtil.sha256Hex(rawToken);

        ServerInvite invite = serverInviteRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Invite link not found."));

        if (invite.getStatus() != ServerInviteStatus.PENDING) {
            throw new ApiException(
                    HttpStatus.GONE,
                    "Invite link is no longer available.");
        }

        Instant now = Instant.now();

        if (invite.getExpiresAt() != null
                && !invite.getExpiresAt().isAfter(now)) {
            throw new ApiException(
                    HttpStatus.GONE,
                    "Invite link has expired.");
        }

        if (invite.getUseCount() >= invite.getMaxUses()) {
            throw new ApiException(
                    HttpStatus.GONE,
                    "Invite link has reached its usage limit.");
        }

        Server server = invite.getServer();

        return new InviteLinkDetailsResponse(
                server.getId(),
                server.getName(),
                server.getGroupImageUrl(),
                invite.getStatus(),
                invite.getExpiresAt(),
                invite.getMaxUses(),
                invite.getUseCount());
    }

    @Transactional
    public JoinServerInviteResponse joinServerByInviteLink(
            String rawToken,
            UUID currentUserId) {
        // 1. Hash token để tìm invite
        String tokenHash = TokenHashUtil.sha256Hex(rawToken);

        // 2. Khóa invite trong transaction để tránh vượt maxUses
        ServerInvite invite = serverInviteRepository
                .findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Invite link not found."));

        // 3. Kiểm tra loại invite
        if (invite.getInviteType() != ServerInviteType.LINK) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This invite is not a link invite.");
        }

        // 4. Kiểm tra trạng thái
        if (invite.getStatus() != ServerInviteStatus.PENDING) {
            throw new ApiException(
                    HttpStatus.GONE,
                    "Invite link is no longer available.");
        }

        // 5. Kiểm tra server còn hoạt động
        Server server = serverRepository
                .findByIdAndDeletedAtIsNull(invite.getServer().getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Server not found."));

        // 6. Kiểm tra thời hạn
        Instant now = Instant.now();

        if (invite.getExpiresAt() != null
                && !invite.getExpiresAt().isAfter(now)) {

            invite.setStatus(ServerInviteStatus.EXPIRED);

            throw new ApiException(
                    HttpStatus.GONE,
                    "Invite link has expired.");
        }

        // 7. Kiểm tra giới hạn lượt sử dụng
        if (invite.getUseCount() >= invite.getMaxUses()) {
            throw new ApiException(
                    HttpStatus.GONE,
                    "Invite link has reached its usage limit.");
        }

        // 8. Kiểm tra người dùng đã là thành viên đang hoạt động chưa
        boolean alreadyMember = serverMembershipRepository
                .findByServer_IdAndUser_IdAndLeftAtIsNull(
                        server.getId(),
                        currentUserId)
                .isPresent();

        if (alreadyMember) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "You are already a member of this server.");
        }

        // 9. Tìm tài khoản người dùng
        UserAccount user = userAccountRepository
                .findById(currentUserId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "User account not found."));

        // 10. Tạo membership mới với vai trò MEMBER
        ServerMembership membership = new ServerMembership();
        membership.setServer(server);
        membership.setUser(user);
        membership.setRole(ServerMemberRole.MEMBER);
        membership.setJoinedAt(now);

        serverMembershipRepository.save(membership);

        // 11. Tăng số lượt sử dụng
        invite.setUseCount(invite.getUseCount() + 1);

        // 12. Lưu thay đổi invite
        serverInviteRepository.save(invite);

        return new JoinServerInviteResponse(
                server.getId(),
                server.getName(),
                "Successfully joined the server.");
    }

    @Transactional
    public DirectInviteResponse createDirectInvite(
            UUID serverId,
            UUID currentUserId,
            CreateDirectInviteRequest request) {

        // 1. Kiểm tra server tồn tại và chưa bị xóa
        Server server = serverRepository.findByIdAndDeletedAtIsNull(serverId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Server not found."));

        // 2. Kiểm tra người gửi có phải OWNER không
        boolean isOwner = serverMembershipRepository
                .existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                        serverId,
                        currentUserId,
                        ServerMemberRole.OWNER);

        if (!isOwner) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only the server owner can send direct invites.");
        }

        // 3. Kiểm tra người nhận tồn tại
        UserAccount recipient = userAccountRepository.findById(request.recipientId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Recipient user not found."));

        // 4. Không gửi lời mời cho người đã là thành viên
        boolean alreadyMember = serverMembershipRepository
                .findByServer_IdAndUser_IdAndLeftAtIsNull(
                        serverId,
                        recipient.getId())
                .isPresent();

        if (alreadyMember) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Recipient is already a member of this server.");
        }

        // 5. Không tạo lời mời PENDING trùng lặp
        boolean hasPendingInvite = serverInviteRepository
                .existsByServer_IdAndRecipient_IdAndStatus(
                        serverId,
                        recipient.getId(),
                        ServerInviteStatus.PENDING);

        if (hasPendingInvite) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "A pending invite already exists for this user.");
        }

        // 6. Tìm tài khoản OWNER gửi lời mời
        UserAccount creator = userAccountRepository.findById(currentUserId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "User account not found."));

        // 7. Tạo direct invite
        Instant now = Instant.now();

        ServerInvite invite = new ServerInvite();
        invite.setServer(server);
        invite.setCreatedBy(creator);
        invite.setRecipient(recipient);
        invite.setInviteType(ServerInviteType.DIRECT);
        invite.setStatus(ServerInviteStatus.PENDING);
        invite.setUseCount(0);
        invite.setCreatedAt(now);

        // 8. Lưu lời mời
        ServerInvite savedInvite = serverInviteRepository.save(invite);

        // 9. Tạo notification cho người nhận lời mời
        notificationService.createServerInvitationNotification(
                creator,
                recipient,
                savedInvite.getId(),
                server.getName());

        // 10. Trả response
        return new DirectInviteResponse(
                savedInvite.getId(),
                server.getId(),
                recipient.getId(),
                savedInvite.getStatus(),
                savedInvite.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<MyDirectInviteResponse> getMyDirectInvites(UUID currentUserId) {

        List<ServerInvite> invites = serverInviteRepository
                .findByRecipient_IdAndInviteTypeAndStatusOrderByCreatedAtDesc(
                        currentUserId,
                        ServerInviteType.DIRECT,
                        ServerInviteStatus.PENDING);

        return invites.stream()
                .map(invite -> new MyDirectInviteResponse(
                        invite.getId(),
                        invite.getServer().getId(),
                        invite.getServer().getName(),
                        invite.getCreatedBy().getEmail(),
                        invite.getStatus(),
                        invite.getCreatedAt()))
                .toList();
    }

    @Transactional
    public AcceptInviteResponse acceptDirectInvite(
            UUID inviteId,
            UUID currentUserId) {

        // 1. Tìm và khóa lời mời
        ServerInvite invite = serverInviteRepository
                .findByIdForUpdate(inviteId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Invite not found."));

        // 2. Chỉ người nhận mới được chấp nhận lời mời
        if (invite.getRecipient() == null
                || !invite.getRecipient().getId().equals(currentUserId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to accept this invite.");
        }

        // 3. Chỉ xử lý direct invite
        if (invite.getInviteType() != ServerInviteType.DIRECT) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This is not a direct invite.");
        }

        // 4. Lời mời phải đang chờ xử lý
        if (invite.getStatus() != ServerInviteStatus.PENDING) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "This invite is no longer pending.");
        }

        // 5. Kiểm tra server còn hoạt động
        Server server = serverRepository
                .findByIdAndDeletedAtIsNull(invite.getServer().getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Server not found."));

        // 6. Kiểm tra người dùng chưa là thành viên
        boolean alreadyMember = serverMembershipRepository
                .findByServer_IdAndUser_IdAndLeftAtIsNull(
                        server.getId(),
                        currentUserId)
                .isPresent();

        if (alreadyMember) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "You are already a member of this server.");
        }

        // 7. Lấy tài khoản người nhận
        UserAccount user = userAccountRepository
                .findById(currentUserId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "User account not found."));

        // 8. Tạo membership mới
        Instant now = Instant.now();

        ServerMembership membership = new ServerMembership();
        membership.setServer(server);
        membership.setUser(user);
        membership.setRole(ServerMemberRole.MEMBER);
        membership.setJoinedAt(now);

        serverMembershipRepository.save(membership);

        // 9. Cập nhật trạng thái lời mời
        invite.setStatus(ServerInviteStatus.ACCEPTED);
        invite.setAcceptedAt(now);

        serverInviteRepository.save(invite);

        // 10. Trả kết quả
        return new AcceptInviteResponse(
                invite.getId(),
                server.getId(),
                server.getName(),
                invite.getStatus(),
                invite.getAcceptedAt(),
                "Invite accepted successfully.");
    }

    @Transactional
    public DeclineInviteResponse declineDirectInvite(
            UUID inviteId,
            UUID currentUserId) {

        // 1. Tìm và khóa lời mời
        ServerInvite invite = serverInviteRepository
                .findByIdForUpdate(inviteId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Invite not found."));

        // 2. Kiểm tra người nhận
        if (invite.getRecipient() == null
                || !invite.getRecipient().getId().equals(currentUserId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to decline this invite.");
        }

        // 3. Chỉ xử lý direct invite
        if (invite.getInviteType() != ServerInviteType.DIRECT) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This is not a direct invite.");
        }

        // 4. Chỉ cho phép từ chối lời mời đang chờ
        if (invite.getStatus() != ServerInviteStatus.PENDING) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "This invite is no longer pending.");
        }

        // 5. Cập nhật trạng thái
        Instant now = Instant.now();

        invite.setStatus(ServerInviteStatus.DECLINED);
        invite.setDeclinedAt(now);

        serverInviteRepository.save(invite);

        // 6. Trả kết quả
        return new DeclineInviteResponse(
                invite.getId(),
                invite.getStatus(),
                invite.getDeclinedAt(),
                "Invite declined successfully.");
    }
}