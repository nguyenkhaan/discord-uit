export interface CallSessionStartResponse {
    callSessionId: string;
    roomName: string;
    status: 'ACTIVE' | 'ENDED';
    startedAt: string;
}

export interface LiveKitJoinResponse {
    callSessionId: string;
    roomName: string;
    serverUrl: string;
    token: string;
}

export interface CallConnection {
    response: LiveKitJoinResponse;
    /** True only when this browser created the call during this connection flow. */
    isCoordinator: boolean;
}

export interface ActiveCallParticipant {
    userId: string;
    fullName: string | null;
}

/** Snapshot of the server's active call, shown on the pre-join screen. */
export interface ActiveCallResponse {
    callSessionId: string;
    startedAt: string;
    coordinatorUserId: string;
    coordinatorFullName: string | null;
    participantCount: number;
    maxParticipants: number;
    participants: ActiveCallParticipant[];
}
