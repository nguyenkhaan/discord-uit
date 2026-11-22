
package com.cloudian.backend.modules.call;

import java.io.IOException;
import java.util.List;

import livekit.LivekitModels;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.cloudian.backend.exceptions.ApiException;

import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels.ParticipantInfo;
import livekit.LivekitModels.Room;
import retrofit2.Response;

import java.util.Optional;

import livekit.LivekitModels.ParticipantPermission;
import livekit.LivekitModels.TrackInfo;
import livekit.LivekitModels.TrackSource;

@Service
public class LiveKitRoomService {

    private static final int MAX_PARTICIPANTS = 30;
    /** Sources every participant may publish (must match LiveKitTokenService). */
    private static final List<TrackSource> DEFAULT_SOURCES = List.of(
            TrackSource.CAMERA,
            TrackSource.MICROPHONE);

    /** Sources of the single active screen sharer. */
    private static final List<TrackSource> SHARER_SOURCES = List.of(
            TrackSource.CAMERA,
            TrackSource.MICROPHONE,
            TrackSource.SCREEN_SHARE,
            TrackSource.SCREEN_SHARE_AUDIO);

    private final RoomServiceClient roomServiceClient;

    public LiveKitRoomService(RoomServiceClient roomServiceClient) {
        this.roomServiceClient = roomServiceClient;
    }

    /**
     * Creates a LiveKit room with a maximum of 30 participants.
     */
    public void createRoom(String roomName) {

        try {
            Response<Room> response = roomServiceClient
                    .createRoom(roomName, null, MAX_PARTICIPANTS)
                    .execute();

            if (!response.isSuccessful()) {
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "LiveKit room creation failed. HTTP status: "
                                + response.code());
            }

            if (response.body() == null) {
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "LiveKit returned an empty room response.");
            }

        } catch (IOException e) {
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to connect to LiveKit when creating the room.");
        }
    }

    /**
     * Deletes a LiveKit room.
     */
    public void deleteRoom(String roomName) {

        try {
            Response<Void> response = roomServiceClient
                    .deleteRoom(roomName)
                    .execute();

            // A room that has already been deleted is considered successful.
            if (!response.isSuccessful() && response.code() != 404) {
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "LiveKit room deletion failed. HTTP status: "
                                + response.code());
            }

        } catch (IOException e) {
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to connect to LiveKit when deleting the room.");
        }
    }

    /**
     * Removes a participant from a LiveKit room.
     */
    public void removeParticipant(String roomName, String identity) {

        try {
            Response<Void> response = roomServiceClient
                    .removeParticipant(roomName, identity)
                    .execute();

            if (!response.isSuccessful() && response.code() != 404) {
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "Failed to remove participant from LiveKit. HTTP status: "
                                + response.code());
            }

        } catch (IOException e) {
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to connect to LiveKit when removing participant.");
        }
    }

    /**
     * Lists the participants currently connected to a LiveKit room.
     */
    public List<ParticipantInfo> listParticipants(String roomName) {

        try {
            Response<List<ParticipantInfo>> response = roomServiceClient
                    .listParticipants(roomName)
                    .execute();

            if (!response.isSuccessful()) {
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "Failed to list LiveKit participants. HTTP status: "
                                + response.code());
            }

            List<ParticipantInfo> participants = response.body();
            return participants != null ? participants : List.of();

        } catch (IOException e) {
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to connect to LiveKit when listing participants.");
        }
    }

    /**
     * Grants or revokes the right to publish a screen share.
     */
    public void setScreenShareAllowed(
            String roomName,
            String identity,
            boolean allowed) {

        // UpdateParticipant replaces the WHOLE permission object,
        // so every flag from the join token must be repeated here.
        ParticipantPermission permission = ParticipantPermission.newBuilder()
                .setCanSubscribe(true)
                .setCanPublish(true)
                .setCanPublishData(true)
                .addAllCanPublishSources(allowed ? SHARER_SOURCES : DEFAULT_SOURCES)
                .build();

        try {
            Response<ParticipantInfo> response = roomServiceClient
                    .updateParticipant(roomName, identity, null, null, permission)
                    .execute();

            // Revoking for someone who already left the room is fine.
            boolean alreadyGone = !allowed && response.code() == 404;

            if (!response.isSuccessful() && !alreadyGone) {
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "LiveKit permission update failed. HTTP status: "
                                + response.code());
            }

        } catch (IOException e) {
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to connect to LiveKit when updating permissions.");
        }
    }

    /**
     * Returns the sid of a participant's published, unmuted track of a source.
     */
    public Optional<String> findPublishedTrackSid(
            String roomName,
            String identity,
            TrackSource source) {

        return listParticipants(roomName).stream()
                .filter(participant -> identity.equals(participant.getIdentity()))
                .flatMap(participant -> participant.getTracksList().stream())
                .filter(track -> track.getSource() == source && !track.getMuted())
                .map(TrackInfo::getSid)
                .findFirst();
    }

    /**
     * Server-side mute of a published track.
     */
    public void muteTrack(String roomName, String identity, String trackSid) {

        try {
            Response<TrackInfo> response = roomServiceClient
                    .mutePublishedTrack(roomName, identity, trackSid, true)
                    .execute();

            if (!response.isSuccessful()) {
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "LiveKit track mute failed. HTTP status: "
                                + response.code());
            }

        } catch (IOException e) {
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to connect to LiveKit when muting a track.");
        }
    }
}
