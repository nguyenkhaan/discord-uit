
package com.cloudian.backend.modules.call;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.cloudian.backend.exceptions.ApiException;

import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels.ParticipantInfo;
import livekit.LivekitModels.Room;
import retrofit2.Response;

@Service
public class LiveKitRoomService {

    private static final int MAX_PARTICIPANTS = 30;

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
}
